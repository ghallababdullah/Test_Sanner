# 📱 Scan Module API - Testing Guide

## Overview

Scan модуль обрабатывает сырые OCR данные, полученные с фронтенда (React Native). 

**Важно:** 
- Frontend запускает OCR локально на телефоне
- Backend только сохраняет извлеченные данные (БЕЗ фото)
- Грейдинг (оценивание) делает **Grading модуль**, не Scan

---

## API Endpoints

### 1. Start Scanning Session
Создать новый сеанс сканирования

**Endpoint:** `POST /api/scan/start-session`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
  "name": "Сеанс сканирования 8 февраля",
  "description": "Сканирование работ 10A класса",
  "deviceId": "device-12345",
  "deviceModel": "iPhone 14 Pro",
  "metadata": {
    "ocrLibrary": "TensorFlow",
    "ocrVersion": "2.1.0",
    "phoneModel": "iPhone 14 Pro"
  }
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scan session started successfully",
  "data": {
    "id": "s1-uuid",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "userId": "current-user-uuid",
    "name": "Сеанс сканирования 8 февраля",
    "description": "Сканирование работ 10A класса",
    "deviceId": "device-12345",
    "deviceModel": "iPhone 14 Pro",
    "totalBlanks": 0,
    "startedAt": "2026-02-08T14:30:00",
    "metadata": {...},
    "createdAt": "2026-02-08T14:30:00"
  },
  "statusCode": 200
}
```

---

### 2. Submit Scanned Blank
Отправить отсканированный бланк с извлеченными данными

**Endpoint:** `POST /api/scan/submit-blank`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "scanSessionId": "s1-uuid",
  "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
  "studentName": "Петров",
  "studentLastName": "Иван",
  "studentClass": "10A",
  "testDate": "2026-02-08",
  "answers": {
    "1": "ABC",
    "2": "123",
    "3": "ВЕРНО",
    "4": "А",
    "5": "БВ"
  },
  "overallConfidence": 0.92,
  "errorCorrections": null,
  "isErrorCorrectionApplied": false
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blank submitted successfully",
  "data": {
    "id": "blank-uuid-1",
    "scanSessionId": "s1-uuid",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "studentName": "Петров",
    "studentLastName": "Иван",
    "studentClass": "10A",
    "testDate": "2026-02-08",
    "overallConfidence": 0.92,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {
      "1": "ABC",
      "2": "123",
      "3": "ВЕРНО",
      "4": "А",
      "5": "БВ"
    },
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-08T14:32:15",
    "reviewedAt": null
  },
  "statusCode": 200
}
```

---

### 3. Get Scanned Blanks by Test
Получить все отсканированные бланки для конкретного теста

**Endpoint:** `GET /api/scan/test/{testId}/blanks`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `testId`: UUID теста

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blanks retrieved successfully",
  "data": [
    {
      "id": "blank-uuid-1",
      "scanSessionId": "s1-uuid",
      "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "studentName": "Петров",
      "studentLastName": "Иван",
      "studentClass": "10A",
      "testDate": "2026-02-08",
      "overallConfidence": 0.92,
      "needsReview": false,
      "reviewStatus": "PENDING",
      "answers": {...},
      "errorCorrections": null,
      "isErrorCorrectionApplied": false,
      "scannedAt": "2026-02-08T14:32:15",
      "reviewedAt": null
    },
    {
      "id": "blank-uuid-2",
      "scanSessionId": "s1-uuid",
      "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "studentName": "Сидоров",
      "studentLastName": "Петр",
      "studentClass": "10A",
      ...
    }
  ],
  "statusCode": 200
}
```

---

### 4. Get Scanned Blanks by Session
Получить все бланки для конкретного сеанса сканирования

**Endpoint:** `GET /api/scan/session/{sessionId}/blanks`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `sessionId`: UUID сеанса сканирования

**Expected Response:** (аналогично #3)

---

### 5. Get Specific Scanned Blank
Получить данные конкретного отсканированного бланка

**Endpoint:** `GET /api/scan/blank/{blankId}`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `blankId`: UUID бланка

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blank retrieved successfully",
  "data": {
    "id": "blank-uuid-1",
    "scanSessionId": "s1-uuid",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "studentName": "Петров",
    "studentLastName": "Иван",
    "studentClass": "10A",
    "testDate": "2026-02-08",
    "overallConfidence": 0.92,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {...},
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-08T14:32:15",
    "reviewedAt": null
  },
  "statusCode": 200
}
```

