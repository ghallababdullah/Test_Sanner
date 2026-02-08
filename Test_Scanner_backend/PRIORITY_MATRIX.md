# 🎯 Quick Priority Matrix

## Текущий момент (Февраль 2026)

### ✅ DONE (Ready to use)
- [x] User Registration & Email Verification
- [x] User Login & JWT tokens
- [x] Password Reset Flow
- [x] Test CRUD (Create, Read, Update, Delete)
- [x] Answer Key Management
- [x] Grade Threshold Configuration
- [x] Basic Grading Logic
- [x] Notification Service (basic)

---

### 🔴 CRITICAL NEXT (Do immediately)

#### 1️⃣ **ScanSession & ScannedBlank Services** (Week 1-3)
   **Why Critical:**
   - Frontend (React Native) needs these endpoints to start development
   - Foundation for entire scan pipeline
   - Blocks Phase 2, 3, 4
   
   **Action Items:**
   - Create `ScanSessionService` (createSession, getSessions, updateStatus)
   - Create `ScannedBlankService` (saveBlank, getBlank, listBlanks)
   - Create `ScanController` with 4 endpoints
   - Add database indexes for scan_sessions and scanned_blanks
   - Create DTOs: CreateScanSessionRequest, ScannedBlankResponse, etc.

#### 2️⃣ **Answer Extraction & Matching Logic** (Week 4-5)
   **Why Critical:**
   - Handles the "fuzzy matching" of OCR answers vs answer keys
   - Determines accuracy of grading system
   - Required before scoring can happen
   
   **Action Items:**
   - Implement fuzzy matching algorithm (Levenshtein distance)
   - Create `AnswerMatchingService`
   - Handle tolerance levels correctly
   - Create confidence scoring

#### 3️⃣ **Complete Results Pipeline** (Week 6-7)
   **Why Critical:**
   - Currently broken (ModelMapper issues, lazy loading)
   - Users can't get their grades
   - Blocks analytics features
   
   **Action Items:**
   - Fix GradingResult <→ ScannedBlank relationship
   - Fix ModelMapper configuration (manual mapping)
   - Complete feedback generation
   - Implement TestAnalytics calculation

---

### 🟠 HIGH PRIORITY (Next week)

#### 4️⃣ **Fix Security Filter Chain** 
   **Current Issue:** Can't authenticate to /api/tests/create-test
   
   **Fix:**
   - Check AuthFilter for null userRepository
   - Verify JWT token parsing
   - Ensure SecurityConfig is correctly configured

#### 5️⃣ **Database Optimization**
   **Add indexes for:**
   - `scan_sessions(status, test_id)`
   - `scanned_blanks(scan_session_id, is_scored)`
   - `scanned_blanks(needs_review, review_status)`
   - `grading_results(test_id, is_scored)`

#### 6️⃣ **Event-Driven Architecture Setup**
   **Why:** Foundation for async notifications and microservices
   
   **Setup:**
   - Create event classes
   - Create event listeners
   - Configure Spring Events

---

### 🟡 MEDIUM PRIORITY (After critical done)

#### 7️⃣ **Notification Email Templates**
   - scan-completed-email.html
   - review-required-email.html
   - results-ready-email.html

#### 8️⃣ **Integration Tests**
   - ScanProcessingIT
   - AnswerMatchingIT
   - GradingIT
   - ScoringIT

#### 9️⃣ **API Documentation**
   - Swagger/OpenAPI configuration
   - Document all endpoints
   - Add examples

---

### 🟢 LOW PRIORITY (After Phase 5)

#### 🔟 **Microservices Planning**
   - Document service boundaries
   - Design message broker architecture
   - Plan migration strategy

#### 1️⃣1️⃣ **Advanced Security**
   - Audit logging table
   - Implement audit trail for all operations
   - Add IP tracking

#### 1️⃣2️⃣ **Performance Optimization**
   - Redis caching for answer keys
   - Batch processing for fuzzy matching
   - Query optimization

---

## 📊 Dependency Chart

```
        React Native
        (OCR Client)
              ↓
    POST /api/scans/process
         (Phase 1)
              ↓
    ScanSessionService
    ScannedBlankService
         (Week 1-3)
              ↓
    ┌─────────────────┐
    ↓                 ↓
AnswerExtraction   ReviewWorkflow
    ↓                 ↓
AnswerMatching    Manual Corrections
    (Phase 2)         (Week 4-5)
    ↓
    ┌──────────────────────┐
    ↓                      ↓
  Scoring         TestAnalytics
  (Phase 3)         (Week 6-7)
    ↓
GradingResult
Results API
    ↓
Notifications
(Phase 4)
    ↓
Email Delivery
```

---

## 🚨 Known Issues to Fix

| Issue | Status | Priority | Est. Time |
|-------|--------|----------|-----------|
| AuthFilter null userRepository | 🔴 Blocking | CRITICAL | 30 min |
| ModelMapper Test → TestResponse | 🔴 Blocking | CRITICAL | 1 hour |
| Lazy loading GradingResult.answerDetails | 🔴 Blocking | CRITICAL | 1 hour |
| Create endpoint returns 401 when token provided | 🔴 Blocking | CRITICAL | 2 hours |
| Version field causing AnswerKey issues | 🔴 Blocking | CRITICAL | 30 min |
| No indexes on frequently queried columns | 🟠 Slowing | HIGH | 1 hour |

---

## 💡 Recommendations

### Start Immediately (Next 3 Days)
1. Fix the 6 blocking issues above
2. Test all auth endpoints work correctly
3. Test all test endpoints work correctly

### Start Week 1
1. Create ScanSessionService + Controller
2. Create ScannedBlankService + Controller
3. Set up test database with sample data
4. Have React Native team ready to integrate

### Start Week 4
1. Fuzzy matching algorithm
2. Answer matching service
3. Integration with answer keys

---

## 📝 Checklist for Phase 1 Completion

- [ ] ScanSessionService fully implemented
- [ ] ScannedBlankService fully implemented
- [ ] ScanController with all 4 endpoints
- [ ] DTOs created and validated
- [ ] Database indexes created
- [ ] Integration tests passing
- [ ] React Native can call /api/scans/process
- [ ] Confidence scores saved correctly
- [ ] Review workflow identified items correctly
- [ ] Documentation in Swagger

---

## 🎓 Learning Resources

As you implement, reference:
- `DEVELOPMENT_ROADMAP.md` - This file (overall plan)
- `Complete_Test_Plan.json` - Database schema
- `Test_Scanner_API.postman_collection.json` - API examples
- Current code structure: `/src/main/java/.../`

---

**Last Updated:** 2026-02-08  
**Next Review:** After Phase 1 completion

