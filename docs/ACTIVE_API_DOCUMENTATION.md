# Active API Documentation

Актуальный список endpoint'ов, которые реально используются текущим приложением.

Важно:
- список составлен по фактическим вызовам из `frontend/src/modules/*/api.ts`
- сюда также добавлен `GET /api/auth/verify-email`, потому что он реально используется по ссылке из письма
- модуль `/api/grading/*` сюда не входит, потому что текущий фронтенд его не использует

Базовый префикс backend:

```text
/api
```

Общее количество реально используемых endpoint'ов:

```text
36
```

## 1. Auth

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `GET /api/auth/me`
4. `POST /api/auth/logout`
5. `POST /api/auth/forget-password`
6. `POST /api/auth/reset-password`
7. `POST /api/auth/change-password`
8. `POST /api/auth/refresh-token`
9. `GET /api/auth/verify-email`

## 2. Analytics

1. `GET /api/analytics/tests/my/overview`
2. `GET /api/analytics/tests/{testId}/summary`
3. `GET /api/analytics/tests/{testId}/questions`

## 3. Scan

1. `POST /api/scan/start-session`
2. `POST /api/scan/submit-blank`
3. `POST /api/scan/submit-blank-preview`
4. `GET /api/scan/session/{sessionId}/blanks`

## 4. Review

1. `GET /api/scan/test/{testId}/blanks`
2. `GET /api/scan/blank/{blankId}/details`
3. `DELETE /api/scan/blank/{blankId}`
4. `GET /api/scan/blank/{blankId}/asset/{kind}`
5. `GET /api/scan/blank/{blankId}/roi-metadata`
6. `GET /api/scan/blank/{blankId}/roi-overrides`
7. `PUT /api/scan/blank/{blankId}/roi-overrides`
8. `POST /api/scan/blank/{blankId}/retry-ocr`
9. `POST /api/scan/blank/{blankId}/refresh-preview`
10. `PUT /api/scan/blank/{blankId}/apply-corrections`

Допустимые значения `{kind}` в текущем фронтенде:
- `original`
- `processed`
- `annotated`
- `thumbnail`

## 5. Tests

1. `GET /api/tests`
2. `GET /api/tests/{testId}/details`
3. `POST /api/tests/create-test`
4. `PUT /api/tests/update-test/{testId}`
5. `GET /api/tests/{testId}/answer-keys`
6. `POST /api/tests/{testId}/answer-keys/bulk`
7. `PUT /api/tests/{testId}/answer-keys/{keyId}`
8. `GET /api/tests/{testId}/grade-thresholds`
9. `POST /api/tests/{testId}/grade-thresholds`

## 6. Site

1. `POST /api/site/contact`

---

## Короткая карта по модулям

### Auth
- регистрация и вход
- cookie-сессия
- восстановление и смена пароля
- подтверждение почты

### Analytics
- сводная аналитика по пользователю
- аналитика по конкретному тесту
- аналитика по вопросам

### Scan
- создание сессии сканирования
- загрузка бланка
- загрузка бланка в preview-режиме

### Review
- список бланков
- детали бланка
- ассеты и ROI
- повтор OCR
- preview refresh
- ручные исправления

### Tests
- CRUD-операции для тестов, которые реально доступны во фронте
- ключи ответов
- пороги оценок

### Site
- форма обратной связи

---

## Что сейчас не входит в активный список

Примеры endpoint'ов, которые существуют в backend, но не обнаружены в текущем фронтенде:

- `/api/grading/*`
- `DELETE /api/tests/delete-test/{testId}`
- `PUT /api/tests/{testId}/activate`
- `PUT /api/tests/{testId}/deactivate`
- `GET /api/tests/{testId}`
- `GET /api/tests/user/{userId}`
- `POST /api/tests/{testId}/answer-keys`
- `DELETE /api/tests/{testId}/answer-keys/{keyId}`
- `POST /api/tests/{testId}/grade-thresholds/single`
- `PUT /api/tests/{testId}/grade-thresholds/{thresholdId}`
- `DELETE /api/tests/{testId}/grade-thresholds/{thresholdId}`
- `PUT /api/scan/blank/{blankId}/mark-review`
- `GET /api/scan/blank/{blankId}`

Это не означает автоматически, что их можно удалять без проверки, но текущий фронтенд их не использует.
