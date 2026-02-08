# 🚀 SCAN MODULE - POSTMAN SETUP GUIDE

## Quick Start (5 minutes)

### Step 1: Import Collection
1. Open Postman
2. Click **"File"** → **"Import"**
3. Select: `Scan_Module_Tests.postman_collection.json`
4. Click **"Import"**

### Step 2: Set Global Variables

Go to **"Environments"** → Create New or Edit Current

Set these variables:
```
base_url      = http://localhost:8080
access_token  = YOUR_JWT_TOKEN_HERE
test_id       = YOUR_TEST_UUID_HERE
```

### Step 3: Get Your JWT Token

First, login to get token:

**Request:**
```
POST http://localhost:8080/api/auth/login

{
  "email": "your_email@example.com",
  "password": "your_password"
}
```

**Response:** Copy the `accessToken` value and paste into `access_token` variable

### Step 4: Get Test ID

If you don't have a test, create one first:

**Request:**
```
POST http://localhost:8080/api/tests/create-test

{
  "title": "Math Test 10A",
  "subject": "Mathematics",
  "description": "Test for scanning",
  "totalQuestions": 10,
  "maxScore": 100.0
}
```

**Response:** Copy the `id` and paste into `test_id` variable

### Step 5: Run Tests in Order

Click on the collection and click **"Run"** button, or run tests one by one:

```
1. Start Scanning Session          ← Runs first
2. Submit Blank 1 (High Quality)   ← Runs second
3. Submit Blank 2 (Medium Quality) ← Runs third
4. Submit Blank 3 (Low Quality)    ← Runs fourth
5. Get All Blanks by Test          ← Runs fifth
6. Get All Blanks by Session       ← Runs sixth
7. Get Specific Blank              ← Runs seventh
8. Mark Blank for Review           ← Runs eighth
9. Apply Error Corrections         ← Runs ninth
```

**The tests are designed to save variables automatically!**

---

## 🔍 What Each Test Does

| # | Test | What It Tests |
|---|------|---------------|
| 1 | Start Session | Creates a session (all blanks link to this) |
| 2 | Submit Blank 1 | Submits high quality scan (0.95 confidence) |
| 3 | Submit Blank 2 | Submits medium quality scan (0.87 confidence) |
| 4 | Submit Blank 3 | Submits low quality scan (0.62 confidence) |
| 5 | Get by Test | Retrieves all 3 blanks for the test |
| 6 | Get by Session | Retrieves all 3 blanks for the session |
| 7 | Get Single | Retrieves one blank with full details |
| 8 | Mark Review | Marks blank 3 as needing manual review |
| 9 | Apply Corrections | Applies corrections to blank 2 |

---

## ✅ What to Check in Each Response

### Test 1-4 (Submit Tests)
```json
✓ success: true
✓ statusCode: 200
✓ data.id exists (blank ID)
✓ data.scannedAt has timestamp
```

### Test 5-6 (Get Lists)
```json
✓ success: true
✓ statusCode: 200
✓ data is array with 3 items
✓ Each item has studentName and answers
```

### Test 7 (Get Single)
```json
✓ success: true
✓ statusCode: 200
✓ data is object (not array)
✓ data.answers has all 10 questions
```

### Test 8 (Mark Review)
```json
✓ success: true
✓ statusCode: 200
✓ data.needsReview: true ← CHANGED from false
✓ data.reviewStatus: PENDING
```

### Test 9 (Apply Corrections)
```json
✓ success: true
✓ statusCode: 200
✓ data.isErrorCorrectionApplied: true ← CHANGED from false
✓ data.reviewStatus: CORRECTED ← CHANGED
✓ data.reviewedAt: has timestamp ← ADDED
```

---

## 🧪 Error Tests (Test separately)

### ERROR 1: Invalid Session ID
- Expect: **404 Not Found**
- Message: "Scan session not found"

### ERROR 2: No Auth Header
- Expect: **401 Unauthorized**
- Message: "Full authentication is required"

### ERROR 3: Non-existent Blank ID
- Expect: **404 Not Found**
- Message: "Scanned blank not found"

### ERROR 4: Apply Corrections Without Corrections
- Expect: **400 Bad Request**
- Message: "No error corrections to apply"

---

## 📊 Expected Results Summary

After running all 9 tests in order:

| Database Table | Rows | Status |
|---|---|---|
| scan_sessions | 1 | ACTIVE |
| scanned_blanks | 3 | PENDING, PENDING, PENDING |
| (After Test 8) | 3 | PENDING, PENDING, PENDING (needs_review=true) |
| (After Test 9) | 3 | PENDING, CORRECTED, PENDING |

---

## 🔧 Troubleshooting

### "401 Unauthorized"
→ **Problem:** Invalid or missing token
→ **Solution:** Get new token from login endpoint and update `access_token` variable

### "404 Test not found"
→ **Problem:** Test ID doesn't exist
→ **Solution:** Create a test first and update `test_id` variable

### "404 Scan session not found"
→ **Problem:** Test 1 didn't run successfully
→ **Solution:** Run Test 1 again, check it returns 200 OK

### "Variables not being saved"
→ **Problem:** Tests tab not set up correctly
→ **Solution:** Check that "Test" scripts are enabled in collection settings

### "401 in error tests"
→ **Problem:** Error Test 2 runs without auth
→ **Solution:** This is expected! This tests that auth is required

---

## 💡 Pro Tips

1. **Use Runner** for automated execution:
   - Click "Run" button in collection
   - Set iteration count = 1
   - Watch all tests run automatically

2. **Use Console** to debug:
   - Press `Ctrl + Alt + C`
   - See all requests/responses
   - Check variable values

3. **Export Results**:
   - After running collection
   - Click "Run Results"
   - Export as HTML for report

4. **Save Requests**:
   - After each test runs
   - Save response as example
   - Use for documentation

---

## 📝 Notes

- All 9 tests must run in order (Test 1 → 2 → ... → 9)
- Error tests can run anytime (they don't affect data)
- Variables are saved automatically by test scripts
- Each blank has different confidence level (0.95, 0.87, 0.62)
- Blank 3 is marked for review (low confidence)
- Blank 2 has error corrections applied

---

## 🎉 Success Checklist

After completing all tests:

- [ ] All 9 tests return 200 OK
- [ ] session_id is captured
- [ ] blank_id_1, blank_id_2, blank_id_3 are captured
- [ ] Test 5 returns array with 3 items
- [ ] Test 6 returns array with 3 items
- [ ] Test 8 has needsReview=true
- [ ] Test 9 has reviewStatus=CORRECTED
- [ ] All 4 error tests return expected codes
- [ ] Database has 1 session and 3 blanks

---

**You're ready to test!** 🚀

Start with Test 1 and follow through to Test 9 in order.


