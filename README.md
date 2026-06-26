# 📝 ScanProverka

> Full-stack microservices  web application that grades handwritten exam answer sheets from a phone photo — using Computer Vision and Transformer-based OCR.

[🇷🇺 Русская версия](README.ru.md) · [🌐 Live Demo](#) · [🎬 Video Demo](#)

[![Java](https://img.shields.io/badge/Java-24-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-6DB33F?logo=spring)](https://spring.io/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600?logo=rabbitmq)](https://www.rabbitmq.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4-5C3EE8?logo=opencv)](https://opencv.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2-EE4C2C?logo=pytorch)](https://pytorch.org/)

---

## What it does

A teacher takes a phone photo of a completed answer sheet → the app normalizes the geometry, extracts each answer field, recognizes handwritten Cyrillic text, compares results to the reference answers, and produces a graded report.

Fully deployed, containerized, end-to-end working system.

## Architecture

```
React/TS  ──HTTPS──►  Spring Boot  ──AMQP──►  Python Worker
(Frontend)            (Java 24)               (CV + OCR)
                          │                        │
                       PostgreSQL              RabbitMQ
```

**6 Docker containers**, asynchronous task processing, stateless backend.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Java 24, Spring Boot 4, Spring Security, Spring AMQP, Hibernate, JWT |
| **Frontend** | React 18, TypeScript, Vite, Nginx |
| **CV / OCR** | Python 3.11, OpenCV, PyTorch, HuggingFace Transformers, Tesseract, TrOCR |
| **Data** | PostgreSQL 16, RabbitMQ 3.13 (manual ACK) |
| **DevOps** | Docker, Docker Compose, Nginx (HTTPS) |

## Engineering Highlights

- 🔄 **Async microservices** — REST + AMQP, manual ACK for reliable task delivery
- 🧠 **Cascade OCR algorithm** — Tesseract → TrOCR fallback with a 0.75 confidence threshold; **2× faster** than pure TrOCR with comparable accuracy
- 🔍 **End-to-end CV pipeline** — Canny edge detection, homography, CLAHE, adaptive binarization, grid-line removal via connected components
- 🔐 **Production-grade security** — JWT in HttpOnly cookies, Spring Security, parameterized queries, stateless backend
- 🐳 **One-command deployment** — `docker compose up -d`
- 📐 **Domain-Driven Design** — 10 backend modules with clear separation of concerns

## Demo

🌐 **Live:** [https://skanproverka.ru:8443/]

## About

Currently open to **Backend Engineer**, **Computer Vision Engineer**, and **Full-stack Developer** roles — Russia and international.

### Contact

- 💼 [LinkedIn](https://www.linkedin.com/in/abdullah-ghallab-12ba22335/)
- 📧 abdullahghallab20@gmail.com
- 💬 Telegram: [@AMGAbdullah](https://t.me/AMGAbdullah)

---

📄 MIT License — see [LICENSE](LICENSE)
