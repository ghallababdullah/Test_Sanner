# 📖 План развития — Индекс и справочник

**Создано:** 8 февраля 2026  
**Статус:** ✅ Готово к реализации

---

## 📚 Все документы плана

### 📋 Основные документы (Читайте в этом порядке)

1. **[DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)** ← НАЧНИТЕ ОТСЮДА
   - Полный план развития (12 недель)
   - 6 фаз разработки
   - Техническая архитектура
   - Описание каждого модуля
   - `Время чтения: 20 минут`

2. **[PRIORITY_MATRIX.md](PRIORITY_MATRIX.md)** ← СМОТРИТЕ ДАЛЕЕ
   - Что делать немедленно (Неделя 1)
   - Известные проблемы
   - Рекомендации
   - Чек-лист доставки
   - `Время чтения: 10 минут`

3. **[PHASE_1_TECHNICAL_SPEC.md](PHASE_1_TECHNICAL_SPEC.md)** ← ДЛЯ КОДИРОВАНИЯ
   - Детальная спецификация фазы 1
   - Все DTOs с примерами
   - Интерфейсы сервисов
   - Примеры реализации
   - SQL миграции
   - Примеры тестов
   - `Время чтения: 30 минут`

4. **[VISUAL_ROADMAP.md](VISUAL_ROADMAP.md)** ← ДЛЯ ПЛАНИРОВАНИЯ
   - Визуальные диаграммы
   - Календарь по неделям
   - Зависимости
   - Риски
   - Показатели успеха
   - `Время чтения: 15 минут`

---

## 🎯 Быстрый старт (5 минут)

### Для Менеджера/Lead:
1. Прочитайте [VISUAL_ROADMAP.md](VISUAL_ROADMAP.md)
2. Проверьте **Critical Path** (критический путь)
3. Посмотрите **Risk Assessment** (оценка рисков)
4. Установите **Communication Plan** (план связи)

### Для Backend разработчика:
1. Прочитайте [PRIORITY_MATRIX.md](PRIORITY_MATRIX.md) → **Known Issues**
2. Выполните все задачи из **CRITICAL NEXT** (3 задачи)
3. Перейдите на [PHASE_1_TECHNICAL_SPEC.md](PHASE_1_TECHNICAL_SPEC.md)
4. Начните кодирование с DTOs

### Для React Native разработчика:
1. Посмотрите **PHASE 1** в [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md)
2. Найдите **ProcessScanRequest** в [PHASE_1_TECHNICAL_SPEC.md](PHASE_1_TECHNICAL_SPEC.md)
3. Начните готовить API интеграцию
4. Подготовьте OCR библиотеку (Tesseract.js)

---

## 🗺️ Архитектурный обзор

```
┌──────────────────────────────────────────────────────┐
│           PHASE 1: Scan Processing Core              │
│                                                      │
│  Frontend (React Native)                             │
│  └─> Camera → OCR → JSON                             │
│       └─> POST /api/scans/process                    │
│                                                      │
│  Backend (Spring Boot)                               │
│  ├─ ScanSessionService                               │
│  ├─ ScannedBlankService                              │
│  └─ ScanController (4 endpoints)                     │
│                                                      │
│  Database (PostgreSQL)                               │
│  ├─ scan_sessions (новая таблица уже есть)           │
│  ├─ scanned_blanks (новая таблица уже есть)          │
│  └─ Индексы (нужно добавить)                         │
└──────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────┐
│     PHASE 2: Answer Extraction & Matching            │
│                                                      │
│  AnswerExtractionService                             │
│  AnswerMatchingService (fuzzy matching)              │
│  ReviewWorkflowService                               │
│  └─> Endpoints for review, corrections               │
└──────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────┐
│        PHASE 3: Results Pipeline & Scoring           │
│                                                      │
│  ScoringService (улучшенная)                         │
│  ResultsAggregationService                           │
│  TestAnalyticsService                                │
│  └─> Complete grading & analytics                    │
└──────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────┐
│    PHASE 4: Event-Driven & Notifications             │
│                                                      │
│  Event listeners                                     │
│  Async email delivery                                │
│  Push notifications                                  │
│  └─> Users get notified of results                   │
└──────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────┐
│      PHASE 5: Testing & Optimization                 │
│                                                      │
│  Integration tests                                   │
│  Load testing (1000+ blanks)                         │
│  Performance optimization                            │
│  └─> < 5 min for full session                        │
└──────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────┐
│    PHASE 6: Microservices Groundwork                 │
│                                                      │
│  Service boundary documentation                      │
│  Message broker design (RabbitMQ/Kafka)              │
│  Migration strategy                                  │
│  └─> Ready to split into microservices               │
└──────────────────────────────────────────────────────┘
```

