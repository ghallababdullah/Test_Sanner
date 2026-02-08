# 🗺️ Визуальная дорожная карта проекта

## 📈 Общий прогресс

```
Текущий статус: ███████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 25%

Завершено:
  ✅ Auth Module             [████████████ 100%]
  ✅ Test Module             [████████████ 100%]
  ✅ Basic Grading           [████████░░░░░ 60%]
  🔴 Scan Processing         [░░░░░░░░░░░░░░ 0%]
  ⚠️  Results Pipeline        [████░░░░░░░░░░ 40%]
  ⚠️  Notifications           [███░░░░░░░░░░░ 50%]
  🔴 Security/Audit          [░░░░░░░░░░░░░░ 0%]
```

---

## 🎯 Критический путь (Critical Path)

```
START
  ↓
[WEEK 1] Fix Security Issues
  ├─ AuthFilter null bug
  ├─ ModelMapper Test → TestResponse
  ├─ Create endpoint auth
  └─ Token validation
  ↓
[WEEK 2-3] Phase 1: Scan Core
  ├─ ScanSessionService
  ├─ ScannedBlankService
  ├─ ScanController (4 endpoints)
  └─ Database indexes
  ↓
[WEEK 4-5] Phase 2: Answer Matching
  ├─ AnswerExtractionService
  ├─ AnswerMatchingService (fuzzy)
  ├─ ReviewWorkflowService
  └─ Review endpoints
  ↓
[WEEK 6-7] Phase 3: Results Pipeline
  ├─ Fix lazy loading
  ├─ ScoringService upgrade
  ├─ ResultsAggregationService
  ├─ TestAnalyticsService
  └─ Results endpoints
  ↓
[WEEK 8-9] Phase 4: Notifications
  ├─ Event classes
  ├─ Event listeners
  ├─ Email templates
  └─ Async delivery
  ↓
[WEEK 10-11] Phase 5: Testing & Optimization
  ├─ Integration tests
  ├─ Load testing
  ├─ Query optimization
  └─ Swagger docs
  ↓
[WEEK 12+] Phase 6: Microservices prep
  ├─ Document boundaries
  ├─ Message broker design
  └─ Migration plan
  ↓
END (Ready for Microservices)
```

---

## 📅 Детальный календарь

### НЕДЕЛЯ 1 (8-15 февраля)

```
ПН  ВТ  СР  ЧТ  ПТ  СБ  ВС
██  ██  ██  ██  ██

ЗАДАЧИ:
□ Вторник  - Анализ и документирование security issues
□ Среда    - Исправление AuthFilter null bug (30 мин)
□ Среда    - Исправление ModelMapper (1 час)
□ Четверг  - Полное тестирование auth endpoints
□ Четверг  - Исправление версии/индексов
□ Пятница  - Полная интеграция auth + test modules
□ Пятница  - Документирование результатов
```

**Цель:** Все текущие auth и test эндпоинты работают без ошибок ✅

---

### НЕДЕЛИ 2-3 (15 февраля - 1 марта)

```
PHASE 1: SCAN PROCESSING CORE

ПН  ВТ  СР  ЧТ  ПТ  СБ  ВС  ПН  ВТ  СР  ЧТ  ПТ  СБ  ВС
██  ██  ██  ██  ██          ██  ██  ██  ██  ██

День 1-2: DTOs
  □ CreateScanSessionRequest.java
  □ ProcessScanRequest.java
  □ ScannedAnswerDto.java
  □ OcrMetadataDto.java
  □ ScanSessionResponse.java
  □ ScannedBlankResponse.java
  □ ScanProcessingResponse.java

День 3-4: Entities validation
  □ ScanSession entity check
  □ ScannedBlank entity check
  □ Verify relationships

День 5-6: Repositories
  □ ScanSessionRepository
  □ ScannedBlankRepository
  □ Custom queries

День 7-8: Services (Part 1)
  □ ScanSessionService interface
  □ ScanSessionServiceImpl (80%)
  □ Unit tests

День 9-10: Services (Part 2)
  □ ScannedBlankService interface
  □ ScannedBlankServiceImpl (80%)
  □ Unit tests

День 11-12: Controller
  □ ScanController (4 endpoints)
  □ Exception handling
  □ Response formatting

День 13-14: Integration & Testing
  □ Integration tests
  □ Manual Postman testing
  □ Database indexes creation
  □ Documentation update
```

