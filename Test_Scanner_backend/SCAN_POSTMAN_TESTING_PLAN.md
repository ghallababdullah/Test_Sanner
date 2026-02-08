# 🧪 SCAN MODULE - COMPLETE POSTMAN TESTING PLAN

---

## 📋 Prerequisites

1. **Java Backend Running** - приложение должно быть запущено на `http://localhost:8080`
2. **Database Ready** - PostgreSQL с таблицами
3. **Authentication Token** - JWT token из Auth API
4. **Test Created** - тест должен существовать в БД

### Getting Auth Token

First, register and login to get access token:

```json
POST /api/auth/login
{
  "email": "teacher@example.com",
  "password": "Password123!"
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWFjaGVyQGV4YW1wbGUuY29tIiwi...",
  "refreshToken": "..."
}
```

Copy the `accessToken` - ты будешь использовать его для всех Scan API запросов.

---

## 🏗️ Test Scenario Structure

```
Test 1: Create Test (using Test API)
  ↓
Test 2: Start Scan Session
  ↓
Test 3-5: Submit 3 Scanned Blanks
  ↓
Test 6: Get All Blanks by Test
  ↓
Test 7: Get Blanks by Session
  ↓
Test 8: Get Specific Blank
  ↓
Test 9: Mark Blank for Review
  ↓
Test 10: Apply Error Corrections
```

---

# 🎯 COMPLETE TESTING PLAN

## Test 1: Create a Test (Prerequisites)

**Purpose:** Create a test that we'll use for scanning

