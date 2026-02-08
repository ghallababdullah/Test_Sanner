# 🧪 SCAN MODULE - POSTMAN TEST CASES

**Complete testing guide for all 7 endpoints**

---

## 📋 TEST SETUP REQUIREMENTS

Before running these tests, make sure you have:
1. ✅ Backend running on `http://localhost:8080`
2. ✅ Valid JWT token (from Auth API login)
3. ✅ At least one Test created in the database
4. ✅ Postman or similar tool

---

## 🔐 POSTMAN GLOBAL SETTINGS

### Headers (Apply to ALL requests)
```
Authorization: Bearer {YOUR_ACCESS_TOKEN}
Content-Type: application/json
```

### Base URL
```
{{base_url}} = http://localhost:8080
```

---

# 🎯 TEST CASES (7 Total)

---

## TEST CASE 1: Start Scanning Session

**Purpose:** Initialize a new scanning session

**Endpoint:** `POST {{base_url}}/api/scan/start-session`

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
  "testId": "YOUR_TEST_ID_HERE",
  "name": "Сеанс сканирования класс 10A",
  "description": "Сканирование контрольной работы по математике",
  "deviceId": "iphone-teacher-001",
  "deviceModel": "iPhone 14 Pro Max",
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
    "id": "{{session_id}}",
    "testId": "YOUR_TEST_ID_HERE",
    "userId": "{{current_user_id}}",
    "name": "Сеанс сканирования класс 10A",
    "description": "Сканирование контрольной работы по математике",
    "deviceId": "iphone-teacher-001",
    "deviceModel": "iPhone 14 Pro Max",
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

**Validation Points:**
- ✅ Response code is 200
- ✅ `success` is `true`
- ✅ `totalBlanks` is 0
- ✅ `sessionId` is returned (save this for next tests!)
- ✅ `startedAt` has current timestamp

**Save Variable:**
```
Set {{session_id}} = response.data.id
```

---

## TEST CASE 2: Submit First Scanned Blank (High Quality)

**Purpose:** Submit first student's answers with high OCR confidence

**Endpoint:** `POST {{base_url}}/api/scan/submit-blank`

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
  "scanSessionId": "{{session_id}}",
  "testId": "YOUR_TEST_ID_HERE",
  "studentName": "Петров",
  "studentLastName": "Иван",
  "studentClass": "10A",
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
    "id": "{{blank_id_1}}",
    "scanSessionId": "{{session_id}}",
    "testId": "YOUR_TEST_ID_HERE",
    "studentName": "Петров",
    "studentLastName": "Иван",
    "studentClass": "10A",
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

**Validation Points:**
- ✅ Response code is 200
- ✅ `success` is `true`
- ✅ `blankId` is returned
- ✅ `overallConfidence` is 0.95
- ✅ `needsReview` is `false`
- ✅ All 10 answers are saved

**Save Variable:**
```
Set {{blank_id_1}} = response.data.id
```

---

## TEST CASE 3: Submit Second Scanned Blank (Medium Quality)

**Purpose:** Submit second student's answers with medium OCR confidence

**Endpoint:** `POST {{base_url}}/api/scan/submit-blank`

