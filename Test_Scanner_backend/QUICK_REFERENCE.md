# 🎴 Справочная карточка — Быстрая помощь

**Печать для кабинета разработчика!**

---

## 🔴 ЭТОЙ НЕДЕЛЕ (Week 1: 8-15 Feb)

### Понедельник
- [ ] Прочитайте все документы плана (2 часа)
- [ ] Запланируйте время на исправления

### Вторник-Среда
- [ ] Исправьте AuthFilter bug (30 мин)
- [ ] Исправьте ModelMapper bug (1 час)
- [ ] Исправьте SecurityConfig bug (2 часа)
- [ ] Исправьте AnswerKey version (30 мин)
- [ ] Добавьте database индексы (30 мин)

### Четверг-Пятница
- [ ] Тестируйте все endpoints в Postman
- [ ] Проверьте что нет ошибок 401, 500
- [ ] Подготовьте Phase 1 структуру папок

**ЦЕЛЬ НЕДЕЛИ:** Все endpoints работают без ошибок ✅

---

## 📍 СЛЕДУЮЩИЕ 2 НЕДЕЛИ (Weeks 2-3: 15 Feb - 1 Mar)

### Неделя 2: DTOs + Repositories

```
День 1-2: Создайте DTOs (7 файлов)
  □ CreateScanSessionRequest.java
  □ ProcessScanRequest.java
  □ ScannedAnswerDto.java
  □ OcrMetadataDto.java
  □ ScanSessionResponse.java
  □ ScannedBlankResponse.java
  □ ScanProcessingResponse.java

День 3-4: Создайте Repositories
  □ ScanSessionRepository.java
  □ ScannedBlankRepository.java
  □ Напишите query methods

День 5: Тесты
  □ Unit tests для repositories
```

### Неделя 3: Services + Controller

```
День 1-3: Services (80 строк кода каждый)
  □ ScanSessionService interface
  □ ScanSessionServiceImpl (10 методов)
  □ ScannedBlankService interface
  □ ScannedBlankServiceImpl (8 методов)

День 4-5: Controller
  □ ScanController (4 endpoints)
  □ Exception handling
  □ Response formatting

День 6: Testing
  □ Integration tests
  □ Postman testing
```

**ЦЕЛЬ ДВУХ НЕДЕЛЬ:** /api/scans/process работает ✅

---

## 📂 Структура папок Phase 1

```
src/main/java/com/Ghallab/dev/Test_Scanner_backend/

scan/                                    ← CREATE THIS FOLDER
├── controller/
│   └── ScanController.java
├── domain/
│   ├── entity/                          (уже есть ScanSession, ScannedBlank)
│   ├── service/
│   │   ├── ScanSessionService.java      (interface)
│   │   ├── ScanSessionServiceImpl.java   (реализация)
│   │   ├── ScannedBlankService.java     (interface)
│   │   └── ScannedBlankServiceImpl.java  (реализация)
│   └── repository/
│       ├── ScanSessionRepository.java
│       └── ScannedBlankRepository.java
└── dto/
    ├── request/
    │   ├── CreateScanSessionRequest.java
    │   ├── ProcessScanRequest.java
    │   └── UpdateBlankStatusRequest.java
    └── response/
        ├── ScanSessionResponse.java
        ├── ScannedBlankResponse.java
        └── ScanProcessingResponse.java
```

---

## 🔑 4 Основных endpoints Phase 1

```
1. CREATE SCAN SESSION
   POST /api/scans/sessions
   Input:  CreateScanSessionRequest
   Output: ScanSessionResponse
   Status: 201 Created

2. PROCESS SCAN (главный endpoint)
   POST /api/scans/process
   Input:  ProcessScanRequest
   Output: ScanProcessingResponse
   Status: 201 Created

3. GET SESSION
   GET /api/scans/sessions/{sessionId}
   Output: ScanSessionResponse
   Status: 200 OK

4. LIST BLANKS IN SESSION
   GET /api/scans/sessions/{sessionId}/blanks
   Output: List<ScannedBlankResponse>
   Status: 200 OK
```

---

## 📊 Key DTO Fields

### ProcessScanRequest
```
{
  scanSessionId: UUID,
  testId: UUID,
  studentName: String,
  studentClass: String,
  testDate: LocalDate,
  answers: [
    {
      questionNumber: 1-32,
      scannedAnswer: String,
      confidence: 0.0-1.0
    }
  ],
  errorCorrections: [
    {
      questionNumber: 1-32,
      originalAnswer: String,
      correctedAnswer: String
    }
  ],
  ocrMetadata: {
    overallConfidence: 0.0-1.0,
    processingTimeMs: Integer,
    tesseractVersion: String
  }
}
```

---

## 💻 Минимальный код для начала

