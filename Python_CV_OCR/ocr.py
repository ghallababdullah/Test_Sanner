import json
import os
from dataclasses import dataclass
from typing import Any


FIELD_CONFIGS: dict[str, dict[str, Any]] = {
    "surname": {"lang": "rus"},
    "name": {"lang": "rus"},
    "class": {"lang": "rus+eng"},
    "date": {"lang": "rus"},
}


@dataclass
class OcrFieldResult:
    text: str | None
    confidence: float | None
    status: str
    engine: str
    source_path: str
    metadata: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        payload = {
            "text": self.text,
            "confidence": self.confidence,
            "status": self.status,
            "engine": self.engine,
            "sourcePath": self.source_path,
        }
        if self.metadata:
            payload["metadata"] = self.metadata
        return payload


class BaseOcrProvider:
    engine_name = "unconfigured"
    status = "not_configured"

    def recognize_field(self, roi_name: str, image_path: str) -> OcrFieldResult:
        raise NotImplementedError


class UnavailableOcrProvider(BaseOcrProvider):
    def recognize_field(self, roi_name: str, image_path: str) -> OcrFieldResult:
        return OcrFieldResult(
            text=None,
            confidence=None,
            status=self.status,
            engine=self.engine_name,
            source_path=image_path,
        )


class TrOcrProvider(BaseOcrProvider):
    engine_name = "trocr"
    status = "ready"

    def __init__(self) -> None:
        import torch
        from PIL import Image
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel

        model_id = os.getenv("TROCR_MODEL_ID", "raxtemur/trocr-base-ru")
        requested_device = os.getenv("TROCR_DEVICE", "auto").lower()
        if requested_device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            device = requested_device

        self._torch = torch
        self._image_cls = Image
        self._processor = TrOCRProcessor.from_pretrained(model_id)
        self._model = VisionEncoderDecoderModel.from_pretrained(model_id)
        self._model.to(device)
        self._model.eval()
        self._device = device
        self._max_new_tokens = int(os.getenv("TROCR_MAX_NEW_TOKENS", "32"))

    def recognize_field(self, roi_name: str, image_path: str) -> OcrFieldResult:
        meta = load_empty_meta(image_path)
        if meta is not None and meta.get("is_empty") is True:
            return OcrFieldResult(
                text=None,
                confidence=1.0,
                status="empty",
                engine=self.engine_name,
                source_path=image_path,
            )

        if not os.path.exists(image_path):
            return OcrFieldResult(
                text=None,
                confidence=None,
                status="image_read_failed",
                engine=self.engine_name,
                source_path=image_path,
            )

        try:
            image = self._image_cls.open(image_path).convert("RGB")
        except Exception:
            return OcrFieldResult(
                text=None,
                confidence=None,
                status="image_read_failed",
                engine=self.engine_name,
                source_path=image_path,
            )

        try:
            pixel_values = self._processor(images=image, return_tensors="pt").pixel_values.to(self._device)
            with self._torch.no_grad():
                generated = self._model.generate(
                    pixel_values,
                    max_new_tokens=self._max_new_tokens,
                    return_dict_in_generate=True,
                    output_scores=True,
                )
            text = self._processor.batch_decode(generated.sequences, skip_special_tokens=True)[0].strip() or None
            confidence = estimate_generation_confidence(generated.scores, generated.sequences)
            return OcrFieldResult(
                text=text,
                confidence=confidence,
                status="ok" if text else "empty",
                engine=self.engine_name,
                source_path=image_path,
            )
        except Exception as exc:
            return OcrFieldResult(
                text=None,
                confidence=None,
                status=f"ocr_failed: {exc}",
                engine=self.engine_name,
                source_path=image_path,
            )