**Endpoint:** `POST http://localhost:8080/api/tests/create-test`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "title": "Математика 8 класс - Контрольная работа №1",
  "subject": "Математика",
  "description": "Контрольная работа по алгебре и геометрии",
  "totalQuestions": 10,
  "maxScore": 100.0
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Test created successfully",
  "data": {
    "id": "test-uuid-here",
    "title": "Математика 8 класс - Контрольная работа №1",
    "subject": "Математика",
    "description": "Контрольная работа по алгебре и геометрии",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "creatorId": "user-uuid",
    "isActive": true,
    "createdAt": "2026-02-08T10:00:00"
  },
  "statusCode": 200
}
```

**Save:** `test_id = "test-uuid-here"`

---

## Test 2: Start Scanning Session

**Purpose:** Initialize a scanning session

**Endpoint:** `POST http://localhost:8080/api/scan/start-session`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "testId": "test-uuid-here",
  "name": "Сеанс сканирования 8 февраля 2026",
  "description": "Сканирование работ 8 класса класс А",
  "deviceId": "device-iphone-12",
  "deviceModel": "iPhone 12 Pro Max",
  "metadata": {
    "ocrLibrary": "TensorFlow",
    "ocrVersion": "2.1.0",
    "appVersion": "1.0.0",
    "phoneOS": "iOS 16.2"
  }
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scan session started successfully",
  "data": {
    "id": "session-uuid-001",
    "testId": "test-uuid-here",
    "userId": "user-uuid",
    "name": "Сеанс сканирования 8 февраля 2026",
    "description": "Сканирование работ 8 класса класс А",
    "deviceId": "device-iphone-12",
    "deviceModel": "iPhone 12 Pro Max",
    "totalBlanks": 0,
    "startedAt": "2026-02-08T14:30:00",
    "metadata": {
      "ocrLibrary": "TensorFlow",
      "ocrVersion": "2.1.0",
      "appVersion": "1.0.0",
      "phoneOS": "iOS 16.2"
    },
    "createdAt": "2026-02-08T14:30:00"
  },
  "statusCode": 200
}
```

**Save:** `session_id = "session-uuid-001"`

---

## Test 3: Submit First Scanned Blank

**Purpose:** Submit first student's answers

**Endpoint:** `POST http://localhost:8080/api/scan/submit-blank`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "scanSessionId": "session-uuid-001",
  "testId": "test-uuid-here",
  "studentName": "Петров",
  "studentLastName": "Иван",
  "studentClass": "8А",
  "testDate": "2026-02-08",
  "answers": {
    "1": "ABC",
    "2": "123",
    "3": "ВЕРНО",
    "4": "Б",
    "5": "45",
    "6": "да",
    "7": "синусоида",
    "8": "8",
    "9": "корень из 2",
    "10": "параллельные"
  },
  "overallConfidence": 0.95,
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
    "id": "blank-uuid-001",
    "scanSessionId": "session-uuid-001",
    "testId": "test-uuid-here",
    "studentName": "Петров",
    "studentLastName": "Иван",
    "studentClass": "8А",
    "testDate": "2026-02-08",
    "overallConfidence": 0.95,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {
      "1": "ABC",
      "2": "123",
      "3": "ВЕРНО",
      "4": "Б",
      "5": "45",
      "6": "да",
      "7": "синусоида",
      "8": "8",
      "9": "корень из 2",
      "10": "параллельные"
    },
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-08T14:32:15",
    "reviewedAt": null
  },
  "statusCode": 200
}
```

**Save:** `blank_id_1 = "blank-uuid-001"`

---

## Test 4: Submit Second Scanned Blank

**Purpose:** Submit second student's answers

**Endpoint:** `POST http://localhost:8080/api/scan/submit-blank`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "scanSessionId": "session-uuid-001",
  "testId": "test-uuid-here",
  "studentName": "Сидоров",
  "studentLastName": "Петр",
  "studentClass": "8А",
  "testDate": "2026-02-08",
  "answers": {
    "1": "ABC",
    "2": "124",
    "3": "НЕВЕРНО",
    "4": "В",
    "5": "45",
    "6": "нет",
    "7": "косинусоида",
    "8": "8",
    "9": "2",
    "10": "пересекающиеся"
  },
  "overallConfidence": 0.87,
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
    "id": "blank-uuid-002",
    "scanSessionId": "session-uuid-001",
    "testId": "test-uuid-here",
    "studentName": "Сидоров",
    "studentLastName": "Петр",
    "studentClass": "8А",
    "testDate": "2026-02-08",
    "overallConfidence": 0.87,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {
      "1": "ABC",
      "2": "124",
      "3": "НЕВЕРНО",
      "4": "В",
      "5": "45",
      "6": "нет",
      "7": "косинусоида",
      "8": "8",
      "9": "2",
      "10": "пересекающиеся"
    },
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-08T14:34:22",
    "reviewedAt": null
  },
  "statusCode": 200
}
```

**Save:** `blank_id_2 = "blank-uuid-002"`

---

## Test 5: Submit Third Scanned Blank (with Low Confidence)

**Purpose:** Submit third student's answers with lower OCR confidence

**Endpoint:** `POST http://localhost:8080/api/scan/submit-blank`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "scanSessionId": "session-uuid-001",
  "testId": "test-uuid-here",
  "studentName": "Иванов",
  "studentLastName": "Сергей",
  "studentClass": "8А",
  "testDate": "2026-02-08",
  "answers": {
    "1": "A?C",
    "2": "1?3",
    "3": "ВЕРНО",
    "4": "?",
    "5": "45",
    "6": "да",
    "7": "непонятно",
    "8": "?",
    "9": "не знаю",
    "10": "..."
  },
  "overallConfidence": 0.62,
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
    "id": "blank-uuid-003",
    "scanSessionId": "session-uuid-001",
    "testId": "test-uuid-here",
    "studentName": "Иванов",
    "studentLastName": "Сергей",
    "studentClass": "8А",
    "testDate": "2026-02-08",
    "overallConfidence": 0.62,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {
      "1": "A?C",
      "2": "1?3",
      "3": "ВЕРНО",
      "4": "?",
      "5": "45",
      "6": "да",
      "7": "непонятно",
      "8": "?",
      "9": "не знаю",
      "10": "..."
    },
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-08T14:36:45",
    "reviewedAt": null
  },
  "statusCode": 200
}
```

**Save:** `blank_id_3 = "blank-uuid-003"`

**Note:** `overallConfidence: 0.62` - низкое качество, требует проверки вручную

---

## Test 6: Get All Blanks by Test

**Purpose:** Retrieve all scanned blanks for a specific test

**Endpoint:** `GET http://localhost:8080/api/scan/test/test-uuid-here/blanks`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blanks retrieved successfully",
  "data": [
    {
      "id": "blank-uuid-001",
      "scanSessionId": "session-uuid-001",
      "testId": "test-uuid-here",
      "studentName": "Петров",
      "studentLastName": "Иван",
      "studentClass": "8А",
      "testDate": "2026-02-08",
      "overallConfidence": 0.95,
      "needsReview": false,
      "reviewStatus": "PENDING",
      "answers": {...},
      "errorCorrections": null,
      "isErrorCorrectionApplied": false,
      "scannedAt": "2026-02-08T14:32:15",
      "reviewedAt": null
    },
    {
      "id": "blank-uuid-002",
      ...
    },
    {
      "id": "blank-uuid-003",
      ...
    }
  ],
  "statusCode": 200
}
```

**Verification:** ✅ Все 3 бланка должны быть в списке

---

## Test 7: Get Blanks by Session

**Purpose:** Retrieve all blanks for a specific scanning session

**Endpoint:** `GET http://localhost:8080/api/scan/session/session-uuid-001/blanks`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blanks retrieved successfully",
  "data": [
    {
      "id": "blank-uuid-001",
      ...
    },
    {
      "id": "blank-uuid-002",
      ...
    },
    {
      "id": "blank-uuid-003",
      ...
    }
  ],
  "statusCode": 200
}
```

**Verification:** ✅ Все 3 бланка из сеанса должны быть возвращены

---

## Test 8: Get Specific Blank

**Purpose:** Retrieve detailed information for one blank

**Endpoint:** `GET http://localhost:8080/api/scan/blank/blank-uuid-001`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blank retrieved successfully",
  "data": {
    "id": "blank-uuid-001",
    "scanSessionId": "session-uuid-001",
    "testId": "test-uuid-here",
    "studentName": "Петров",
    "studentLastName": "Иван",
    "studentClass": "8А",
    "testDate": "2026-02-08",
    "overallConfidence": 0.95,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {
      "1": "ABC",
      "2": "123",
      "3": "ВЕРНО",
      "4": "Б",
      "5": "45",
      "6": "да",
      "7": "синусоида",
      "8": "8",
      "9": "корень из 2",
      "10": "параллельные"
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

## Test 9: Mark Blank for Review

**Purpose:** Mark third blank (low confidence) for manual review

**Endpoint:** `PUT http://localhost:8080/api/scan/blank/blank-uuid-003/mark-review?reviewNotes=Low%20OCR%20confidence%2C%20unclear%20answers`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Query Parameters:**
```
reviewNotes=Low OCR confidence, unclear answers on questions 1,2,4,8,9,10
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blank marked for review",
  "data": {
    "id": "blank-uuid-003",
    "scanSessionId": "session-uuid-001",
    "testId": "test-uuid-here",
    "studentName": "Иванов",
    "studentLastName": "Сергей",
    "studentClass": "8А",
    "testDate": "2026-02-08",
    "overallConfidence": 0.62,
    "needsReview": true,
    "reviewStatus": "PENDING",
    "reviewNotes": "Low OCR confidence, unclear answers on questions 1,2,4,8,9,10",
    "answers": {...},
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-08T14:36:45",
    "reviewedAt": null
  },
  "statusCode": 200
}
```

**Verification:** ✅ `needsReview` should be `true`

---

## Test 10: Apply Error Corrections

**Purpose:** Apply error corrections to the second blank

**First, update the blank with error corrections:**

**Endpoint:** `PUT http://localhost:8080/api/scan/blank/blank-uuid-002/mark-review`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
```
reviewNotes=Corrected answer 2 from 124 to 123
```

**Note:** In a real scenario, you would:
1. Retrieve the blank
2. Update `errorCorrections` field
3. Set `isErrorCorrectionApplied = true`
4. Then call apply-corrections

For now, we'll just mark it and then apply:

**Endpoint:** `PUT http://localhost:8080/api/scan/blank/blank-uuid-002/apply-corrections`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Error corrections applied successfully",
  "data": {
    "id": "blank-uuid-002",
    "scanSessionId": "session-uuid-001",
    "testId": "test-uuid-here",
    "studentName": "Сидоров",
    "studentLastName": "Петр",
    "studentClass": "8А",
    "testDate": "2026-02-08",
    "overallConfidence": 0.87,
    "needsReview": false,
    "reviewStatus": "CORRECTED",
    "answers": {
      "1": "ABC",
      "2": "124",
      "3": "НЕВЕРНО",
      "4": "В",
      "5": "45",
      "6": "нет",
      "7": "косинусоида",
      "8": "8",
      "9": "2",
      "10": "пересекающиеся"
    },
    "errorCorrections": null,
    "isErrorCorrectionApplied": true,
    "scannedAt": "2026-02-08T14:34:22",
    "reviewedAt": "2026-02-08T14:45:30"
  },
  "statusCode": 200
}
```

**Verification:** 
- ✅ `reviewStatus` should be `CORRECTED`
- ✅ `isErrorCorrectionApplied` should be `true`
- ✅ `reviewedAt` should have timestamp

---

# 📊 Summary Table

| Test # | Endpoint | Method | Purpose | Expected Status |
|--------|----------|--------|---------|-----------------|
| 1 | `/api/tests/create-test` | POST | Create test | 200 ✅ |
| 2 | `/api/scan/start-session` | POST | Start session | 200 ✅ |
| 3 | `/api/scan/submit-blank` | POST | Submit blank 1 | 200 ✅ |
| 4 | `/api/scan/submit-blank` | POST | Submit blank 2 | 200 ✅ |
| 5 | `/api/scan/submit-blank` | POST | Submit blank 3 (low conf) | 200 ✅ |
| 6 | `/api/scan/test/{id}/blanks` | GET | Get all blanks (3) | 200 ✅ |
| 7 | `/api/scan/session/{id}/blanks` | GET | Get session blanks (3) | 200 ✅ |
| 8 | `/api/scan/blank/{id}` | GET | Get blank details | 200 ✅ |
| 9 | `/api/scan/blank/{id}/mark-review` | PUT | Mark for review | 200 ✅ |
| 10 | `/api/scan/blank/{id}/apply-corrections` | PUT | Apply corrections | 200 ✅ |

---

# ✨ Key Validation Points

✅ **Test 2:** `totalBlanks` starts at 0, then increases with each submit  
✅ **Test 3-5:** All 3 blanks created successfully with different confidence levels  
✅ **Test 6:** Returns exactly 3 blanks for the test  
✅ **Test 7:** Returns exactly 3 blanks for the session  
✅ **Test 8:** Specific blank has all correct data  
✅ **Test 9:** `needsReview = true`, `reviewStatus = PENDING`, `reviewNotes` saved  
✅ **Test 10:** `isErrorCorrectionApplied = true`, `reviewStatus = CORRECTED`  

---

**All tests ready for execution!** 🚀


