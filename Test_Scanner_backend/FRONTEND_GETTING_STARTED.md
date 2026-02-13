# 🚀 FRONTEND - GETTING STARTED GUIDE

**Backend Status:** ✅ COMPLETE & FULLY FUNCTIONAL

---

## 📌 Backend API Base URL

```
http://localhost:8080
```

**For Production:** Update this in frontend config

---

## 🔐 Authentication Flow

### 1. Register User
```
POST /api/auth/register

Request:
{
  "email": "teacher@example.com",
  "password": "SecurePassword123",
  "fullName": "Ivan Petrov"
}

Response:
{
  "success": true,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "id": "uuid",
    "email": "teacher@example.com",
    "fullName": "Ivan Petrov"
  }
}
```

### 2. Verify Email
```
Check email for link:
http://your-frontend/verify-email?token=JWT_TOKEN

Token will be in email
```

### 3. Login
```
POST /api/auth/login

Request:
{
  "email": "teacher@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",  ← Use this!
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

### 4. Use Token in All Requests
```javascript
// Every request needs Authorization header:
headers: {
  "Authorization": "Bearer eyJhbGc...",
  "Content-Type": "application/json"
}
```

### 5. Token Refresh (when expired)
```
POST /api/auth/refresh-token

Request:
{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "new_token",
    "expiresIn": 3600
  }
}
```

---

## 📚 Core Workflows

### Workflow 1: Create Test & Answer Keys

**Step 1: Create Test**
```
POST /api/tests/create-test

{
  "title": "Math Test - Grade 10A",
  "subject": "Mathematics",
  "description": "Final exam",
  "totalQuestions": 10,
  "maxScore": 100.0
}

Response: testId (save this!)
```

**Step 2: Add Answer Keys**
```
POST /api/tests/{testId}/answer-keys

{
  "questionNumber": 1,
  "correctAnswer": "ABC",
  "maxPoints": 10.0,
  "toleranceLevel": 1,
  "answerType": "TEXT"
}
```

**Step 3: Set Grade Thresholds**
```
PUT /api/tests/{testId}/grade-thresholds

[
  {
    "gradeName": "Excellent",
    "gradeSymbol": "5",
    "minPercentage": 91,
    "maxPercentage": 100
  },
  {
    "gradeName": "Good",
    "gradeSymbol": "4",
    "minPercentage": 71,
    "maxPercentage": 90
  },
  {
    "gradeName": "Satisfactory",
    "gradeSymbol": "3",
    "minPercentage": 51,
    "maxPercentage": 70
  },
  {
    "gradeName": "Unsatisfactory",
    "gradeSymbol": "2",
    "minPercentage": 0,
    "maxPercentage": 50
  }
]
```

---

### Workflow 2: Scan & Review Blanks

**Step 1: Start Scanning Session**
```
POST /api/scan/start-session

{
  "testId": "test-uuid",
  "name": "Class 10A - February 8",
  "description": "Math test scanning",
  "deviceId": "iphone-teacher-1",
  "deviceModel": "iPhone 14 Pro Max",
  "metadata": {
    "ocrLibrary": "TensorFlow",
    "ocrVersion": "2.1.0"
  }
}

Response: sessionId (save this!)
```

**Step 2: Submit Scanned Blank (Multiple times)**
```
POST /api/scan/submit-blank

{
  "scanSessionId": "session-uuid",
  "testId": "test-uuid",
  "studentName": "Ivan",
  "studentClass": "10A",
  "testDate": "2026-02-08",
  "answers": {
    "1": "ABC",
    "2": "123",
    "3": "ВЕРНО",
    ...
  },
  "overallConfidence": 0.95,
  "errorCorrections": null
}
```

**Step 3: View All Blanks**
```
GET /api/scan/session/{sessionId}/blanks

Shows all scanned blanks for this session
```

**Step 4: Mark for Review (if needed)**
```
PUT /api/scan/blank/{blankId}/mark-review?reviewNotes=Low%20confidence