**Request Body:**
```json
{
  "scanSessionId": "{{session_id}}",
  "testId": "YOUR_TEST_ID_HERE",
  "studentName": "Сидоров",
  "studentLastName": "Петр",
  "studentClass": "10A",
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
    "id": "{{blank_id_2}}",
    "scanSessionId": "{{session_id}}",
    "testId": "YOUR_TEST_ID_HERE",
    "studentName": "Сидоров",
    "studentLastName": "Петр",
    "studentClass": "10A",
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

**Validation Points:**
- ✅ Response code is 200
- ✅ Different `blankId` than Test Case 2
- ✅ `overallConfidence` is 0.87
- ✅ Session should now have `totalBlanks: 2`

**Save Variable:**
```
Set {{blank_id_2}} = response.data.id
```

---

## TEST CASE 4: Submit Third Scanned Blank (Low Quality)

**Purpose:** Submit third student's answers with LOW OCR confidence (for testing review workflow)

**Endpoint:** `POST {{base_url}}/api/scan/submit-blank`

**Request Body:**
```json
{
  "scanSessionId": "{{session_id}}",
  "testId": "YOUR_TEST_ID_HERE",
  "studentName": "Иванов",
  "studentLastName": "Сергей",
  "studentClass": "10A",
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
    "id": "{{blank_id_3}}",
    "scanSessionId": "{{session_id}}",
    "testId": "YOUR_TEST_ID_HERE",
    "studentName": "Иванов",
    "studentLastName": "Сергей",
    "studentClass": "10A",
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

**Validation Points:**
- ✅ Response code is 200
- ✅ Low confidence (0.62) is accepted
- ✅ Partial/unclear answers are accepted
- ✅ Session should now have `totalBlanks: 3`

**Save Variable:**
```
Set {{blank_id_3}} = response.data.id
```

---

## TEST CASE 5: Get All Blanks by Test

**Purpose:** Retrieve all scanned blanks for a specific test (should return 3)

**Endpoint:** `GET {{base_url}}/api/scan/test/YOUR_TEST_ID_HERE/blanks`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Request Body:** (None - GET request)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blanks retrieved successfully",
  "data": [
    {
      "id": "{{blank_id_1}}",
      "scanSessionId": "{{session_id}}",
      "testId": "YOUR_TEST_ID_HERE",
      "studentName": "Петров",
      "studentLastName": "Иван",
      "studentClass": "10A",
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
      "id": "{{blank_id_2}}",
      ...
    },
    {
      "id": "{{blank_id_3}}",
      ...
    }
  ],
  "statusCode": 200
}
```

**Validation Points:**
- ✅ Response code is 200
- ✅ `success` is `true`
- ✅ Array contains 3 blanks
- ✅ All blanks have correct testId
- ✅ Blanks are properly formatted

---

## TEST CASE 6: Get All Blanks by Session

**Purpose:** Retrieve all blanks for a specific scanning session

**Endpoint:** `GET {{base_url}}/api/scan/session/{{session_id}}/blanks`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Request Body:** (None - GET request)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blanks retrieved successfully",
  "data": [
    {
      "id": "{{blank_id_1}}",
      "scanSessionId": "{{session_id}}",
      "studentName": "Петров",
      ...
    },
    {
      "id": "{{blank_id_2}}",
      "scanSessionId": "{{session_id}}",
      "studentName": "Сидоров",
      ...
    },
    {
      "id": "{{blank_id_3}}",
      "scanSessionId": "{{session_id}}",
      "studentName": "Иванов",
      ...
    }
  ],
  "statusCode": 200
}
```

**Validation Points:**
- ✅ Response code is 200
- ✅ Array contains 3 blanks
- ✅ All blanks have correct sessionId
- ✅ Order matches submission order (or sorted properly)

---

## TEST CASE 7: Get Specific Blank

**Purpose:** Retrieve detailed information for a single blank

**Endpoint:** `GET {{base_url}}/api/scan/blank/{{blank_id_1}}`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
```

**Request Body:** (None - GET request)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blank retrieved successfully",
  "data": {
    "id": "{{blank_id_1}}",
    "scanSessionId": "{{session_id}}",
    "testId": "YOUR_TEST_ID_HERE",
    "studentName": "Петров",
    "studentLastName": "Иван",
    "studentClass": "10A",
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

**Validation Points:**
- ✅ Response code is 200
- ✅ Returns single object (not array)
- ✅ All fields are present
- ✅ Answers are complete

---

## TEST CASE 8: Mark Blank for Review

**Purpose:** Mark a blank as needing manual review (use blank_id_3 which has low confidence)

**Endpoint:** `PUT {{base_url}}/api/scan/blank/{{blank_id_3}}/mark-review`

**Query Parameters:**
```
?reviewNotes=Low%20OCR%20confidence%20-%20unclear%20answers%20on%20questions%201,%202,%204,%208,%209,%2010
```

**Full URL:**
```
{{base_url}}/api/scan/blank/{{blank_id_3}}/mark-review?reviewNotes=Low%20OCR%20confidence%20-%20unclear%20answers%20on%20questions%201,%202,%204,%208,%209,%2010
```

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:** (Empty for PUT)
```json
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Scanned blank marked for review",
  "data": {
    "id": "{{blank_id_3}}",
    "scanSessionId": "{{session_id}}",
    "testId": "YOUR_TEST_ID_HERE",
    "studentName": "Иванов",
    "studentLastName": "Сергей",
    "studentClass": "10A",
    "testDate": "2026-02-08",
    "overallConfidence": 0.62,
    "needsReview": true,
    "reviewStatus": "PENDING",
    "reviewNotes": "Low OCR confidence - unclear answers on questions 1,2,4,8,9,10",
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

**Validation Points:**
- ✅ Response code is 200
- ✅ `needsReview` changed to `true`
- ✅ `reviewStatus` is still `PENDING`
- ✅ `reviewNotes` are saved correctly
- ✅ Other fields unchanged

---

## TEST CASE 9: Apply Error Corrections

**Purpose:** Apply error corrections to blank_id_2

**Endpoint:** `PUT {{base_url}}/api/scan/blank/{{blank_id_2}}/apply-corrections`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:** (Include errorCorrections to apply)
```json
{
  "errorCorrections": {
    "2": "123"
  }
}
```

**Explanation:**
- The blank has `answers: {"2": "124", ...}`
- Student corrected answer 2 from "124" to "123"
- We send the correction: `{"2": "123"}`
- Backend applies it and marks as CORRECTED

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Error corrections applied successfully",
  "data": {
    "id": "{{blank_id_2}}",
    "scanSessionId": "{{session_id}}",
    "testId": "YOUR_TEST_ID_HERE",
    "studentName": "Сидоров",
    "studentLastName": "Петр",
    "studentClass": "10A",
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
    "errorCorrections": {
      "2": "123"
    },
    "isErrorCorrectionApplied": true,
    "scannedAt": "2026-02-08T14:34:22",
    "reviewedAt": "2026-02-08T14:45:30"
  },
  "statusCode": 200
}
```

**Validation Points:**
- ✅ Response code is 200
- ✅ `reviewStatus` changed to `CORRECTED`
- ✅ `isErrorCorrectionApplied` is `true`
- ✅ `reviewedAt` has current timestamp
- ✅ `errorCorrections` are saved
- ✅ Original `answers` unchanged (for audit trail)

---

# ✅ ERROR SCENARIOS TO TEST

## Error Test 1: Invalid Session ID

**Endpoint:** `POST {{base_url}}/api/scan/submit-blank`

**Body:** (with invalid sessionId)
```json
{
  "scanSessionId": "invalid-uuid-000",
  "testId": "YOUR_TEST_ID_HERE",
  "studentName": "Test",
  "studentLastName": "Student",
  "studentClass": "10A",
  "answers": {"1": "ABC"},
  "overallConfidence": 0.9
}
```

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Scan session not found",
  "statusCode": 404
}
```

