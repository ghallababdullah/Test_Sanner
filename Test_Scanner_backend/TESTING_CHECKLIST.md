# ✅ TESTING CHECKLIST FOR GRADING MODULE

## PRE-TESTING CHECKLIST

- [ ] Application is running on http://localhost:8080
- [ ] PostgreSQL is running
- [ ] Postman is open
- [ ] Collection "Grading Module Tests" created
- [ ] Variables configured:
  - [ ] {{accessToken}} - from login
  - [ ] {{userId}} - from current user
- [ ] Authorization type set to Bearer Token for all requests

---

## STEP 1: CREATE TEST

Request: POST /api/tests/create-test

**Verification:**
- [ ] Status Code: 201 Created
- [ ] success: true
- [ ] data.id exists (save as {{test1Id}})
- [ ] data.title: "Математика - Итоговая контрольная"
- [ ] data.classLevel: "10A"
- [ ] data.totalQuestions: 10
- [ ] data.maxScore: 100.00
- [ ] data.isActive: true

**Variables saved:**
- [ ] {{test1Id}} = test.id

---

## STEP 2: CREATE ANSWER KEYS

Requests: POST /api/tests/{{test1Id}}/answer-keys (10 times)

**For each question (1-10):**
- [ ] Status Code: 201 Created
- [ ] success: true
- [ ] data.questionNumber matches request
- [ ] data.correctAnswer matches request
- [ ] data.maxPoints: 10.0
- [ ] data.toleranceLevel: 1

**Answer Keys Verification:**
- [ ] Q1: "ABC" created
- [ ] Q2: "125" created
- [ ] Q3: "ДА" created
- [ ] Q4: "3.14" created
- [ ] Q5: "РЕШЕНИЕ" created
- [ ] Q6: "100" created
- [ ] Q7: "ВЕРНО" created
- [ ] Q8: "2.5" created
- [ ] Q9: "ОТВЕТ" created
- [ ] Q10: "999" created

---

## STEP 3: CREATE GRADE THRESHOLDS

Request: POST /api/tests/{{test1Id}}/grade-thresholds

**Verification:**
- [ ] Status Code: 200 OK
- [ ] success: true
- [ ] data is array with 4 items
- [ ] Grade 5: minPercentage=91, maxPercentage=100
- [ ] Grade 4: minPercentage=71, maxPercentage=90
- [ ] Grade 3: minPercentage=51, maxPercentage=70
- [ ] Grade 2: minPercentage=0, maxPercentage=50

---

## STEP 4A: GRADING - TEST CASE 1 (Perfect Score 100%)

Request: POST /api/grading/evaluate

**Input:**
- [ ] testId: {{test1Id}}
- [ ] userId: {{userId}}
- [ ] studentName: "Иван"
- [ ] studentLastName: "Петров"
- [ ] studentClass: "10A"
- [ ] All 10 answers are CORRECT

**Verification:**
- [ ] Status Code: 201 Created
- [ ] success: true
- [ ] gradingResultId exists (save as {{gradingResult1Id}})
- [ ] studentName: "Иван"
- [ ] studentLastName: "Петров"
- [ ] studentClass: "10A"
- [ ] testClass: "10A"
- [ ] classMatchesStudent: true ✅
- [ ] rawScore: 100.00
- [ ] maxScore: 100.00
- [ ] percentage: 100.00
- [ ] grade: "5"
- [ ] answerDetails.length: 10

**Answer Details Verification:**
For each of 10 answers:
- [ ] questionNumber: 1-10 (correct)
- [ ] studentAnswer: matches input
- [ ] correctAnswer: matches answer key
- [ ] pointsEarned: 10.00
- [ ] maxPoints: 10.00
- [ ] distance: 0
- [ ] isCorrect: true
- [ ] matchType: "EXACT"

**Variables saved:**
- [ ] {{gradingResult1Id}} = gradingResultId

---