**Цель:** React Native может успешно вызвать POST /api/scans/process ✅

---

### НЕДЕЛИ 4-5 (1-15 марта)

```
PHASE 2: ANSWER EXTRACTION & MATCHING

ЗАДАЧИ:
□ AnswerExtractionService
□ Fuzzy matching algorithm (Levenshtein)
□ AnswerMatchingService
□ ReviewWorkflowService
□ Review endpoints
□ Tolerance level implementation
□ Confidence scoring

DELIVERABLE:
  POST /api/answers/match → Matched answers with confidence
```

---

### НЕДЕЛИ 6-7 (15-29 марта)

```
PHASE 3: RESULTS PIPELINE & SCORING

ЗАДАЧИ:
□ Fix lazy loading issue
□ ScoringService upgrade
□ ResultsAggregationService
□ TestAnalyticsService
□ Grade threshold application
□ Feedback generation
□ Results endpoints

DELIVERABLE:
  GET /api/results/{testId} → Full results with analytics
```

---

### НЕДЕЛИ 8-9 (29 марта - 12 апреля)

```
PHASE 4: NOTIFICATIONS & EVENTS

ЗАДАЧИ:
□ Event classes (ScanCompletedEvent, etc.)
□ Event listeners configuration
□ Notification service enhancement
□ Email templates (4 шаблона)
□ Async email delivery
□ Retry logic

DELIVERABLE:
  Email notifications sent for all critical events
```

---

### НЕДЕЛИ 10-11 (12-26 апреля)

```
PHASE 5: TESTING & OPTIMIZATION

ЗАДАЧИ:
□ Integration tests (ScanProcessingIT, etc.)
□ Load testing (1000 blanks)
□ Performance profiling
□ Database query optimization
□ Connection pooling setup
□ Swagger/OpenAPI documentation
□ Performance report

DELIVERABLE:
  Complete test coverage with load testing report
```

---

### НЕДЕЛЯ 12+ (26 апреля+)

```
PHASE 6: MICROSERVICES GROUNDWORK

ЗАДАЧИ:
□ Service boundary documentation
□ Message broker (RabbitMQ/Kafka) design
□ Resilience patterns (Circuit breaker)
□ Distributed tracing setup
□ Migration strategy document

DELIVERABLE:
  Complete microservices migration plan
```

---

## 🔄 Параллельные задачи (для React Native team)

```
ПАРАЛЛЕЛЬНО С BACKEND:

Week 1-3 (Во время Phase 1 backend)
  □ Setup React Native project
  □ Integrate camera library
  □ Setup Tesseract.js for OCR
  □ Create scanning UI
  □ Implement OCR preprocessing (deskew, crop)

Week 4-5 (Во время Phase 2 backend)
  □ Integrate /api/scans/process endpoint
  □ Test answer extraction
  □ Add error handling for low confidence
  □ Implement retry logic

Week 6-7 (Во время Phase 3 backend)
  □ Display results on device
  □ Show analytics charts
  □ Implement offline storage
  □ Add result sharing features

Week 8-9 (Во время Phase 4 backend)
  □ Push notifications setup
  □ Deep links for notifications
  □ In-app notification center
  □ Settings for notification preferences

Week 10+ (Во время Phase 5+ backend)
  □ Performance optimization
  □ Stress testing
  □ Beta testing with real users
  □ App store submission prep
```

---

## 📊 Dependency Map

```
Repositories
    ↓
  ↙ ↘
Entities  Entities
  ↓        ↓
Services   Services
  ↓        ↓
  Controllers
    ↓
  DTOs ← ModelMapper
    ↓
  Frontend (React Native)
```

---

## 🎯 Milestone Checklist

### ✅ Milestone 0: Current State (DONE)
- [x] Auth module fully functional
- [x] Test CRUD working
- [x] Database schema created
- [x] Basic project structure

### 📍 Milestone 1: Security Issues Fixed (NEXT)
- [ ] All auth endpoints secured
- [ ] Token validation working
- [ ] ModelMapper issues resolved
- [ ] No null pointer exceptions

**Timeline:** Week 1  
**Blocker:** Yes (blocks everything else)