class PytesseractOcrProvider(BaseOcrProvider):
    engine_name = "tesseract"
    status = "ready"

    def __init__(self) -> None:
        import pytesseract

        tesseract_cmd = os.getenv("TESSERACT_CMD")
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        self._pytesseract = pytesseract
        self._default_lang = os.getenv("OCR_LANG", "rus+eng")

    def recognize_field(self, roi_name: str, image_path: str) -> OcrFieldResult:
        import cv2

        meta_path = os.path.splitext(image_path)[0] + ".meta.json"
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as meta_file:
                    meta = json.load(meta_file)
                if meta.get("is_empty") is True:
                    return OcrFieldResult(
                        text=None,
                        confidence=1.0,
                        status="empty",
                        engine=self.engine_name,
                        source_path=image_path,
                    )
            except Exception:
                pass

        image = cv2.imread(image_path)
        if image is None:
            return OcrFieldResult(
                text=None,
                confidence=None,
                status="image_read_failed",
                engine=self.engine_name,
                source_path=image_path,
            )

        config = self._get_field_config(roi_name)
        lang = config.get("lang", self._default_lang)
        tesseract_config_parts: list[str] = []
        psm = config.get("psm")
        if psm is not None:
            tesseract_config_parts.append(f"--psm {psm}")
        whitelist = config.get("whitelist")
        if whitelist:
            tesseract_config_parts.append(f"-c tessedit_char_whitelist={whitelist}")
        tesseract_config = " ".join(tesseract_config_parts)

        try:
            data = self._pytesseract.image_to_data(
                image,
                output_type=self._pytesseract.Output.DICT,
                lang=lang,
                config=tesseract_config,
            )
        except Exception as exc:
            return OcrFieldResult(
                text=None,
                confidence=None,
                status=f"ocr_failed: {exc}",
                engine=self.engine_name,
                source_path=image_path,
            )

        tokens: list[str] = []
        confidences: list[float] = []
        for token, confidence_raw in zip(data.get("text", []), data.get("conf", [])):
            token = (token or "").strip()
            if not token:
                continue
            try:
                confidence = float(confidence_raw)
            except (TypeError, ValueError):
                continue
            if confidence < 0:
                continue
            tokens.append(token)
            confidences.append(confidence)

        text = " ".join(tokens).strip() or None
        confidence = round(sum(confidences) / len(confidences) / 100.0, 4) if confidences else None
        status = "ok" if text else "empty"
        return OcrFieldResult(
            text=text,
            confidence=confidence,
            status=status,
            engine=self.engine_name,
            source_path=image_path,
        )

    def _get_field_config(self, roi_name: str) -> dict[str, Any]:
        if roi_name in FIELD_CONFIGS:
            return FIELD_CONFIGS[roi_name]
        if roi_name.startswith("q"):
            return {"lang": "rus"}
        if roi_name.endswith("_answer"):
            return {"lang": "rus"}
        if roi_name.endswith("_num"):
            return {"lang": "rus"}
        return {"lang": self._default_lang}


def create_ocr_provider() -> BaseOcrProvider:
    try:
        return PytesseractOcrProvider()
    except Exception:
        return UnavailableOcrProvider()


def create_trocr_provider() -> BaseOcrProvider:
    if os.getenv("OCR_ENABLE_TROCR", "true").lower() not in {"1", "true", "yes", "on"}:
        return UnavailableOcrProvider()
    try:
        return TrOcrProvider()
    except Exception:
        return UnavailableOcrProvider()


def normalize_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.split()).strip()
    return cleaned or None


def normalize_answer(value: str | None) -> str | None:
    normalized = normalize_text(value)
    if normalized is None:
        return None
    return normalized.replace(" ", "").upper()


def normalize_question_number(value: str | None) -> str | None:
    normalized = normalize_answer(value)
    if normalized is None:
        return None
    digits_only = "".join(ch for ch in normalized if ch.isdigit())
    if not digits_only:
        return normalized
    return str(int(digits_only))


def looks_like_noise(value: str | None) -> bool:
    normalized = normalize_text(value)
    if normalized is None:
        return True

    compact = normalized.replace(" ", "")
    if not compact:
        return True

    meaningful = sum(ch.isalnum() for ch in compact)
    if meaningful == 0:
        return True

    special = len(compact) - meaningful
    return special > meaningful