---

### 6. Mark Blank for Review
Отметить бланк как требующий проверки

**Endpoint:** `PUT /api/scan/blank/{blankId}/mark-review`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `blankId`: UUID бланка

**Query Parameters:**
- `reviewNotes`: (optional) Заметки о причине проверки

**Example:**
```
PUT /api/scan/blank/blank-uuid-1/mark-review?reviewNotes=Плохое%20качество%20OCR%20для%20вопроса%203
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blank marked for review",
  "data": {
    "id": "blank-uuid-1",
    ...
    "needsReview": true,
    "reviewStatus": "PENDING",
    "reviewNotes": "Плохое качество OCR для вопроса 3",
    ...
  },
  "statusCode": 200
}
```

---

### 7. Apply Error Corrections
Применить исправления студента на бланке

**Endpoint:** `PUT /api/scan/blank/{blankId}/apply-corrections`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `blankId`: UUID бланка

**Request Body:** (пусто)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Error corrections applied successfully",
  "data": {
    "id": "blank-uuid-1",
    ...
    "isErrorCorrectionApplied": true,
    "reviewStatus": "CORRECTED",
    "reviewedAt": "2026-02-08T14:35:00",
    ...
  },
  "statusCode": 200
}
```

---

## 🧪 Postman Collection Template

### Headers (для всех запросов):
```json
{
  "Authorization": "Bearer {access_token}",
  "Content-Type": "application/json"
}
```

### Test Scenario

1. **Создай Тест** (используя Test API)
   - Получи `testId`

2. **Запусти Сеанс Сканирования** (#1)
   - Получи `sessionId`

3. **Отправь 3 Сканированных Бланка** (#2)
   - Для каждого получи `blankId`

4. **Получи все Бланки для Теста** (#3)
   - Проверь что все 3 бланка есть

5. **Получи Конкретный Бланк** (#5)
   - Проверь данные одного бланка

6. **Отметь для Проверки** (#6)
   - Отметь один бланк

7. **Примени Исправления** (#7)
   - Применить исправления к одному бланку

---

## ⚠️ Error Responses

### 404 Not Found
```json
{
  "success": false,
  "message": "Test not found",
  "statusCode": 404
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Full authentication is required to access this resource",
  "statusCode": 401
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "No error corrections to apply",
  "statusCode": 400
}
```

---

## 📊 Key Differences from Grading Module

| Aspect | Scan Module | Grading Module |
|--------|------------|-----------------|
| **Input** | Сырые OCR данные | ScannedBlank (сырые ответы) |
| **Storage** | scanned_blanks | grading_results |
| **Processing** | Сохранение данных | Сравнение + оценивание |
| **Output** | ScannedBlankResponse | GradingResponse с баллами |
| **Example Data** | `{"1": "ABC", "2": "123"}` | `rawScore: 85.0, grade: "4"` |

---

## 🔄 Workflow

```
Frontend (React Native)
    ↓
1. Включает камеру
2. Сканирует бланк
3. Запускает OCR локально
4. Извлекает: имя, класс, ответы
    ↓
POST /api/scan/submit-blank
    ↓
Backend Scan Module
    ↓
Сохраняет в scanned_blanks
    ↓
GET /api/scan/blank/{blankId}
    ↓
Frontend показывает результат
    ↓
Учитель может:
- Отметить для проверки (#6)
- Применить исправления (#7)
    ↓
Затем → Grading Module берет эти данные и оценивает
```

---

## 📝 Notes

- **Фото не хранится** на сервере - только в памяти телефона
- **Только сырые данные** - баллы считает Grading модуль
- **JSON структура ответов** позволяет хранить дополнительные метаданные (confidence, и т.д.)
- **Review статус** помогает отследить, какие бланки нужны проверки вручную