---

## Error Test 2: Missing Authorization Header

**Endpoint:** `GET {{base_url}}/api/scan/blank/{{blank_id_1}}`

**Headers:** (without Authorization)
```json
{
  "Content-Type": "application/json"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Full authentication is required to access this resource",
  "statusCode": 401
}
```

---

## Error Test 3: Non-existent Blank ID

**Endpoint:** `GET {{base_url}}/api/scan/blank/00000000-0000-0000-0000-000000000000`

**Expected Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Scanned blank not found",
  "statusCode": 404
}
```

---

## Error Test 4: Apply Corrections Without Error Corrections

**Endpoint:** `PUT {{base_url}}/api/scan/blank/{{blank_id_1}}/apply-corrections`

**Note:** blank_id_1 has `errorCorrections: null`

**Expected Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "No error corrections to apply",
  "statusCode": 400
}
```

---

# 📊 SUMMARY TABLE

| Test # | Endpoint | Method | Purpose | Status |
|--------|----------|--------|---------|--------|
| 1 | `/api/scan/start-session` | POST | Create session | ✅ |
| 2 | `/api/scan/submit-blank` | POST | Submit blank 1 | ✅ |
| 3 | `/api/scan/submit-blank` | POST | Submit blank 2 | ✅ |
| 4 | `/api/scan/submit-blank` | POST | Submit blank 3 | ✅ |
| 5 | `/api/scan/test/{id}/blanks` | GET | Get all for test | ✅ |
| 6 | `/api/scan/session/{id}/blanks` | GET | Get all for session | ✅ |
| 7 | `/api/scan/blank/{id}` | GET | Get single blank | ✅ |
| 8 | `/api/scan/blank/{id}/mark-review` | PUT | Mark for review | ✅ |
| 9 | `/api/scan/blank/{id}/apply-corrections` | PUT | Apply corrections | ✅ |
| E1 | `/api/scan/submit-blank` | POST | Invalid session | ✅ |
| E2 | Any | Any | No auth header | ✅ |
| E3 | `/api/scan/blank/{id}` | GET | Non-existent ID | ✅ |
| E4 | `/api/scan/blank/{id}/apply-corrections` | PUT | No corrections | ✅ |

---

# 🚀 HOW TO RUN IN POSTMAN

1. **Import Base URL:** Set `{{base_url}} = http://localhost:8080`
2. **Set Auth Token:** Set `{{access_token}} = YOUR_JWT_TOKEN`
3. **Run in Order:** Test 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
4. **Save Variables:** Use Postman's "Set Global Variable" in Tests tab
5. **Verify Each:** Check response matches expected output
6. **Error Tests:** Run E1-E4 separately to test error handling

---

## POSTMAN TEST SCRIPT (Copy to Tests tab)

```javascript
// Save responses for next tests
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    
    // Save session ID from test 1
    if (pm.info.requestName === "1. Start Scanning Session") {
        pm.globals.set("session_id", jsonData.data.id);
    }
    
    // Save blank IDs from tests 2-4
    if (pm.info.requestName.includes("Submit Blank")) {
        var blankNum = pm.info.requestName.match(/\d/)[0];
        pm.globals.set("blank_id_" + blankNum, jsonData.data.id);
    }
}

// Assert response structure
pm.test("Response has correct structure", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("success");
    pm.expect(jsonData).to.have.property("message");
    pm.expect(jsonData).to.have.property("statusCode");
});
```

---

**All test cases ready to run!** 🎉


