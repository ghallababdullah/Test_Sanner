# 📋 Test Scanner Backend — Полный План Развития

**Status:** ✅ Готов к реализации  
**Last Updated:** 2026-02-08  
**Architecture:** Modular Monolith → Microservices (future)

---

## 🎯 Текущий статус модулей

| Модуль | Статус | Готовность |
|--------|--------|-----------|
| **Auth** | ✅ Завершено | 95% |
| **Test Management** | ✅ Завершено | 90% |
| **Grading** | ⚠️ Базовое | 60% |
| **Scan Processing** | 🔴 Не начато | 0% |
| **Results/Analytics** | ⚠️ Базовое | 40% |
| **Notifications** | ⚠️ Базовое | 50% |
| **Security/Audit** | 🔴 Не начато | 0% |

---

## 📊 Архитектурный обзор

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT NATIVE FRONTEND                     │
│  (Camera → OCR via Tesseract.js → Text Extraction)          │
└──────────────────────────────────────────────────────────────┘
                              ↓
                         JSON (текст)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SPRING BOOT BACKEND                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   AUTH       │  │   TEST       │  │   SCAN       │      │
│  │ ✅ Complete  │  │ ✅ Complete  │  │ 🔴 TODO      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  GRADING     │  │  RESULTS     │  │NOTIFICATION │      │
│  │ ⚠️ Partial   │  │ ⚠️ Partial   │  │ ⚠️ Partial   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │        SHARED: Config, Exception, Mapper         │       │
│  │        SECURITY: JWT, Filters, Audit             │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                      PostgreSQL (БД)
```

---

## 🚀 ФАЗА 1: Scan Processing Core (Недели 1-3)

### 1.1 Основные сервисы

#### **ScanSessionService**
```
Задачи:
✓ Создание новой scan session
✓ Отслеживание статуса (PENDING → PROCESSING → COMPLETED/FAILED)
✓ Управление метаданными (device_id, device_model, processing_time)
✓ Связь session с test_id и user_id

Методы:
- createScanSession(CreateScanSessionRequest) → ScanSessionResponse
- getScanSessionStatus(sessionId) → SessionStatusResponse
- completeScanSession(sessionId) → void
- failScanSession(sessionId, errorMessage) → void
```

#### **ScannedBlankService**
```
Задачи:
✓ Сохранение сканированных бланков
✓ Управление OCR confidence
✓ Отслеживание качества распознавания
✓ Управление статусом review

Методы:
- createScannedBlank(CreateScannedBlankRequest, sessionId) → ScannedBlankResponse
- updateBlankConfidence(blankId, confidenceScore) → void
- markForReview(blankId, reason) → void
- getBlankDetails(blankId) → ScannedBlankDetailResponse
- listBlanksInSession(sessionId) → List<ScannedBlankResponse>
```

### 1.2 Структура запросов/ответов

#### Request: Process Scan
```json
POST /api/scans/process
{
  "scanSessionId": "uuid",
  "testId": "uuid",
  "studentName": "Иван Петров",
  "studentClass": "10A",
  "testDate": "2026-02-08",
  
  "answers": [
    {
      "questionNumber": 1,
      "scannedAnswer": "ABC",
      "confidence": 0.95
    },
    {
      "questionNumber": 2,
      "scannedAnswer": "ДБВ",
      "confidence": 0.87
    }
  ],
  
  "errorCorrections": [
    {
      "questionNumber": 1,
      "originalAnswer": "ABC",
      "correctedAnswer": "АБВ"
    }
  ],
  
  "ocrMetadata": {
    "overallConfidence": 0.92,
    "processingTimeMs": 2500,
    "tesseractVersion": "5.3"
  }
}
```

#### Response: Scan Stored
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "blankId": "uuid",
    "sessionId": "uuid",
    "status": "STORED",
    "needsReview": false,
    "confidenceScore": 0.92,
    "message": "Бланк успешно сохранен"
  }
}
```

### 1.3 Контроллер

```
ScanController:
  POST   /api/scans/process              → processScan()
  GET    /api/scans/sessions/{id}        → getScanSession()
  GET    /api/scans/blanks/{id}          → getBlankDetails()
  GET    /api/scans/sessions/{id}/blanks → listSessionBlanks()
  PUT    /api/scans/blanks/{id}/review   → markForReview()
```

### 1.4 База данных - индексы

