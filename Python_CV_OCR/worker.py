import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from datetime import datetime, timezone
from typing import Any

import pika

from ocr_pipeline import build_payload_for_image, build_result_event


RABBIT_HOST = os.getenv("RABBIT_HOST", "localhost")
RABBIT_PORT = int(os.getenv("RABBIT_PORT", "5672"))
RABBIT_USER = os.getenv("RABBIT_USER", "scanner")
RABBIT_PASS = os.getenv("RABBIT_PASS", "scanner_pass")
SCAN_EXCHANGE = os.getenv("SCAN_EXCHANGE", "scan.exchange")
SCAN_REQUEST_QUEUE = os.getenv("SCAN_REQUEST_QUEUE", "scan.ocr.request.queue")
SCAN_REQUEST_ROUTING_KEY = os.getenv("SCAN_REQUEST_ROUTING_KEY", "scan.ocr.requested")
SCAN_RESULT_QUEUE = os.getenv("SCAN_RESULT_QUEUE", "scan.ocr.result.queue")
SCAN_RESULT_ROUTING_KEY = os.getenv("SCAN_RESULT_ROUTING_KEY", "scan.ocr.completed")
RABBIT_HEARTBEAT = int(os.getenv("RABBIT_HEARTBEAT", "600"))
RABBIT_BLOCKED_CONNECTION_TIMEOUT = int(os.getenv("RABBIT_BLOCKED_CONNECTION_TIMEOUT", "300"))
OCR_PROCESSING_TIMEOUT = int(os.getenv("OCR_PROCESSING_TIMEOUT", "1800"))
HEARTBEAT_POLL_INTERVAL = float(os.getenv("HEARTBEAT_POLL_INTERVAL", "1.0"))

OCR_EXECUTOR = ThreadPoolExecutor(max_workers=1, thread_name_prefix="ocr-worker")


