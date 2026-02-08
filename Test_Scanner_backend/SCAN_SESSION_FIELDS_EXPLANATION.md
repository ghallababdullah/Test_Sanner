# 🔍 Why We Don't Need `failed_blanks` and `processed_blanks`

## The Problem

Database has these fields as NOT NULL:
- `processed_blanks`
- `failed_blanks`  
- `completed_at`
- `processing_time_ms`
- `status`

But entity doesn't have them. Why?

---

## 🤔 Original Design (WRONG)

Someone designed ScanSession to track:
```
total_blanks     = 30        ← How many were submitted
processed_blanks = 20        ← How many were processed
failed_blanks    = 10        ← How many failed
```

This assumes:
- Processing happens automatically at session level
- Some blanks "fail" during processing
- Session has a "COMPLETED" status

---

## ❌ But This Is Wrong For Our Design

**Remember our architecture:**

```
Scan Module = Save raw data only
Grading Module = Process data (separately)
```

So at scan session level:
- ✅ We DON'T process blanks (that's Grading's job)
- ✅ We DON'T fail blanks (they just have confidence scores)
- ✅ We DON'T complete sessions (they stay open)

---

## ✅ What ScanSession Actually Needs

```
total_blanks ← Total submitted
started_at   ← When scanning started
metadata     ← Device info
```

**That's it!**

Other info comes from ScannedBlank:
- `needs_review` ← Does it need manual review?
- `overall_confidence` ← OCR quality (0-1)
- `review_status` ← PENDING/REVIEWED/CORRECTED

---

## 📊 Data Model

```
ScanSession
├─ total_blanks = 30
├─ started_at
├─ metadata
└─ FK: test_id, user_id

    ↓ (has many)

ScannedBlank (30 rows)
├─ overall_confidence = 0.95 (quality)
├─ needs_review = false
├─ review_status = PENDING
├─ answers = {...}
└─ FK: scan_session_id
```

ScannedBlank stores all the details we need!

---

## ❓ How Does Frontend Know If Blank Failed?

**Answer: It doesn't need to know at session level!**

Frontend knows per-blank:
```
GET /api/scan/session/{id}/blanks

Response: [
  {
    "id": "blank-1",
    "overall_confidence": 0.95,  ← Quality metric
    "needsReview": false,         ← Needs manual check?
    "review_status": "PENDING",   ← Current status
    "answers": {...}
  },
  {
    "id": "blank-2", 
    "overall_confidence": 0.62,  ← Low quality!
    "needsReview": true,
    "review_status": "PENDING"
  }
]
```

Frontend can show to user:
- "Blank 1: High quality ✅"
- "Blank 2: Low quality ⚠️ - needs review"

---

## 🎯 Solution

### Remove These Fields:
```
processed_blanks   ← Not needed
failed_blanks      ← Not needed
completed_at       ← Not needed
processing_time_ms ← Not needed
status             ← Not needed
```

### Keep These Fields:
```
total_blanks  ← Count of submitted blanks
started_at    ← When session started
metadata      ← Device/OCR info
```

---

## 🔧 Implementation

**Entity (ScanSession.java):**
✅ Already correct - no extra fields

**Database Schema:**
❌ Has extra columns

**Fix:**
Run migration or drop and recreate database

---

## 💡 Key Insight

**Don't track processing at session level!**

Track per-blank instead:
- Each blank has confidence score
- Each blank has review status
- Each blank has final answers (after correction)

Session is just a container - the real data is in blanks.

---

## ✨ Lesson Learned

Before adding fields to entity:
1. Ask: "Do we actually use this?"
2. Ask: "Who sets this value?"
3. Ask: "Is it for session or for blanks?"

In this case:
- ❌ We don't use processed_blanks
- ❌ Frontend doesn't set it
- ❌ It belongs at blank level, not session level


