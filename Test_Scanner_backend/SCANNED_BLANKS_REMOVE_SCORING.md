# ✅ SCANNED_BLANKS - REMOVE SCORING FIELDS

**Issue:** `is_scored NOT NULL constraint violation`

**Root Cause:** Database schema has scoring fields that don't belong in Scan module

**Why:** Scan module only stores RAW OCR data. Grading happens in Grading module.

---

## 🎯 The Problem

Database columns that should NOT exist in `scanned_blanks`:
- `is_scored` ← NULL error!
- `raw_score`
- `max_score`
- `percentage`
- `grade`
- `feedback`
- `final_answers`
- `original_image_path`
- `processed_image_path`
- `thumbnail_path`
- `scored_at`

**These belong in GradingResult, not ScannedBlank!**

---

## 📊 Correct Architecture

### ScannedBlank (RAW DATA ONLY)
```
✅ scanSession (FK)
✅ test (FK)
✅ studentName, studentClass, testDate
✅ answers (raw OCR extraction)
✅ errorCorrections (student corrections)
✅ overall_confidence (quality metric)
✅ needs_review, review_status
✅ scanned_at, reviewed_at
```

❌ **NOT** storing:
- Scores
- Grades
- Feedback
- Processed image paths

### GradingResult (SCORES & GRADES)
```
✅ scannedBlank (FK - links to raw data)
✅ rawScore (calculated)
✅ percentage
✅ grade
✅ feedback
✅ answerDetails (comparison with answer key)
```

---

## 🔧 Solution

### **Option A: Delete Database (FASTEST)** ✅

```sql
DROP DATABASE scanner_db;
CREATE DATABASE scanner_db;
```

Hibernate creates fresh schema from entities. No old scoring fields.

**Time:** 1 minute  
**Recommended:** YES

---

### **Option B: Run Migrations**

Flyway will run:
- V99__Clean_ScanSession_Columns.sql
- V100__Drop_GIN_Indexes_Text_Fields.sql
- V101__Remove_Scoring_Fields_From_ScannedBlanks.sql

**Time:** 2 minutes  
**Recommended:** If you have data to keep

---

## 📋 Why This Happened

Original schema design treated `scanned_blanks` as if it would do everything:
```
scanned_blanks (WRONG - mixing concerns)
├─ Raw data
├─ Scoring
├─ Grading
└─ Image storage
```

Our correct design separates concerns:
```
scanned_blanks (CORRECT - raw data only)
└─ Raw OCR data + quality metrics

grading_results (CORRECT - scoring only)
└─ Scores, grades, comparisons
```

---

## ✅ What ScannedBlank Entity Should Have

```java
// CORRECT ScannedBlank fields:
private ScanSession scanSession;      ✅
private Test test;                    ✅
private String studentName;           ✅
private String studentClass;          ✅
private LocalDate testDate;           ✅
private String answers;               ✅ (raw OCR)
private String errorCorrections;      ✅ (student fixes)
private BigDecimal overallConfidence; ✅ (quality: 0-1)
private Boolean needsReview;          ✅ (review flag)
private ReviewStatus reviewStatus;    ✅ (PENDING/REVIEWED/CORRECTED)
private LocalDateTime scannedAt;      ✅ (timestamp)
private LocalDateTime reviewedAt;     ✅ (timestamp)

// WRONG (these don't belong here):
// private Boolean isScored;              ❌ (belongs in GradingResult)
// private BigDecimal rawScore;           ❌ (belongs in GradingResult)
// private BigDecimal percentage;         ❌ (belongs in GradingResult)
// private String grade;                  ❌ (belongs in GradingResult)
// private String feedback;               ❌ (belongs in GradingResult)
// private String finalAnswers;           ❌ (belongs in GradingResult)
```

---

## 🚀 Action Steps

### Quickest Solution:

```bash
# 1. Stop backend
Ctrl+C

# 2. Delete database
psql -U postgres
DROP DATABASE scanner_db;
CREATE DATABASE scanner_db;
\q

# 3. Restart backend
./gradlew bootRun
```

### With Migrations:

Just restart backend. Flyway runs migrations automatically.

---

## 🎓 Key Learning

**Never mix concerns in entities!**

- ✅ Scan module = Raw data storage
- ✅ Grading module = Processing & scoring
- ✅ Result module = Final results

Each has its own tables and entity classes.

---

## ✨ After Fix

All 13 Postman test cases will work! ✅

No more NULL constraint errors! 🎉