```sql
-- Для быстрого поиска активных сессий
CREATE INDEX idx_scan_sessions_status_test 
  ON scan_sessions(status, test_id);

-- Для поиска бланков в сессии
CREATE INDEX idx_scanned_blanks_session_scored 
  ON scanned_blanks(scan_session_id, is_scored);

-- Для поиска требующих review
CREATE INDEX idx_scanned_blanks_review_needed 
  ON scanned_blanks(needs_review, review_status);

-- Для поиска по student name
CREATE INDEX idx_scanned_blanks_student 
  ON scanned_blanks(student_name, student_class);
```

---

## 📍 ФАЗА 2: Answer Extraction & Matching (Недели 4-5)

### 2.1 Сервисы

#### **AnswerExtractionService**
```
Задачи:
✓ Парсинг массива ответов из OCR
✓ Нормализация формата ответов
✓ Валидация (не пусто, не выходит за пределы)
✓ Обработка исправлений (ошибка → исправленный ответ)

Методы:
- extractAnswers(ScannedBlank) → ExtractedAnswersDto
- normalizeAnswer(String) → String
- applyErrorCorrections(List<Answer>, List<Correction>) → List<Answer>
- validateAnswers(List<Answer>, totalQuestions) → ValidationResult
```

#### **AnswerMatchingService**
```
Задачи:
✓ Сравнение OCR ответов с answer keys
✓ Fuzzy matching (Levenshtein distance)
✓ Применение tolerance level (1 символ = -1 балл и т.д.)
✓ Расчет confidence для каждого ответа

Методы:
- matchAnswers(answers, answerKeys, test) → MatchResult
- calculateSimilarity(String answer1, String answer2) → Double (0.0-1.0)
- applyTolerance(similarity, toleranceLevel, maxPoints) → Points
- getAnswerQuality(answer, matchedAnswer) → Quality (PERFECT, GOOD, FAIR, POOR)
```

#### **ReviewWorkflowService**
```
Задачи:
✓ Определение какие ответы нужны для manual review
✓ Создание очереди review
✓ Получение списка для review учителем
✓ Сохранение корректировки

Методы:
- identifyAnswersForReview(matchResult) → List<ReviewItem>
- getReviewQueue(testId) → List<BlankForReview>
- submitReview(blankId, corrections) → ReviewResult
- getReviewStatus(blankId) → ReviewStatusDto
```

### 2.2 Логика Fuzzy Matching

```
Пример:
Ключ: "АБВГД"
OCR сканировал: "АВГД" (пропущена Б, остальное верно)

Similarity = 4/5 = 0.8
Tolerance level = 1
Max points = 10

Расчет:
- Full match: 10 баллов
- 1 ошибка (tolerance 1): 10 - 1 = 9 баллов
- 2+ ошибки: 10 - 2 = 8 баллов
- etc.

В нашем случае: 4 из 5 совпадают
→ 1 ошибка → 9 баллов
```

### 2.3 Контроллер

```
AnswerController:
  POST   /api/answers/extract          → extractAnswers()
  POST   /api/answers/match            → matchAnswers()
  GET    /api/answers/review-queue     → getReviewQueue()
  POST   /api/answers/review/{blankId} → submitReview()
```

---

## 🎓 ФАЗА 3: Results Pipeline & Scoring (Недели 6-7)

### 3.1 Сервисы

#### **ScoringService** (улучшенная)
```
Текущий статус: Частичная реализация

Нужно добавить:
✓ Связь ScannedBlank → GradingResult
✓ Расчет финального балла после matching
✓ Применение grade thresholds
✓ Генерация feedback на основе результатов

Методы:
- scoreBlank(scannedBlank, answerKeys, gradeThresholds) → ScoringResult
- calculateFinalScore(answers, answerKeys) → Decimal
- applyGradeThreshold(percentage, thresholds) → Grade
- generateFeedback(scoringResult) → String
```

#### **ResultsAggregationService**
```
Задачи:
✓ Агрегация результатов из session
✓ Подсчет статистики
✓ Сравнение результатов

Методы:
- aggregateSessionResults(sessionId) → SessionResultsSummary
- calculateAverageScore(blanks) → Decimal
- calculateMedian(blanks) → Decimal
- calculateDistribution(blanks) → GradeDistribution
- compareWithPreviousSessions(testId) → ComparisonReport
```

#### **TestAnalyticsService**
```
Задачи:
✓ Расчет аналитики по тесту
✓ Question-level анализ
✓ Tracking common mistakes
✓ Trend analysis

Методы:
- generateTestAnalytics(testId) → TestAnalyticsDto
- analyzeQuestionDifficulty(testId) → Map<Integer, Difficulty>
- identifyCommonMistakes(testId) → List<CommonMistake>
- trackTrends(testId) → TrendAnalysis
```

### 3.2 Структура GradingResult (улучшенная)

