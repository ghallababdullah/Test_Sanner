# API Endpoints and Required Fields

## Authentication Module

### 1. Login
- **Endpoint:** `POST /api/auth/login`
- **Fields:**
  - `email` (string, required): User's email address.
  - `password` (string, required): User's password.

### 2. Register
- **Endpoint:** `POST /api/auth/register`
- **Fields:**
  - `email` (string, required): User's email address.
  - `password` (string, required): User's password.
  - `name` (string, required): User's full name.

### 3. Refresh Token
- **Endpoint:** `POST /api/auth/refresh`
- **Fields:**
  - `refreshToken` (string, required): The refresh token provided during login.

---

## Test Module

### 1. Create Test
- **Endpoint:** `POST /api/tests/create-test`
- **Fields:**
  - `title` (string, required): Title of the test.
  - `subject` (string, required): Subject of the test.
  - `description` (string, optional): Description of the test.
  - `totalQuestions` (integer, required): Total number of questions in the test.
  - `maxScore` (float, required): Maximum score for the test.

### 2. Update Test
- **Endpoint:** `PUT /api/tests/{testId}`
- **Fields:**
  - `title` (string, optional): Updated title of the test.
  - `subject` (string, optional): Updated subject of the test.
  - `description` (string, optional): Updated description of the test.
  - `totalQuestions` (integer, optional): Updated total number of questions.
  - `maxScore` (float, optional): Updated maximum score.

### 3. Get All Tests
- **Endpoint:** `GET /api/tests`
- **Fields:** None

### 4. Get Test By ID
- **Endpoint:** `GET /api/tests/{testId}`
- **Fields:** None

### 5. Delete Test
- **Endpoint:** `DELETE /api/tests/{testId}`
- **Fields:** None

---

## Answer Key Module

### 1. Create Answer Key
- **Endpoint:** `POST /api/tests/{testId}/answer-keys`
- **Fields:**
  - `questionNumber` (integer, required): Question number.
  - `correctAnswer` (string, required): Correct answer for the question.
  - `maxPoints` (float, required): Maximum points for the question.
  - `toleranceLevel` (integer, optional): Tolerance level for the answer.
  - `answerType` (string, required): Type of the answer (e.g., TEXT, MULTIPLE_CHOICE).

### 2. Update Answer Key
- **Endpoint:** `PUT /api/tests/{testId}/answer-keys/{answerKeyId}`
- **Fields:**
  - `questionNumber` (integer, optional): Updated question number.
  - `correctAnswer` (string, optional): Updated correct answer.
  - `maxPoints` (float, optional): Updated maximum points.
  - `toleranceLevel` (integer, optional): Updated tolerance level.
  - `answerType` (string, optional): Updated answer type.

### 3. Delete Answer Key
- **Endpoint:** `DELETE /api/tests/{testId}/answer-keys/{answerKeyId}`
- **Fields:** None

---

## Grading Module

### 1. Evaluate Test
- **Endpoint:** `POST /api/grading/evaluate`
- **Fields:**
  - `testId` (string, required): ID of the test to evaluate.
  - `answers` (object, required): Object containing question numbers as keys and answers as values.

### 2. Get Grading Results
- **Endpoint:** `GET /api/grading/results/{gradingResultId}`
- **Fields:** None

### 3. Get Grading Result Details
- **Endpoint:** `GET /api/grading/results/{gradingResultId}/details`
- **Fields:** None

---

## Scan Module

### 1. Start Scan Session
- **Endpoint:** `POST /api/scan/start-session`
- **Fields:**
  - `name` (string, required): Name of the scan session.
  - `description` (string, optional): Description of the scan session.
  - `deviceId` (string, required): ID of the device used for scanning.
  - `deviceModel` (string, required): Model of the device used for scanning.
  - `metadata` (object, optional): Additional metadata about the scan session.

### 2. Scan Blank
- **Endpoint:** `POST /api/scan/blank`
- **Fields:**
  - `scanSessionId` (string, required): ID of the scan session.
  - `imagePath` (string, required): Path to the scanned image.
  - `metadata` (object, optional): Additional metadata about the scanned blank.

### 3. Apply Corrections
- **Endpoint:** `POST /api/scan/blank/{blankId}/apply-corrections`
- **Fields:**
  - `corrections` (object, required): Object containing corrections to apply.

---

## Notes
- All endpoints require authentication via Bearer Token in the Authorization header.
- Replace `{testId}`, `{answerKeyId}`, `{gradingResultId}`, and `{blankId}` with the actual IDs.