Marks blank needing manual correction
```

**Step 5: Apply Corrections**
```
PUT /api/scan/blank/{blankId}/apply-corrections

{
  "errorCorrections": {
    "2": "corrected_answer"
  }
}
```

---

### Workflow 3: Grade Blanks

**Grade All Blanks**
```
POST /api/grading/evaluate

{
  "testId": "test-uuid"
}

Backend calculates:
- Compares answers with answer keys
- Applies tolerance levels
- Calculates points
- Assigns grades
- Saves in grading_results
```

**Get Grading Results**
```
GET /api/grading/results

Returns all grading results with:
- Student name
- Raw score
- Percentage
- Grade
- Feedback
```

**Get Detailed Results**
```
GET /api/grading/results/{resultId}/details

Shows:
- Each answer comparison
- Points earned per question
- Detailed feedback
- Error analysis
```

---

## 🎨 Frontend Screens Needed

### 1. **Login/Register Screen**
- Email field
- Password field
- Full name (for register)
- Submit button
- Links to forgot password
- Email verification check

### 2. **Dashboard Screen**
- List of tests
- Create new test button
- Recent scanning sessions
- Recent grades
- Quick stats

### 3. **Create Test Screen**
- Test title
- Subject dropdown
- Total questions (1-32)
- Max score
- Add answer keys section
- Edit grade thresholds
- Save button

### 4. **Scanning Screen**
- Camera preview
- Start session button
- Capture image (OCR)
- Extracted answers display
- Confidence score
- Submit button
- Progress (1/30 blanks)
- Manual corrections option

### 5. **Review Screen**
- List of scanned blanks
- Confidence indicator
- Mark for review option
- Correction interface
- Status badges
- Grade button

### 6. **Results Screen**
- List of all grades
- Student details
- Score & percentage
- Grade badge
- Detailed feedback
- Export option

### 7. **Settings Screen**
- User profile
- Change password
- Logout
- Notifications settings

---

## 📋 API Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "message": "Human readable message",
  "data": {
    // Actual data here
  },
  "statusCode": 200/400/401/404/500
}
```

**Error Example:**
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

---

## 🔑 Important Headers

**Every API request must include:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**For file uploads (future):**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

---

## ⚠️ Common Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Use the data |
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Refresh token or login again |
| 404 | Not Found | ID doesn't exist |
| 500 | Server Error | Check backend logs |

---

## 🧪 Testing During Development

Use Postman with `Scan_Module_Tests.postman_collection.json`:
1. Import in Postman
2. Set base_url = http://localhost:8080
3. Login and get token
4. Run test collection
5. Verify all endpoints work

---

## 📱 React Native Setup

```javascript
// Install dependencies
npm install axios react-native-camera react-native-tensorflow

// Create API client
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 5000
});

// Add token to headers
apiClient.interceptors.request.use(config => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Use in components
const response = await apiClient.post('/api/scan/submit-blank', blankData);
```

---

## 🔄 Token Management

```javascript
// Save token after login
AsyncStorage.setItem('accessToken', accessToken);
AsyncStorage.setItem('refreshToken', refreshToken);

// Get token before API call
const token = await AsyncStorage.getItem('accessToken');

// Check expiration
const decoded = jwt_decode(token);
const isExpired = decoded.exp * 1000 < Date.now();

// Refresh if needed
if (isExpired) {
  const response = await apiClient.post('/api/auth/refresh-token', {
    refreshToken: refreshToken
  });
  // Update token
}
```

---

## ✅ Backend Checklist

Before starting frontend:
- ✅ Backend running on localhost:8080
- ✅ Database connected
- ✅ Test API with Postman (all 13 tests pass)
- ✅ Create sample test with answer keys
- ✅ Test scan workflow end-to-end
- ✅ Test grading workflow
- ✅ All error codes verified

---

## 🚀 Ready to Start!

Everything is set up. You can now:

1. **Create new React Native project**
2. **Set up navigation**
3. **Build Auth screens**
4. **Integrate API calls**
5. **Test with backend**

---

**Backend is ready for you!** 🎉

Start building the frontend! 💪