def looks_like_correction_noise(value: str | None) -> bool:
    normalized = normalize_text(value)
    if normalized is None:
        return True
    if looks_like_noise(normalized):
        return True

    compact = normalized.replace(" ", "")
    tokens = [token for token in normalized.split() if token]
    allowed_symbols = {",", ".", "-"}
    meaningful_chars = sum(ch.isalnum() or ch in allowed_symbols for ch in compact)
    if meaningful_chars < len(compact):
        return True

    short_tokens = sum(len(token) <= 2 for token in tokens)
    if len(tokens) >= 3 and short_tokens >= len(tokens) - 1:
        return True

    letters = sum(ch.isalpha() for ch in compact)
    digits = sum(ch.isdigit() for ch in compact)
    if letters == 0 and digits == 0:
        return True

    if letters > 0 and len(tokens) >= 4 and max(len(token) for token in tokens) <= 2:
        return True

    return False


def accept_correction_num(text: str | None, confidence: float | None) -> str | None:
    normalized = normalize_question_number(text)
    if normalized is None:
        return None
    try:
        question_number = int(normalized)
    except ValueError:
        return None
    if question_number < 1 or question_number > 32:
        return None
    return str(question_number)


def accept_correction_answer(text: str | None, confidence: float | None) -> str | None:
    normalized = normalize_answer(text)
    if normalized is None:
        return None
    if confidence is None or confidence < 0.45:
        return None
    if looks_like_correction_noise(text):
        return None
    return normalized


def is_correction_num_field(roi_name: str) -> bool:
    return roi_name.startswith("corr") and roi_name.endswith("_num")


def is_correction_answer_field(roi_name: str) -> bool:
    return roi_name.startswith("corr") and roi_name.endswith("_answer")


def prioritize_image_paths(roi_name: str, image_paths: list[str]) -> list[str]:
    if not image_paths:
        return image_paths
    if roi_name.startswith("corr"):
        return sorted(image_paths, key=lambda path: 0 if path.endswith("_trimmed.png") else 1)
    return image_paths


def should_skip_trocr_for_correction_num(text: str | None) -> bool:
    normalized = normalize_text(text)
    if normalized is None:
        return False
    compact = normalized.replace(" ", "")
    if not compact:
        return False
    if not any(ch.isdigit() for ch in compact):
        return True
    return looks_like_noise(normalized)


def should_skip_trocr_for_correction_answer(text: str | None) -> bool:
    normalized = normalize_text(text)
    if normalized is None:
        return False
    return looks_like_correction_noise(normalized)


def build_non_review_correction_result(
    roi_name: str,
    threshold: float,
    tesseract_result: OcrFieldResult,
    reason: str,
) -> OcrFieldResult:
    return OcrFieldResult(
        text=None,
        confidence=tesseract_result.confidence,
        status="empty",
        engine=tesseract_result.engine,
        source_path=tesseract_result.source_path,
        metadata={
            "cascadeStage": 1,
            "acceptedByCascade": False,
            "manualReviewRequired": False,
            "threshold": threshold,
            "tesseractText": tesseract_result.text,
            "tesseractConfidence": tesseract_result.confidence,
            "skipReason": reason,
            "fieldType": "correction",
        },
    )


def get_cascade_threshold() -> float:
    return float(os.getenv("OCR_CASCADE_THRESHOLD", "0.75"))


def derive_payload_ocr_status(
    primary_provider: BaseOcrProvider,
    fallback_provider: BaseOcrProvider,
    ocr_fields: dict[str, dict[str, Any]],
) -> str:
    if primary_provider.status != "ready" and fallback_provider.status != "ready":
        return primary_provider.status

    for field in ocr_fields.values():
        field_status = field.get("status")
        if isinstance(field_status, str) and field_status.startswith("ocr_failed"):
            return field_status

    return "completed"