```java
GradingResult:
  - id: UUID
  - scannedBlankId: UUID  ← НОВОЕ (связь со сканом)
  - testId: UUID
  - studentName: String
  - studentClass: String
  - rawScore: Decimal      ← Балл из ответов
  - maxScore: Decimal
  - percentage: Decimal    ← Процент (rawScore / maxScore * 100)
  - grade: String          ← Оценка ("5", "4", "3", "2")
  - feedback: String       ← Генерированный комментарий
  - answerDetails: List<GradingAnswerDetail>
  - generatedAt: LocalDateTime
```

### 3.3 Контроллер

```
ResultsController:
  GET    /api/results/{testId}                    → getTestResults()
  GET    /api/results/{testId}/summary            → getResultsSummary()
  GET    /api/results/{testId}/analytics          → getTestAnalytics()
  GET    /api/results/{resultId}/details          → getDetailedResult()
  POST   /api/results/{resultId}/feedback         → updateFeedback()
```

---

## 🔔 ФАЗА 4: Notification Refinement (Недели 8-9)

### 4.1 Новые типы уведомлений

```
Notification Types:

SCAN_COMPLETED
  → Отправляется когда: scan session завершена
  → Кому: учителю (creator)
  → Содержит: количество обработанных бланков

SCAN_FAILED
  → Отправляется когда: session завалилась
  → Кому: учителю
  → Содержит: причину ошибки

REVIEW_REQUIRED
  → Отправляется когда: есть ответы требующие review
  → Кому: учителю (test creator)
  → Содержит: количество требующих review

RESULTS_READY
  → Отправляется когда: все результаты готовы
  → Кому: учителю
  → Содержит: ссылку на results page

GRADING_ERROR
  → Отправляется когда: ошибка при расчете оценок
  → Кому: admins
  → Содержит: details ошибки
```

### 4.2 Event-Driven Architecture

```
Events:

ScanCompletedEvent
  → Triggered: ScanSessionService.completeScanSession()
  → Listeners: NotificationService, AnalyticsService

ReviewRequiredEvent
  → Triggered: ReviewWorkflowService.identifyAnswersForReview()
  → Listeners: NotificationService

ResultsGeneratedEvent
  → Triggered: ScoringService.scoreBlank()
  → Listeners: NotificationService, TestAnalyticsService

GradingFailedEvent
  → Triggered: Exception in scoring
  → Listeners: NotificationService, AuditService
```

### 4.3 Email Templates

Создать html templates в `/src/main/resources/templates/`:

```
- scan-completed-email.html
- review-required-email.html
- results-ready-email.html
- grading-error-email.html
```

### 4.4 Контроллер

```
NotificationController:
  GET    /api/notifications                    → listNotifications()
  GET    /api/notifications/unread             → getUnreadCount()
  PUT    /api/notifications/{id}/read          → markAsRead()
  DELETE /api/notifications/{id}               → deleteNotification()
```

---

## 🧪 ФАЗА 5: Testing & Optimization (Недели 10-11)

### 5.1 Integration Tests

```
Test Suite: ScanProcessingIT
  ✓ testFullScanPipeline()
    - Create session
    - Process blank
    - Extract answers
    - Match with keys
    - Score and grade
    
  ✓ testAnswerMatching()
    - Perfect match → full points
    - 1 error → tolerance applied
    - Multiple errors → reduced points
    
  ✓ testReviewWorkflow()
    - Low confidence detected
    - Added to review queue
    - Teacher corrects
    - Re-scored
    
  ✓ testBulkScans()
    - 1000 blanks in one session
    - Measure processing time
    - Check memory usage

Test Suite: GradingIT
  ✓ testGradeThresholdApplication()
  ✓ testFeedbackGeneration()
  ✓ testAnalyticsCalculation()
```

### 5.2 Load Testing

```
Test: 1000 blanks per session
- Target: Complete in < 5 minutes
- Monitor: CPU, Memory, DB connections
- Optimize: Batch processing, connection pooling
```

### 5.3 Optimization Points

```
1. Database Query Optimization
   - Add composite indexes
   - Implement pagination (100 items per page)
   - Use projection queries (SELECT id, name ONLY)

2. Fuzzy Matching Performance
   - Cache answer keys (Redis)
   - Batch processing (process 100 answers in parallel)
   - Pre-compile regex patterns

3. Memory Management
   - Process large JSON in chunks
   - Stream file uploads
   - Clean up temporary data

4. API Response Time
   - Add response caching (30 min for analytics)
   - Implement async processing for long operations
   - Return partial results (pagination)
```

---

## 🏗️ ФАЗА 6: Microservices Groundwork (Неделя 12+)