### 📍 Milestone 2: Scan Processing Ready
- [ ] 4 scan endpoints working
- [ ] OCR data stored correctly
- [ ] React Native can integrate
- [ ] 100 test cases passing

**Timeline:** Weeks 2-3  
**Blocker:** Yes (blocks Phase 2)

### 📍 Milestone 3: Answer Matching Ready
- [ ] Fuzzy matching 95%+ accurate
- [ ] Review workflow functional
- [ ] Teacher can correct answers
- [ ] Confidence scoring working

**Timeline:** Weeks 4-5  
**Blocker:** Yes (blocks Phase 3)

### 📍 Milestone 4: Results Pipeline Complete
- [ ] Scoring 100% accurate
- [ ] Analytics calculated correctly
- [ ] No lazy loading errors
- [ ] All result endpoints working

**Timeline:** Weeks 6-7  
**Blocker:** Yes (for user-facing features)

### 📍 Milestone 5: Event-Driven Ready
- [ ] All events firing correctly
- [ ] Emails being sent
- [ ] Async processing working
- [ ] No email delivery failures

**Timeline:** Weeks 8-9  
**Blocker:** No (nice to have)

### 📍 Milestone 6: Production Ready
- [ ] 1000+ blanks processed in < 5 min
- [ ] 95%+ test coverage
- [ ] All docs updated
- [ ] Load test passed

**Timeline:** Weeks 10-11  
**Blocker:** No (for deployment)

### 📍 Milestone 7: Microservices Ready
- [ ] Migration plan documented
- [ ] Service boundaries clear
- [ ] Message broker ready
- [ ] Deployment strategy ready

**Timeline:** Week 12+  
**Blocker:** No (future phase)

---

## 🚨 Risk Assessment

| Risk | Severity | Mitigation | Owner |
|------|----------|-----------|-------|
| OCR accuracy < 80% | 🔴 High | Test with real blanks early, adjust tolerance | Dev |
| Fuzzy matching performance | 🔴 High | Batch processing, Redis caching | Dev |
| Database bottleneck at 10k+ records | 🔴 High | Early indexing, query optimization | Dev |
| React Native OCR library issues | 🟠 Medium | Proof of concept in week 1 | React Dev |
| Email delivery failures | 🟡 Low | Fallback to in-app notifications | Dev |
| ModelMapper complexity | 🟠 Medium | Consider manual mapping instead | Dev |

---

## 📊 Resource Allocation

```
Backend Developer(s):  Full-time on backend roadmap
React Native Dev(s):   Parallel development with OCR
DevOps:               Database setup, Docker, monitoring
QA:                   Testing from Week 2 onwards
```

---

## 💰 Estimated Effort

```
Phase 1 (Scan Core):        40-50 hours
Phase 2 (Answer Matching):  30-40 hours
Phase 3 (Results):          30-40 hours
Phase 4 (Notifications):    20-30 hours
Phase 5 (Testing):          40-50 hours
Phase 6 (Microservices):    60-80 hours

TOTAL:                      220-290 hours (~5-7 weeks, 1 developer)
```

---

## ✨ Success Metrics

### Functional Metrics
- ✅ All endpoints returning correct status codes
- ✅ Data integrity (no data loss)
- ✅ Authentication/Authorization working
- ✅ Error handling graceful

### Performance Metrics
- ⏱️ Scan processing: < 3 seconds per blank
- ⏱️ Answer matching: < 5 seconds for 32 questions
- ⏱️ Scoring: < 100ms per result
- 📊 Memory: < 500MB for 1000 blanks in session

### Quality Metrics
- 🧪 Test coverage: > 80%
- 🐛 Bugs: < 5 critical
- 📚 Documentation: 100% API endpoints
- ⏱️ Uptime: > 99.5%

---

## 📞 Communication Plan

```
Daily Standup:     9:00 AM (15 min)
Weekly Review:     Friday 4:00 PM (30 min)
Milestone Demo:    Every 2 weeks
Roadmap Update:    Monthly
```

---

**Версия:** 1.0  
**Дата:** 8 февраля 2026  
**Автор:** AI Assistant  
**Статус:** Ready for implementation ✅

Далее → **Начните с PRIORITY_MATRIX.md** для срочных задач!