def build_ocr_payload(
    source_image_path: str,
    processed_image_path: str | None,
    output_dir: str,
    clean_crops: dict[str, str],
) -> dict[str, Any]:
    provider = create_ocr_provider()
    ocr_fields: dict[str, dict[str, Any]] = {}
    confidences: list[float] = []
    warnings: list[str] = []

    if provider.status != "ready":
        warnings.append("OCR engine is not configured. Install pytesseract and Tesseract OCR, or set TESSERACT_CMD.")

    for roi_name, crop_path in sorted(clean_crops.items()):
        result = provider.recognize_field(roi_name, crop_path)
        ocr_fields[roi_name] = result.to_dict()
        if result.confidence is not None:
            confidences.append(result.confidence)

    surname = normalize_text(ocr_fields.get("surname", {}).get("text"))
    name = normalize_text(ocr_fields.get("name", {}).get("text"))
    student_name = normalize_text("".join(part for part in [surname, name] if part))
    student_class = normalize_text(ocr_fields.get("class", {}).get("text"))
    detected_test_date = normalize_text(ocr_fields.get("date", {}).get("text"))

    answers: dict[str, str] = {}
    for question_number in range(1, 33):
        field_name = f"q{question_number}"
        normalized = normalize_answer(ocr_fields.get(field_name, {}).get("text"))
        if normalized:
            answers[str(question_number)] = normalized

    error_corrections: dict[str, str] = {}
    for correction_index in range(1, 9):
        num_field = f"corr{correction_index}_num"
        answer_field = f"corr{correction_index}_answer"
        question_number = accept_correction_num(
            ocr_fields.get(num_field, {}).get("text"),
            ocr_fields.get(num_field, {}).get("confidence"),
        )
        if question_number is None:
            continue

        corrected_answer = accept_correction_answer(
            ocr_fields.get(answer_field, {}).get("text"),
            ocr_fields.get(answer_field, {}).get("confidence"),
        )
        if corrected_answer is not None:
            error_corrections[question_number] = corrected_answer

    overall_confidence = round(sum(confidences) / len(confidences), 4) if confidences else None

    ocr_status = derive_payload_ocr_status(provider, ocr_fields)

    return {
        "sourceImagePath": source_image_path,
        "processedImagePath": processed_image_path,
        "outputDir": output_dir,
        "ocrStatus": ocr_status,
        "ocrEngine": provider.engine_name,
        "studentName": student_name,
        "studentClass": student_class,
        "detectedTestDate": detected_test_date,
        "answers": answers,
        "errorCorrections": error_corrections or None,
        "overallConfidence": overall_confidence,
        "warnings": warnings or None,
        "fields": ocr_fields,
    }


ADAPTIVE_FIELD_CONFIGS: dict[str, dict[str, Any]] = {
    "surname": {"lang": "rus", "psm_candidates": [7, 13]},
    "name": {"lang": "rus", "psm_candidates": [7, 13]},
    "class": {"lang": "rus+eng", "psm_candidates": [7, 13]},
    "date": {"lang": "eng", "psm_candidates": [7, 13], "whitelist": "0123456789./-"},
}


def get_adaptive_field_config(roi_name: str, default_lang: str) -> dict[str, Any]:
    if roi_name in ADAPTIVE_FIELD_CONFIGS:
        return ADAPTIVE_FIELD_CONFIGS[roi_name]
    if roi_name.startswith("q"):
        return {"lang": "rus", "psm_candidates": [7, 13]}
    if roi_name.endswith("_answer"):
        return {"lang": "rus", "psm_candidates": [7, 13], "min_confidence": 0.45}
    if roi_name.endswith("_num"):
        return {
            "lang": "eng",
            "psm_candidates": [10, 8, 13],
            "whitelist": "0123456789",
            "min_confidence": 0.30,
        }
    return {"lang": default_lang, "psm_candidates": [7, 13]}


def prepare_image_for_ocr(image_path: str):
    import cv2

    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if image is None:
        return None
    h, w = image.shape[:2]
    target_h = max(72, h)
    scale = target_h / max(1, h)
    target_w = max(1, int(round(w * scale)))
    resized = cv2.resize(image, (target_w, target_h), interpolation=cv2.INTER_CUBIC)
    return cv2.copyMakeBorder(resized, 10, 10, 10, 10, cv2.BORDER_CONSTANT, value=255)


def load_empty_meta(image_path: str) -> dict[str, Any] | None:
    meta_path = os.path.splitext(image_path)[0] + ".meta.json"
    if not os.path.exists(meta_path):
        return None
    try:
        with open(meta_path, "r", encoding="utf-8") as meta_file:
            return json.load(meta_file)
    except Exception:
        return None


