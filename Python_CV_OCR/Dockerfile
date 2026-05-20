FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-rus libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-worker.txt ./
RUN pip install --no-cache-dir -r requirements-worker.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV TESSERACT_CMD=/usr/bin/tesseract

CMD ["python", "worker.py"]