---

## 📊 Текущий статус по модулям

| Модуль | Статус | Процент | Примечание |
|--------|--------|---------|-----------|
| **Auth** | ✅ | 95% | Небольшие баги в фильтре |
| **Test Management** | ✅ | 90% | ModelMapper issues |
| **Grading** | ⚠️ Partial | 60% | Нужно связать со сканами |
| **Scan Processing** | 🔴 TODO | 0% | ПРИОРИТЕТ (Phase 1) |
| **Results Pipeline** | ⚠️ Partial | 40% | Lazy loading issues |
| **Notifications** | ⚠️ Partial | 50% | Needs events integration |
| **Security/Audit** | 🔴 TODO | 0% | Планируется Phase 6 |

---

## 🔴 Срочные задачи (Do First!)

```
НЕДЕЛЯ 1 - ИСПРАВЬТЕ ЭТИ ОШИБКИ:

1. AuthFilter null userRepository
   Файл: auth/security/AuthFilter.java
   Время: 30 минут
   Критичность: БЛОКИРУЕТ всё

2. ModelMapper Test → TestResponse ошибка
   Файл: common/config/AppConfig.java
   Время: 1 час
   Критичность: БЛОКИРУЕТ GET /api/tests

3. Create test endpoint возвращает 401
   Файл: auth/security/SecurityConfig.java
   Время: 2 часа
   Критичность: БЛОКИРУЕТ создание тестов

4. Version field AnswerKey ошибка
   Файл: test/domain/entity/AnswerKey.java
   Время: 30 минут
   Критичность: БЛОКИРУЕТ answer keys

5. Добавить индексы в БД
   Файл: db/migration/V9__Create_Scan_Indexes.sql
   Время: 30 минут
   Критичность: Производительность

ИТОГО: ~4-5 часов → Все endpoints работают ✅
```

---

## 📅 Недельный график

### Week 1: 8-15 Февраля 2026
```
Понедельник    - Читайте документы плана (2 часа)
Вторник        - Анализ текущих проблем (2 часа)
Среда          - Исправьте 3 критических bug (4 часа)
Четверг        - Протестируйте все endpoints (2 часа)
Пятница        - Документирование + подготовка (2 часа)

ИТОГО: 12 часов → Все ошибки исправлены ✅
```

### Weeks 2-3: 15 Февраля - 1 Марта 2026
```
Неделя 2: DTOs + Repositories (40 часов)
  - День 1-2: Создайте 7 DTOs
  - День 3-4: Создайте Repositories
  - День 5: Тесты для repositories

Неделя 3: Services + Controller (30 часов)
  - День 1-3: Реализуйте Services
  - День 4-5: Создайте Controller
  - День 6: Integration тесты

ИТОГО: 70 часов → Phase 1 готов ✅
```

---

## 🛠️ Инструменты и технологии

```
Backend:
  ✅ Spring Boot 4.0.1
  ✅ Spring Data JPA
  ✅ Spring Security
  ✅ Jakarta Validation
  ✅ ModelMapper
  ✅ Gradle 8.x

Database:
  ✅ PostgreSQL 17.5
  ✅ HikariCP (connection pooling)
  ⚠️ Flyway (миграции) - OPTIONAL

Testing:
  ✅ JUnit 5
  ✅ Mockito
  ✅ SpringBootTest

Frontend:
  ⚠️ React Native (скоро)
  ⚠️ Tesseract.js (для OCR)
  ⚠️ Camera API
```

---

## 📞 Как использовать этот план

### Если вы Backend разработчик:
```
Шаг 1: Прочитайте PRIORITY_MATRIX.md (10 мин)
Шаг 2: Исправьте 5 критических ошибок (4 часа)
Шаг 3: Прочитайте PHASE_1_TECHNICAL_SPEC.md (30 мин)
Шаг 4: Создайте структуру папок Phase 1
Шаг 5: Начните с создания DTOs
Шаг 6: Создайте Repositories
Шаг 7: Реализуйте Services
Шаг 8: Создайте Controller
Шаг 9: Напишите тесты
Шаг 10: Тестируйте в Postman
```