def score_ocr_candidate(roi_name: str, text: str | None, confidence: float | None, source_path: str) -> float:
    normalized = normalize_text(text)
    conf = confidence or 0.0
    if normalized is None:
        return conf - 0.5

    compact = normalized.replace(" ", "")
    score = conf + min(len(compact), 12) * 0.015

    if roi_name == "date":
        valid = sum(ch.isdigit() or ch in "./-" for ch in compact)
        score += 0.20 * (valid / max(1, len(compact)))
    elif roi_name.endswith("_num"):
        digits = sum(ch.isdigit() for ch in compact)
        score += 0.25 * (digits / max(1, len(compact)))
    else:
        letters = sum(("А" <= ch <= "я") or ch in "Ёё-" for ch in compact)
        score += 0.18 * (letters / max(1, len(compact)))

    if "char_rebuild" in source_path:
        score += 0.03
    return score


def estimate_generation_confidence(scores, sequences) -> float | None:
    if not scores:
        return None
    try:
        sequence_token_ids = sequences[0, -len(scores):]
        probabilities: list[float] = []
        for step_scores, token_id in zip(scores, sequence_token_ids):
            probs = step_scores.softmax(dim=-1)
            probabilities.append(float(probs[0, token_id].item()))
        if not probabilities:
            return None
        return round(sum(probabilities) / len(probabilities), 4)
    except Exception:
        return None


def recognize_field_adaptive(provider: BaseOcrProvider, roi_name: str, image_paths: list[str]) -> OcrFieldResult:
    if provider.status != "ready":
        image_path = image_paths[0] if image_paths else ""
        return provider.recognize_field(roi_name, image_path)

    if not image_paths:
        return OcrFieldResult(
            text=None,
            confidence=None,
            status="missing_image",
            engine=provider.engine_name,
            source_path="",
        )

    config = get_adaptive_field_config(roi_name, getattr(provider, "_default_lang", "rus+eng"))
    pytesseract = getattr(provider, "_pytesseract", None)
    if pytesseract is None:
        return provider.recognize_field(roi_name, image_paths[0])

    best_result: OcrFieldResult | None = None
    best_score = float("-inf")
    min_confidence = config.get("min_confidence")
    for image_path in prioritize_image_paths(roi_name, image_paths):
        meta = load_empty_meta(image_path)
        if meta is not None and meta.get("is_empty") is True:
            return OcrFieldResult(
                text=None,
                confidence=1.0,
                status="empty",
                engine=provider.engine_name,
                source_path=image_path,
            )

        prepared = prepare_image_for_ocr(image_path)
        if prepared is None:
            continue

        for psm in config.get("psm_candidates", [7]):
            parts: list[str] = []
            if psm is not None:
                parts.append(f"--psm {psm}")
            whitelist = config.get("whitelist")
            if whitelist:
                parts.append(f"-c tessedit_char_whitelist={whitelist}")
            tesseract_config = " ".join(parts)

            try:
                data = pytesseract.image_to_data(
                    prepared,
                    output_type=pytesseract.Output.DICT,
                    lang=config.get("lang", getattr(provider, "_default_lang", "rus+eng")),
                    config=tesseract_config,
                )
            except Exception as exc:
                candidate = OcrFieldResult(
                    text=None,
                    confidence=None,
                    status=f"ocr_failed: {exc}",
                    engine=provider.engine_name,
                    source_path=image_path,
                )
                score = score_ocr_candidate(roi_name, candidate.text, candidate.confidence, image_path)
                if score > best_score:
                    best_score = score
                    best_result = candidate
                continue

            tokens: list[str] = []
            confidences: list[float] = []
            for token, confidence_raw in zip(data.get("text", []), data.get("conf", [])):
                token = (token or "").strip()
                if not token:
                    continue
                try:
                    confidence = float(confidence_raw)
                except (TypeError, ValueError):
                    continue
                if confidence < 0:
                    continue
                tokens.append(token)
                confidences.append(confidence)

            text = " ".join(tokens).strip() or None
            confidence = round(sum(confidences) / len(confidences) / 100.0, 4) if confidences else None
            candidate = OcrFieldResult(
                text=text,
                confidence=confidence,
                status="ok" if text else "empty",
                engine=provider.engine_name,
                source_path=image_path,
            )
            if text and min_confidence is not None and confidence is not None and confidence < min_confidence:
                candidate = OcrFieldResult(
                    text=text,
                    confidence=confidence,
                    status="low_confidence",
                    engine=provider.engine_name,
                    source_path=image_path,
                )
            score = score_ocr_candidate(roi_name, candidate.text, candidate.confidence, image_path)
            if score > best_score:
                best_score = score
                best_result = candidate

    if best_result is not None:
        return best_result

    return OcrFieldResult(
        text=None,
        confidence=None,
        status="image_read_failed",
        engine=provider.engine_name,
        source_path=image_paths[0],
    )