### 6.1 Service Boundaries

```
Current: MONOLITH
├── auth-module
├── test-module
├── scan-module        ← Large & independent
├── grading-module     ← Can be extracted
├── results-module
└── notification-module ← Event-driven

Future: MICROSERVICES
├── auth-service
├── test-service
├── scan-processor-service     ← Extracted
│   └── Handles: process scan, answer extraction, answer matching
├── grading-engine-service     ← Extracted
│   └── Handles: scoring, feedback generation, grade thresholds
├── results-service
├── notification-service       ← Async via message broker
└── ocr-service (separate)
```

### 6.2 Message Broker Integration

```
RabbitMQ/Kafka Topics:

scan.processed
  ↓ Published by: ScanService
  ↓ Subscribed by: GradingService, NotificationService, AnalyticsService

scan.failed
  ↓ Published by: ScanService
  ↓ Subscribed by: NotificationService, AuditService

results.generated
  ↓ Published by: GradingService
  ↓ Subscribed by: ResultsService, NotificationService, AnalyticsService
```

### 6.3 Resilience Patterns

```
1. Circuit Breaker (для OCR calls)
   - Fail fast если OCR service down
   - Fallback: mark for manual review

2. Retry Logic
   - Exponential backoff для failed scans
   - Max 3 retries

3. Timeout Management
   - Scan processing: max 10 seconds per blank
   - Matching: max 5 seconds per blank

4. Distributed Tracing
   - Trace ID для каждого scan session
   - Track путь через все сервисы
```

---

## 📈 Timeline & Milestones

```
WEEK 1-3:   Phase 1 ✓ Scan Processing Core
            - Endpoints ready for React Native integration
            - Database migrations complete
            
WEEK 4-5:   Phase 2 ✓ Answer Extraction & Matching
            - Fuzzy matching algorithm tested
            - Review workflow functional
            
WEEK 6-7:   Phase 3 ✓ Results & Scoring
            - Full scoring pipeline operational
            - Analytics ready
            
WEEK 8-9:   Phase 4 ✓ Event-Driven Notifications
            - Email notifications working
            - Async processing in place
            
WEEK 10-11: Phase 5 ✓ Testing & Optimization
            - Load testing passed
            - Performance optimized
            
WEEK 12+:   Phase 6 → Microservices preparation
            - Document service boundaries
            - Plan migration strategy
```

---

## 🎯 Success Criteria

### Phase 1
- [ ] ScanSession & ScannedBlank services created
- [ ] /api/scans/process endpoint working
- [ ] React Native can upload scan data
- [ ] Confidence scores stored correctly

### Phase 2
- [ ] Answer extraction working with 95%+ accuracy
- [ ] Fuzzy matching matches 90%+ of answers correctly
- [ ] Review workflow functional

### Phase 3
- [ ] Scoring pipeline complete
- [ ] Grade calculation working
- [ ] Analytics generated correctly

### Phase 4
- [ ] All 4 notification types sending
- [ ] Email templates styled
- [ ] Event listeners working

### Phase 5
- [ ] Integration tests > 80% passing
- [ ] Load test: 1000 blanks in < 5 min
- [ ] API docs (Swagger) complete

### Phase 6
- [ ] Service boundaries documented
- [ ] Message broker design ready
- [ ] Migration plan created

---

## ❓ FAQs

**Q: Когда начинать с OCR интеграцией на React Native?**
A: После Phase 1 будут ready endpoints для тестирования. Фронтенд может начать разработку параллельно с Phase 2.

**Q: Нужна ли база данных для used tokens?**
A: На текущем этапе можно обойтись без специальной таблицы (Redis или in-memory). Добавить после Phase 5.

**Q: Как обрабатывать класс студента?**
A: Добавить `classLevel` в Test entity. В GradingResult проверить совпадение `scannedBlank.studentClass = test.classLevel`.

**Q: Нужен ли Audit Logging с самого начала?**
A: Нет, можно отложить до Phase 6. На текущем этапе логировать в `scan_history` достаточно.

**Q: Когда интегрировать распределенные транзакции?**
A: В Phase 6 при переходе на микросервисы. Сейчас одна БД, не нужно.

---

## 📚 Справочные материалы

- Database Schema: `Complete_Test_Plan.json`
- API Spec: `Test_Scanner_API.postman_collection.json`
- Testing Guide: `COMPLETE_TESTING_GUIDE.md`
- Current Code Structure: `/src/main/java/com/Ghallab/dev/Test_Scanner_backend/`

---

**Next Step**: Начните с Phase 1 - создания ScanSessionService и ScannedBlankService! 🚀