### Если вы React Native разработчик:
```
Шаг 1: Прочитайте DEVELOPMENT_ROADMAP.md (20 мин)
Шаг 2: Дождитесь Phase 1 (2-3 недели)
Шаг 3: Получите endpoint документацию
Шаг 4: Интегрируйте /api/scans/process
Шаг 5: Тестируйте на реальных сканах
Шаг 6: Оптимизируйте OCR на устройстве
```

### Если вы Manager/Lead:
```
Шаг 1: Прочитайте VISUAL_ROADMAP.md (15 мин)
Шаг 2: Проверьте Critical Path
Шаг 3: Установите Communication Plan
Шаг 4: Ассигнуйте ресурсы
Шаг 5: Еженедельные стендапы
Шаг 6: Проверяйте Milestone достижения
```

---

## ✅ Checklist для начала

- [ ] Прочитаны все 4 основных документа
- [ ] Понимаете 6 фаз разработки
- [ ] Знаете 5 критических багов
- [ ] Знаете архитектуру Phase 1
- [ ] Ознакомлены с структурой DTOs
- [ ] Готовы к кодированию

---

## 📞 FAQ

**Q: С чего начать в первый день?**  
A: Прочитайте PRIORITY_MATRIX.md, потом исправьте 3 критических bug.

**Q: Сколько времени займет Phase 1?**  
A: 2-3 недели при 40 часах в неделю на одного разработчика.

**Q: Когда React Native может начать интегрировать API?**  
A: После завершения Phase 1 (примерно неделя 4).

**Q: Нужна ли OCR на backend или на frontend?**  
A: На frontend (React Native). Backend получает только текстовые данные.

**Q: Когда нужны микросервисы?**  
A: После Phase 5, в Phase 6 (примерно неделя 12+).

**Q: Что если фаза займет больше времени?**  
A: Перепланируйте VISUAL_ROADMAP.md по актуальной информации.

---

## 🔗 Ссылки на основные файлы

### Документация плана:
- 📖 [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) - Полный план
- 🎯 [PRIORITY_MATRIX.md](PRIORITY_MATRIX.md) - Срочные задачи
- 🛠️ [PHASE_1_TECHNICAL_SPEC.md](PHASE_1_TECHNICAL_SPEC.md) - Техническая спецификация
- 🗺️ [VISUAL_ROADMAP.md](VISUAL_ROADMAP.md) - Визуальная дорожная карта

### Существующая документация:
- 📋 [Complete_Test_Plan.json](Complete_Test_Plan.json) - Схема БД
- 📝 [COMPLETE_TESTING_GUIDE.md](COMPLETE_TESTING_GUIDE.md) - Руководство по тестированию
- 🔧 [POSTMAN_REQUESTS.txt](POSTMAN_REQUESTS.txt) - Примеры запросов

### Исходный код:
- 📁 [src/main/java/](src/main/java/) - Весь код backend
- 📁 [src/main/resources/](src/main/resources/) - Конфигурация и шаблоны

---

## 💬 Контакты и поддержка

```
Вопросы о плане?           → Переточитайте документы
Блокеры/проблемы?          → Файл PRIORITY_MATRIX.md
Технические детали?         → Файл PHASE_1_TECHNICAL_SPEC.md
Архитектурные решения?      → Файл DEVELOPMENT_ROADMAP.md
```

---

## 📊 Успешное завершение

✅ Вы достигли успеха когда:

- Все 5 критических ошибок исправлены
- Phase 1 endpoints работают в Postman
- Написаны unit тесты (> 80% покрытие)
- React Native может вызвать /api/scans/process
- Все документы обновлены

---

**Документы созданы:** 8 февраля 2026  
**Версия плана:** 1.0  
**Статус:** ✅ Ready for implementation

---

## 🚀 Начните сейчас!

1. **Откройте:** [PRIORITY_MATRIX.md](PRIORITY_MATRIX.md)
2. **Прочитайте:** Раздел "CRITICAL NEXT"
3. **Исправьте:** 5 критических ошибок
4. **Затем:** Переходите на Phase 1

### Успехов! 🎉