def recognize_field_with_trocr(provider: BaseOcrProvider, roi_name: str, image_paths: list[str]) -> OcrFieldResult:
    if provider.status != "ready":
        image_path = image_paths[0] if image_paths else ""
        return provider.recognize_field(roi_name, image_path)

    best_result: OcrFieldResult | None = None
    best_score = float("-inf")
    for image_path in prioritize_image_paths(roi_name, image_paths):
        result = provider.recognize_field(roi_name, image_path)
        score = score_ocr_candidate(roi_name, result.text, result.confidence, image_path)
        if score > best_score:
            best_score = score
            best_result = result

    if best_result is not None:
        return best_result

    return OcrFieldResult(
        text=None,
        confidence=None,
        status="missing_image",
        engine=provider.engine_name,
        source_path=image_paths[0] if image_paths else "",
    )


def recognize_field_cascade(
    tesseract_provider: BaseOcrProvider,
    trocr_provider: BaseOcrProvider,
    roi_name: str,
    image_paths: list[str],
) -> OcrFieldResult:
    threshold = get_cascade_threshold()
    tesseract_result = recognize_field_adaptive(tesseract_provider, roi_name, image_paths)
    tesseract_confidence = tesseract_result.confidence or 0.0

    if is_correction_num_field(roi_name):
        if accept_correction_num(tesseract_result.text, tesseract_result.confidence) is None and should_skip_trocr_for_correction_num(tesseract_result.text):
            return build_non_review_correction_result(
                roi_name,
                threshold,
                tesseract_result,
                "invalid_correction_number",
            )

    if is_correction_answer_field(roi_name):
        if accept_correction_answer(tesseract_result.text, tesseract_result.confidence) is None and should_skip_trocr_for_correction_answer(tesseract_result.text):
            return build_non_review_correction_result(
                roi_name,
                threshold,
                tesseract_result,
                "invalid_correction_answer",
            )

    if tesseract_result.text and tesseract_confidence >= threshold:
        tesseract_result.metadata = {
            "cascadeStage": 1,
            "acceptedByCascade": True,
            "manualReviewRequired": False,
            "threshold": threshold,
            "tesseractConfidence": tesseract_result.confidence,
        }
        return tesseract_result

    trocr_result = recognize_field_with_trocr(trocr_provider, roi_name, image_paths)
    trocr_confidence = trocr_result.confidence or 0.0

    if is_correction_num_field(roi_name) and accept_correction_num(trocr_result.text, trocr_result.confidence) is None:
        if accept_correction_num(tesseract_result.text, tesseract_result.confidence) is None:
            return build_non_review_correction_result(
                roi_name,
                threshold,
                tesseract_result,
                "invalid_correction_number",
            )

    if is_correction_answer_field(roi_name) and accept_correction_answer(trocr_result.text, trocr_result.confidence) is None:
        if accept_correction_answer(tesseract_result.text, tesseract_result.confidence) is None:
            return build_non_review_correction_result(
                roi_name,
                threshold,
                tesseract_result,
                "invalid_correction_answer",
            )

    if trocr_result.text and trocr_confidence >= threshold:
        trocr_result.metadata = {
            "cascadeStage": 2,
            "acceptedByCascade": True,
            "manualReviewRequired": False,
            "threshold": threshold,
            "tesseractText": tesseract_result.text,
            "tesseractConfidence": tesseract_result.confidence,
            "trocrConfidence": trocr_result.confidence,
        }
        return trocr_result

    candidates = [candidate for candidate in [tesseract_result, trocr_result] if candidate.text]
    if candidates:
        best_candidate = max(candidates, key=lambda item: item.confidence or 0.0)
    else:
        best_candidate = trocr_result if trocr_result.confidence is not None else tesseract_result

    best_candidate.metadata = {
        "cascadeStage": 3,
        "acceptedByCascade": False,
        "manualReviewRequired": True,
        "threshold": threshold,
        "tesseractText": tesseract_result.text,
        "tesseractConfidence": tesseract_result.confidence,
        "trocrText": trocr_result.text,
        "trocrConfidence": trocr_result.confidence,
        "bestHintEngine": best_candidate.engine,
    }
    if best_candidate.status == "ok":
        best_candidate.status = "manual_review_required"
    return best_candidate