def decode_message(body: bytes) -> dict[str, Any]:
    payload = json.loads(body.decode("utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Expected JSON object payload")
    return payload


def print_job(payload: dict[str, Any]) -> None:
    print("\n[worker] Received OCR job")
    print(f"  eventId:        {payload.get('eventId')}")
    print(f"  occurredAt:     {payload.get('occurredAt')}")
    print(f"  blankId:        {payload.get('blankId')}")
    print(f"  scanSessionId:  {payload.get('scanSessionId')}")
    print(f"  testId:         {payload.get('testId')}")
    print(f"  testDate:       {payload.get('testDate')}")
    print(f"  imagePath:      {payload.get('imagePath')}")


def resolve_image_path(image_path: str | None) -> str:
    if not image_path:
        raise ValueError("Message does not contain imagePath")
    normalized = os.path.normpath(image_path)
    if not os.path.isabs(normalized):
        normalized = os.path.abspath(normalized)
    return normalized


def publish_result(channel, result_event: dict[str, Any]) -> None:
    body = json.dumps(result_event, ensure_ascii=False).encode("utf-8")
    channel.basic_publish(
        exchange=SCAN_EXCHANGE,
        routing_key=SCAN_RESULT_ROUTING_KEY,
        body=body,
        properties=pika.BasicProperties(
            content_type="application/json",
            delivery_mode=2,
        ),
    )
    print(f"[worker] Published result event with status={result_event.get('status')}")


def publish_processing_event(channel, job_payload: dict[str, Any], image_path: str) -> None:
    processing_event = {
        "eventId": job_payload.get("eventId"),
        "occurredAt": datetime.now(timezone.utc).isoformat(),
        "blankId": job_payload.get("blankId"),
        "scanSessionId": job_payload.get("scanSessionId"),
        "testId": job_payload.get("testId"),
        "status": "PROCESSING",
        "studentName": None,
        "studentClass": None,
        "answers": {},
        "errorCorrections": None,
        "overallConfidence": None,
        "processedImagePath": image_path,
        "processingError": None,
    }
    publish_result(channel, processing_event)


def run_ocr_with_heartbeat(channel, image_path: str):
    future = OCR_EXECUTOR.submit(build_payload_for_image, image_path)
    started_at = time.monotonic()
    while True:
        try:
            return future.result(timeout=HEARTBEAT_POLL_INTERVAL)
        except FutureTimeoutError:
            elapsed = time.monotonic() - started_at
            if elapsed > OCR_PROCESSING_TIMEOUT:
                future.cancel()
                raise TimeoutError(f"OCR processing exceeded timeout of {OCR_PROCESSING_TIMEOUT} seconds")
            if channel.connection.is_closed:
                raise ConnectionError("AMQP connection closed while OCR was still running")
            channel.connection.process_data_events(time_limit=0)


def on_message(channel, method, properties, body: bytes) -> None:
    try:
        payload = decode_message(body)
        print_job(payload)
        image_path = resolve_image_path(payload.get("imagePath"))
        publish_processing_event(channel, payload, image_path)
        result_payload = run_ocr_with_heartbeat(channel, image_path)
        if result_payload is None:
            raise RuntimeError(f"OCR pipeline returned no result for imagePath={image_path}")

        result_event = build_result_event(payload, result_payload)
        publish_result(channel, result_event)
        channel.basic_ack(delivery_tag=method.delivery_tag)
        print("[worker] Message acknowledged")
    except Exception as exc:
        print(f"[worker] Failed to process message: {exc}")
        try:
            payload = decode_message(body)
        except Exception:
            payload = {}
        failure_event = build_result_event(payload, None, str(exc))
        try:
            publish_result(channel, failure_event)
            channel.basic_ack(delivery_tag=method.delivery_tag)
            print("[worker] Failure event published and original message acknowledged")
        except Exception as publish_exc:
            print(f"[worker] Failed to publish failure event: {publish_exc}")
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def connect() -> pika.BlockingConnection:
    credentials = pika.PlainCredentials(RABBIT_USER, RABBIT_PASS)
    parameters = pika.ConnectionParameters(
        host=RABBIT_HOST,
        port=RABBIT_PORT,
        credentials=credentials,
        heartbeat=RABBIT_HEARTBEAT,
        blocked_connection_timeout=RABBIT_BLOCKED_CONNECTION_TIMEOUT,
    )
    return pika.BlockingConnection(parameters)


def main() -> None:
    print("[worker] Starting RabbitMQ OCR worker")
    print(f"[worker] RabbitMQ host: {RABBIT_HOST}:{RABBIT_PORT}")
    print(f"[worker] Queue: {SCAN_REQUEST_QUEUE}")
    print(f"[worker] Heartbeat: {RABBIT_HEARTBEAT}s, blocked timeout: {RABBIT_BLOCKED_CONNECTION_TIMEOUT}s")
    print(f"[worker] OCR timeout: {OCR_PROCESSING_TIMEOUT}s")

    while True:
        try:
            connection = connect()
            channel = connection.channel()

            # Declare the same queue/exchange contract as Spring so local tests are robust.
            channel.exchange_declare(
                exchange=SCAN_EXCHANGE,
                exchange_type="topic",
                durable=True,
            )
            channel.queue_declare(queue=SCAN_REQUEST_QUEUE, durable=True)
            channel.queue_declare(queue=SCAN_RESULT_QUEUE, durable=True)
            channel.queue_bind(
                queue=SCAN_REQUEST_QUEUE,
                exchange=SCAN_EXCHANGE,
                routing_key=SCAN_REQUEST_ROUTING_KEY,
            )
            channel.queue_bind(
                queue=SCAN_RESULT_QUEUE,
                exchange=SCAN_EXCHANGE,
                routing_key=SCAN_RESULT_ROUTING_KEY,
            )

            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(
                queue=SCAN_REQUEST_QUEUE,
                on_message_callback=on_message,
            )

            print("[worker] Waiting for messages. Press Ctrl+C to stop.")
            channel.start_consuming()
        except KeyboardInterrupt:
            print("\n[worker] Stopping worker")
            return
        except Exception as exc:
            print(f"[worker] Connection/consumer error: {exc}")
            print("[worker] Retrying in 5 seconds...")
            time.sleep(5)


if __name__ == "__main__":
    main()