## STEP 4B: GRADING - TEST CASE 2 (Tolerance 99%)

Request: POST /api/grading/evaluate

**Input:**
- [ ] testId: {{test1Id}}
- [ ] userId: {{userId}}
- [ ] studentName: "Мария"
- [ ] studentLastName: "Сидорова"
- [ ] studentClass: "10A"
- [ ] Q1: "ABD" (should be "ABC") - 1 char difference
- [ ] Q2-Q10: CORRECT

**Verification:**
- [ ] Status Code: 201 Created
- [ ] rawScore: 99.00 (10-1=9 for Q1)
- [ ] percentage: 99.00
- [ ] grade: "5"
- [ ] classMatchesStudent: true ✅

**Answer Details Verification:**
- [ ] Q1:
  - [ ] studentAnswer: "ABD"
  - [ ] pointsEarned: 9.00 (10.00 - 1)
  - [ ] distance: 1
  - [ ] isCorrect: false
  - [ ] matchType: "TOLERANCE_1"
- [ ] Q2-Q10:
  - [ ] pointsEarned: 10.00
  - [ ] distance: 0
  - [ ] isCorrect: true
  - [ ] matchType: "EXACT"

**Variables saved:**
- [ ] {{gradingResult2Id}} = gradingResultId

---

## STEP 4C: GRADING - TEST CASE 3 (Wrong Answers 50%)

Request: POST /api/grading/evaluate

**Input:**
- [ ] testId: {{test1Id}}
- [ ] userId: {{userId}}
- [ ] studentName: "Петр"
- [ ] studentLastName: "Иванов"
- [ ] studentClass: "10A"
- [ ] Q1-Q5: WRONG answers
- [ ] Q6-Q10: CORRECT answers

**Verification:**
- [ ] Status Code: 201 Created
- [ ] rawScore: 50.00 (5 questions × 10 points)
- [ ] percentage: 50.00
- [ ] grade: "2" (Неудовлетворительно)
- [ ] classMatchesStudent: true ✅

**Answer Details Verification:**
- [ ] Q1-Q5 (Wrong):
  - [ ] pointsEarned: 0.00
  - [ ] distance: > 1
  - [ ] isCorrect: false
  - [ ] matchType: "NO_MATCH"
- [ ] Q6-Q10 (Correct):
  - [ ] pointsEarned: 10.00
  - [ ] distance: 0
  - [ ] isCorrect: true
  - [ ] matchType: "EXACT"

**Variables saved:**
- [ ] {{gradingResult3Id}} = gradingResultId

---

## STEP 4D: GRADING - TEST CASE 4 (Class Mismatch)

Request: POST /api/grading/evaluate

**Input:**
- [ ] testId: {{test1Id}}
- [ ] userId: {{userId}}
- [ ] studentName: "Алексей"
- [ ] studentLastName: "Смирнов"
- [ ] studentClass: "10B" ⚠️ DIFFERENT CLASS (not 10A)
- [ ] All 10 answers are CORRECT

**Verification:**
- [ ] Status Code: 201 Created
- [ ] rawScore: 100.00 (all correct)
- [ ] percentage: 100.00
- [ ] grade: "5"
- [ ] testClass: "10A"
- [ ] studentClass: "10B"
- [ ] classMatchesStudent: false ⚠️ MISMATCH!
- [ ] Server logs contain warning: "CLASS MISMATCH DETECTED!"

**Application Logs Verification:**
- [ ] Find warning in logs:
  - "Test is intended for class: 10A"
  - "But student from blank is: 10B"

**Variables saved:**
- [ ] {{gradingResult4Id}} = gradingResultId

---

## STEP 5A: GET RESULTS FOR TEST

Request: GET /api/grading/results/{{test1Id}}

**Verification:**
- [ ] Status Code: 200 OK
- [ ] success: true
- [ ] data is array
- [ ] data.length: 4 (four grading results)
- [ ] Contains {{gradingResult1Id}}
- [ ] Contains {{gradingResult2Id}}
- [ ] Contains {{gradingResult3Id}}
- [ ] Contains {{gradingResult4Id}}

