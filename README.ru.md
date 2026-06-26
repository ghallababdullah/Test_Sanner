# 📝 ScanProverka

> Full-stack микросервисное приложение для автоматизированной проверки рукописных бланков ответов по фотографии с телефона — на основе компьютерного зрения и нейросетевого OCR.

[🇬🇧 English version](README.md) · [🌐 Live Demo](#) · [🎬 Video Demo](#)

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

## Что делает

Учитель фотографирует заполненный бланк ответов с телефона → приложение нормализует геометрию, извлекает каждое поле ответа, распознаёт рукописный кириллический текст, сравнивает с эталонами и формирует отчёт о проверке.

Полностью развёрнутая, контейнеризированная, работающая end-to-end система.

## Архитектура

```
React/TS  ──HTTPS──►  Spring Boot  ──AMQP──►  Python Worker
(Frontend)            (Java 24)               (CV + OCR)
                          │                        │
                       PostgreSQL              RabbitMQ
```

**6 Docker-контейнеров**, асинхронная обработка задач, stateless backend.

## Технологический стек

| Слой | Технологии |
|---|---|
| **Backend** | Java 24, Spring Boot 4, Spring Security, Spring AMQP, Hibernate, JWT |
| **Frontend** | React 18, TypeScript, Vite, Nginx |
| **CV / OCR** | Python 3.11, OpenCV, PyTorch, HuggingFace Transformers, Tesseract, TrOCR |
| **Данные** | PostgreSQL 16, RabbitMQ 3.13 (manual ACK) |
| **DevOps** | Docker, Docker Compose, Nginx (HTTPS) |

## Инженерные решения

- 🔄 **Асинхронные микросервисы** — REST + AMQP, manual ACK для гарантированной доставки задач
- 🧠 **Каскадный алгоритм OCR** — Tesseract с переключением на TrOCR по порогу уверенности 0.75; **в 2 раза быстрее** чистого TrOCR при сопоставимой точности
- 🔍 **End-to-end CV-конвейер** — детектор Кэнни, гомография, CLAHE, адаптивная бинаризация, удаление линий сетки через анализ связных компонент
- 🔐 **Production-уровень безопасности** — JWT в HttpOnly cookies, Spring Security, параметризованные запросы, stateless backend
- 🐳 **Развёртывание одной командой** — `docker compose up -d`
- 📐 **Domain-Driven Design** — 10 backend-модулей с чётким разделением ответственности


## Демо

🌐 **Live:** [ссылка на развёрнутое приложение]
🎬 **Видео:** [ссылка на демо-видео]

## Об авторе

Выпускная квалификационная работа в **Санкт-Петербургском политехническом университете Петра Великого (СПбПУ)**, защищена на оценку **5/5 (отлично)**.

Открыт к предложениям по позициям **Backend Engineer**, **Computer Vision Engineer** и **Full-stack Developer** — Россия и международные.

### Контакты

- 💼 [LinkedIn](https://www.linkedin.com/in/abdullah-ghallab-12ba22335/)
- 📧 abdullahghallab20@gmail.com
- 💬 Telegram: [@AMGAbdullah](https://t.me/AMGAbdullah)

---

📄 MIT License — см. [LICENSE](LICENSE)