def build_ocr_payload(
    source_image_path: str,
    processed_image_path: str | None,
    output_dir: str,
    clean_crops: dict[str, list[str]],
) -> dict[str, Any]:
    tesseract_provider = create_ocr_provider()
    trocr_provider = create_trocr_provider()
    ocr_fields: dict[str, dict[str, Any]] = {}
    confidences: list[float] = []
    warnings: list[str] = []

    if tesseract_provider.status != "ready":
        warnings.append("OCR engine is not configured. Install pytesseract and Tesseract OCR, or set TESSERACT_CMD.")
    if trocr_provider.status != "ready":
        warnings.append("TrOCR fallback is not configured. Install transformers/torch and download the TrOCR model.")

    for roi_name, crop_paths in sorted(clean_crops.items()):
        result = recognize_field_cascade(tesseract_provider, trocr_provider, roi_name, crop_paths)
        ocr_fields[roi_name] = result.to_dict()
        if result.confidence is not None:
            confidences.append(result.confidence)

    surname = normalize_text(ocr_fields.get("surname", {}).get("text"))
    name = normalize_text(ocr_fields.get("name", {}).get("text"))
    student_name = normalize_text("".join(part for part in [surname, name] if part))
    student_class = normalize_text(ocr_fields.get("class", {}).get("text"))
    detected_test_date = normalize_text(ocr_fields.get("date", {}).get("text"))

    answers: dict[str, str] = {}
    for question_number in range(1, 33):
        field_name = f"q{question_number}"
        normalized = normalize_answer(ocr_fields.get(field_name, {}).get("text"))
        if normalized:
            answers[str(question_number)] = normalized

    error_corrections: dict[str, str] = {}
    for correction_index in range(1, 9):
        num_field = f"corr{correction_index}_num"
        answer_field = f"corr{correction_index}_answer"
        question_number = accept_correction_num(
            ocr_fields.get(num_field, {}).get("text"),
            ocr_fields.get(num_field, {}).get("confidence"),
        )
        if question_number is None:
            continue

        corrected_answer = accept_correction_answer(
            ocr_fields.get(answer_field, {}).get("text"),
            ocr_fields.get(answer_field, {}).get("confidence"),
        )
        if corrected_answer is not None:
            error_corrections[question_number] = corrected_answer

    final_answers = dict(answers)
    for question_number, corrected_answer in error_corrections.items():
        final_answers[question_number] = corrected_answer

    overall_confidence = round(sum(confidences) / len(confidences), 4) if confidences else None

    ocr_status = derive_payload_ocr_status(tesseract_provider, trocr_provider, ocr_fields)
    manual_review_fields = [
        field_name
        for field_name, field_value in ocr_fields.items()
        if isinstance(field_value.get("metadata"), dict)
        and field_value["metadata"].get("manualReviewRequired") is True
    ]

    return {
        "sourceImagePath": source_image_path,
        "processedImagePath": processed_image_path,
        "outputDir": output_dir,
        "ocrStatus": ocr_status,
        "ocrEngine": "cascade:tesseract->trocr",
        "studentName": student_name,
        "studentClass": student_class,
        "detectedTestDate": detected_test_date,
        "answers": answers,
        "errorCorrections": error_corrections or None,
        "finalAnswers": final_answers,
        "isErrorCorrectionApplied": bool(error_corrections),
        "overallConfidence": overall_confidence,
        "manualReviewRequired": bool(manual_review_fields),
        "manualReviewFields": manual_review_fields or None,
        "warnings": warnings or None,
        "fields": ocr_fields,
    }


def save_ocr_payload(payload: dict[str, Any], output_path: str) -> None:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as file_obj:
        json.dump(payload, file_obj, ensure_ascii=False, indent=2)