**Each result should have:**
- [ ] gradingResultId
- [ ] studentName
- [ ] studentLastName
- [ ] studentClass
- [ ] testClass
- [ ] classMatchesStudent
- [ ] percentage
- [ ] grade

---

## STEP 5B: GET RESULTS FOR USER

Request: GET /api/grading/results/user/{{userId}}

**Verification:**
- [ ] Status Code: 200 OK
- [ ] success: true
- [ ] data is array
- [ ] data.length >= 4 (at least our 4 results)
- [ ] All {{gradingResult1Id}}, {{gradingResult2Id}}, {{gradingResult3Id}}, {{gradingResult4Id}} present

---

## STEP 5C: GET RESULT DETAILS (Perfect Score)

Request: GET /api/grading/results/{{gradingResult1Id}}/details

**Verification:**
- [ ] Status Code: 200 OK
- [ ] success: true
- [ ] data.gradingResultId: {{gradingResult1Id}}
- [ ] data.studentName: "Иван"
- [ ] data.percentage: 100.00
- [ ] data.grade: "5"
- [ ] answerDetails.length: 10

**Answer Details:**
- [ ] Each answer has:
  - [ ] questionNumber (1-10)
  - [ ] studentAnswer
  - [ ] correctAnswer
  - [ ] pointsEarned
  - [ ] maxPoints
  - [ ] distance
  - [ ] isCorrect
  - [ ] matchType

---

## FINAL VERIFICATION

**Database Checks (if direct access available):**

```sql
-- Verify tests table
SELECT COUNT(*) FROM tests WHERE classLevel = '10A';
-- Expected: 1

-- Verify answer_keys table
SELECT COUNT(*) FROM answer_keys WHERE test_id = '{{test1Id}}';
-- Expected: 10

-- Verify grade_thresholds table
SELECT COUNT(*) FROM grade_thresholds WHERE test_id = '{{test1Id}}';
-- Expected: 4

-- Verify grading_results table
SELECT COUNT(*) FROM grading_results WHERE test_id = '{{test1Id}}';
-- Expected: 4

-- Check class mismatch case
SELECT classMatchesStudent FROM grading_results 
WHERE student_class = '10B';
-- Expected: false or NULL (depends on mapping)

-- Verify grading_answer_details
SELECT COUNT(*) FROM grading_answer_details 
WHERE grading_result_id = '{{gradingResult1Id}}';
-- Expected: 10
```

- [ ] All database records exist
- [ ] No null constraints violated
- [ ] Indexes are working (query is fast)

---

## SUMMARY

**Total Tests:** 4
- [ ] Test Case 1 (Perfect Score): PASSED ✅
- [ ] Test Case 2 (Tolerance): PASSED ✅
- [ ] Test Case 3 (Wrong Answers): PASSED ✅
- [ ] Test Case 4 (Class Mismatch): PASSED ✅

**API Endpoints Tested:** 7
- [ ] POST /api/tests/create-test
- [ ] POST /api/tests/{{test1Id}}/answer-keys
- [ ] POST /api/tests/{{test1Id}}/grade-thresholds
- [ ] POST /api/grading/evaluate (4 times)
- [ ] GET /api/grading/results/{{test1Id}}
- [ ] GET /api/grading/results/user/{{userId}}
- [ ] GET /api/grading/results/{{gradingResult1Id}}/details

**Overall Status:** 
- [ ] ALL TESTS PASSED ✅
- [ ] GRADING MODULE IS READY FOR PRODUCTION ✅

---

## NOTES

```
Date: _______________
Tester: _______________
Issues Found: (if any)
_________________________________
_________________________________
_________________________________

Next Steps:
[ ] Deploy to staging
[ ] Integrate with frontend
[ ] Add OCR integration
[ ] Performance testing
```