### ScanSessionServiceImpl (шаблон)
```java
@Service
@RequiredArgsConstructor
public class ScanSessionServiceImpl implements ScanSessionService {
    
    private final ScanSessionRepository repo;
    private final TestRepository testRepo;
    private final ModelMapper mapper;
    
    @Override
    public ScanSessionResponse createScanSession(
            CreateScanSessionRequest req, User user) {
        // 1. Проверить test существует
        // 2. Создать ScanSession entity
        // 3. Сохранить в БД
        // 4. Вернуть mapped response
    }
}
```

### ScanController (шаблон)
```java
@RestController
@RequestMapping("/api/scans")
@RequiredArgsConstructor
public class ScanController {
    
    private final ScanSessionService sessionService;
    private final ScannedBlankService blankService;
    
    @PostMapping("/process")
    public ResponseEntity<ApiResponse<?>> processScan(
            @Valid @RequestBody ProcessScanRequest req) {
        // Validate, process, return response
    }
}
```

---

## 🗄️ SQL Индексы для базы

```sql
-- Добавить в migration файл V9__Create_Scan_Indexes.sql

CREATE INDEX idx_scan_sessions_test_status 
  ON scan_sessions(test_id, status);

CREATE INDEX idx_scanned_blanks_session_scored 
  ON scanned_blanks(scan_session_id, is_scored);

CREATE INDEX idx_scanned_blanks_review 
  ON scanned_blanks(needs_review, review_status);
```

---

## 🧪 Простой тест (Postman)

### Test 1: Create Session
```
POST http://localhost:8080/api/scans/sessions
Authorization: Bearer {token}

{
  "testId": "{test_uuid}",
  "description": "Test session",
  "deviceId": "device-1",
  "deviceModel": "iPhone 14"
}
```

### Test 2: Process Scan
```
POST http://localhost:8080/api/scans/process
Authorization: Bearer {token}

{
  "scanSessionId": "{session_uuid}",
  "testId": "{test_uuid}",
  "studentName": "John Doe",
  "studentClass": "10A",
  "testDate": "2026-02-08",
  "answers": [
    {"questionNumber": 1, "scannedAnswer": "ABC", "confidence": 0.95}
  ],
  "ocrMetadata": {
    "overallConfidence": 0.92,
    "processingTimeMs": 2500,
    "tesseractVersion": "5.3"
  }
}
```

---

## ⚡ Полезные команды

```bash
# Запустить приложение
./gradlew bootRun

# Запустить тесты
./gradlew test

# Собрать без запуска
./gradlew build

# Очистить и собрать
./gradlew clean build

# Проверить SQL синтаксис
psql -U user -d scanner_db -f migration.sql
```

---

## 🎯 Ежедневный план (8 часов работы)

```
09:00-10:00  - Планирование + Coffee
10:00-12:00  - Кодирование (главная работа)
12:00-13:00  - Обед
13:00-16:00  - Кодирование (главная работа)
16:00-16:30  - Тестирование
16:30-17:00  - Документирование + коммит

ГЛАВНОЕ: 6 часов кодирования в день = 2 дня на DTO + Services
```

---

## ✅ Чек-лист для завершения Phase 1

- [ ] 7 DTOs созданы и скомпилированы
- [ ] 2 Repositories созданы с методами
- [ ] ScanSessionService полностью реализована
- [ ] ScannedBlankService полностью реализована
- [ ] ScanController с 4 endpoints
- [ ] ModelMapper конфигурация добавлена
- [ ] Unit tests написаны
- [ ] Integration tests написаны
- [ ] Все 4 endpoints работают в Postman
- [ ] Нет ошибок при запуске
- [ ] Данные сохраняются в БД правильно
- [ ] Документация обновлена

---

## 📞 Помощь и поддержка

**Если что-то не понимаешь:**
1. Читай PHASE_1_TECHNICAL_SPEC.md (примеры там)
2. Смотри примеры в текущем коде (test module)
3. Спрашивай у LLM (я помогу)

**Если есть ошибка:**
1. Читай stack trace
2. Гугли ошибку
3. Проверь PRIORITY_MATRIX.md (может там ответ)

**Если медленно:**
1. Начни с DTOs (самое простое)
2. Затем Repositories
3. Затем Services
4. Затем Controller

---

## 🎉 Успех!

Когда Phase 1 завершена:
- ✅ React Native может интегрировать API
- ✅ Scan данные сохраняются в БД
- ✅ Backend готов к Phase 2
- ✅ Ты готов к Microservices архитектуре

---

**Напечатайте эту карточку и повесьте над столом!**

**Вопросы?** → Читай PLAN_INDEX.md

**Начинай!** → Откройте PRIORITY_MATRIX.md

