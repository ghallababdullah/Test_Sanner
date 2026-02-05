# 🧪 COMPLETE TEST PLAN - ALL ENDPOINTS

## 📋 Оглавление
- [PHASE 1: CREATE TESTS](#phase-1-create-tests)
- [PHASE 2: CREATE ANSWER KEYS](#phase-2-create-answer-keys)
- [PHASE 3: GET ENDPOINTS](#phase-3-get-endpoints)
- [PHASE 4: UPDATE ENDPOINTS](#phase-4-update-endpoints)
- [PHASE 5: DELETE ENDPOINTS](#phase-5-delete-endpoints)
- [PHASE 6: VERIFICATION](#phase-6-verification)

---

# PHASE 1: CREATE TESTS

## Step 1.1 - Create Test 1 (Математика - 10 questions)

### API Address
```
POST http://localhost:8080/api/tests/create-test
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
```

### Request JSON
```json
{
  "title": "Математика 5 класс - Контрольная работа",
  "subject": "Математика",
  "description": "Контрольная работа по пройденному материалу",
  "totalQuestions": 10,
  "maxScore": 100.0
}
```

### Expected Result
```json
{
  "success": true,
  "message": "Test created successfully",
  "statusCode": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Математика 5 класс - Контрольная работа",
    "subject": "Математика",
    "description": "Контрольная работа по пройденному материалу",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "isActive": true,
    "creatorId": "john.doe@test.com",
    "createdAt": "2026-02-04T10:00:00"
  }
}
```

### Explanation
Создаёт новый тест для преподавателя. Сохраняется `data.id` как `{{test1Id}}` для использования в последующих шагах. Автоматически создаются 4 дефолтных порога оценок (2-5).

---

## Step 1.2 - Create Test 2 (Русский язык - 5 questions)

### API Address
```
POST http://localhost:8080/api/tests/create-test
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
```

### Request JSON
```json
{
  "title": "Русский язык 6 класс - Проверочная работа",
  "subject": "Русский язык",
  "description": "Проверочная работа на пройденные правила орфографии",
  "totalQuestions": 5,
  "maxScore": 50.0
}
```

### Expected Result
```
Status: 201 Created
```

### Explanation
Создаёт второй тест. Сохраняется ID как `{{test2Id}}`. Этот тест будет удален в PHASE 5 для проверки cascade delete.

---

## Step 1.3 - Create Test 3 (История - 5 questions)

### API Address
```
POST http://localhost:8080/api/tests/create-test
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
```

### Request JSON
```json
{
  "title": "История 7 класс - Тест по Средневековью",
  "subject": "История",
  "description": "Тест на знание событий Средневековья",
  "totalQuestions": 5,
  "maxScore": 50.0
}
```

### Expected Result
```
Status: 201 Created
```

### Explanation
Создаёт третий тест. Сохраняется ID как `{{test3Id}}`. Из этого теста будет удалён один answer key в PHASE 5.

---

## Step 1.4 - Try Create Test 4 with 33 Questions (SHOULD FAIL)

### API Address
```
POST http://localhost:8080/api/tests/create-test
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
```

### Request JSON
```json
{
  "title": "Физика 9 класс - Механика",
  "subject": "Физика",
  "description": "Попытка создания теста с 33 вопросами - должно ошибиться!",
  "totalQuestions": 33,
  "maxScore": 330.0
}
```

### Expected Result
```json
{
  "success": false,
  "message": "totalQuestions must be between 1 and 32",
  "statusCode": 400
}
```

### Explanation
**ВАЖНО**: Этот запрос ДОЛЖЕН ошибиться! Проверяет валидацию constraint: `totalQuestions` не может быть больше 32. Это тест validation, а не error.

---

## Step 1.5 - Create Test 4 CORRECTLY (Физика - 32 questions MAX)

### API Address
```
POST http://localhost:8080/api/tests/create-test
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
```

### Request JSON
```json
{
  "title": "Физика 9 класс - Механика (Полная)",
  "subject": "Физика",
  "description": "Полный тест по механике с максимальным количеством вопросов",
  "totalQuestions": 32,
  "maxScore": 320.0
}
```

### Expected Result
```json
{
  "success": true,
  "message": "Test created successfully",
  "statusCode": 201,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Физика 9 класс - Механика (Полная)",
    "subject": "Физика",
    "totalQuestions": 32,
    "maxScore": 320.0,
    "isActive": true
  }
}
```

### Explanation
Создаёт четвёртый тест с **максимальным количеством вопросов (32)**. Сохраняется ID как `{{test4Id}}`. Для этого теста будут созданы 32 answer key в PHASE 2.

---

# PHASE 2: CREATE ANSWER KEYS

## Step 2.1 - Create 10 Answer Keys for Test 1

### API Address
```
POST http://localhost:8080/api/tests/{{test1Id}}/answer-keys
```

### Headers
```
Content-Type: application/json
```

### Request JSON (Повтори 10 раз)
```json
{
  "testId": "{{test1Id}}",
  "questionNumber": 1,
  "correctAnswer": "ABC",
  "maxPoints": 10.0,
  "toleranceLevel": 1,
  "answerType": "TEXT"
}
```

**Меняй для каждого повтора:**
- questionNumber: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- correctAnswer: "ABC", "DEF", "GHI", "JKL", "MNO", "PQR", "STU", "VWX", "YZA", "BCD"

### Expected Result
```json
{
  "success": true,
  "message": "Answer key created successfully",
  "statusCode": 201,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "testId": "{{test1Id}}",
    "questionNumber": 1,
    "correctAnswer": "ABC",
    "maxPoints": 10.0,
    "toleranceLevel": 1,
    "answerType": "TEXT"
  }
}
```

### Explanation
Создаёт 10 ключей ответов для Test 1 (по одному на каждый вопрос). После первого повтора сохраняется ID как `{{answerKey1_1}}` для использования в PHASE 4 (обновление).

---

## Step 2.2 - Create 5 Answer Keys for Test 2

### API Address
```
POST http://localhost:8080/api/tests/{{test2Id}}/answer-keys
```

### Headers
```
Content-Type: application/json
```

### Request JSON (Повтори 5 раз)
```json
{
  "testId": "{{test2Id}}",
  "questionNumber": 1,
  "correctAnswer": "пример",
  "maxPoints": 10.0,
  "toleranceLevel": 2,
  "answerType": "TEXT"
}
```

**Меняй для каждого повтора:**
- questionNumber: 1, 2, 3, 4, 5
- correctAnswer: "пример", "тест", "ответ", "слово", "вопрос"

### Expected Result
```
Status: 201 Created
```

### Explanation
Создаёт 5 ключей для Test 2. Когда Test 2 будет удалён в PHASE 5, все эти ключи автоматически удалятся (cascade delete).

---

## Step 2.3 - Create 5 Answer Keys for Test 3

### API Address
```
POST http://localhost:8080/api/tests/{{test3Id}}/answer-keys
```

### Headers
```
Content-Type: application/json
```

### Request JSON (Повтори 5 раз)
```json
{
  "testId": "{{test3Id}}",
  "questionNumber": 1,
  "correctAnswer": "1066",
  "maxPoints": 10.0,
  "toleranceLevel": 0,
  "answerType": "TEXT"
}
```

**Меняй для каждого повтора:**
- questionNumber: 1, 2, 3, 4, 5
- correctAnswer: "1066", "1453", "800", "1348", "1492"

### Expected Result
```
Status: 201 Created
```

### Explanation
Создаёт 5 ключей для Test 3. Первый ключ (questionNumber: 1) будет удален в PHASE 5 для проверки удаления отдельного ключа.

---

## Step 2.4 - Create 32 Answer Keys for Test 4 (MAXIMUM!)

### API Address
```
POST http://localhost:8080/api/tests/{{test4Id}}/answer-keys
```

### Headers
```
Content-Type: application/json
```

### Request JSON (Повтори 32 раза)
```json
{
  "testId": "{{test4Id}}",
  "questionNumber": 1,
  "correctAnswer": "F=ma",
  "maxPoints": 10.0,
  "toleranceLevel": 1,
  "answerType": "TEXT"
}
```

**Меняй для каждого повтора:**
- questionNumber: 1, 2, 3, ..., 32
- correctAnswer: "F=ma", "E=mc2", "v=at", "s=vt", "T=2π√(L/g)", ... (разные физические формулы)

### Expected Result
```
Status: 201 Created (для каждого из 32 запросов)
```

### Explanation
Создаёт **максимальное количество ключей (32)** для Test 4 с максимальным количеством вопросов (32). Тестирует constraint, что каждый вопрос может иметь только один ключ.

---

# PHASE 3: GET ENDPOINTS

## Step 3.1 - Get All Tests

### API Address
```
GET http://localhost:8080/api/tests
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "All tests retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "{{test1Id}}",
      "title": "Математика 5 класс - Контрольная работа",
      "subject": "Математика",
      "totalQuestions": 10,
      "maxScore": 100.0,
      "isActive": true
    },
    {
      "id": "{{test2Id}}",
      "title": "Русский язык 6 класс - Проверочная работа",
      ...
    },
    {
      "id": "{{test3Id}}",
      "title": "История 7 класс - Тест по Средневековью",
      ...
    },
    {
      "id": "{{test4Id}}",
      "title": "Физика 9 класс - Механика (Полная)",
      ...
    }
  ]
}
```

### Explanation
Возвращает список всех активных тестов. На этом этапе должно быть 4 теста. После PHASE 5 (удаление Test 2) будет только 3 теста.

---

## Step 3.2 - Get Test 1 by ID

### API Address
```
GET http://localhost:8080/api/tests/{{test1Id}}
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Test retrieved successfully",
  "statusCode": 200,
  "data": {
    "id": "{{test1Id}}",
    "title": "Математика 5 класс - Контрольная работа",
    "subject": "Математика",
    "description": "Контрольная работа по пройденному материалу",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "isActive": true,
    "creatorId": "john.doe@test.com",
    "createdAt": "2026-02-04T10:00:00"
  }
}
```

### Explanation
Получает информацию об одном конкретном тесте по его ID. Возвращает базовую информацию без связанных данных (ключи и пороги).

---

## Step 3.3 - Get Test 1 With Details

### API Address
```
GET http://localhost:8080/api/tests/{{test1Id}}/details
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Test with details retrieved successfully",
  "statusCode": 200,
  "data": {
    "id": "{{test1Id}}",
    "title": "Математика 5 класс - Контрольная работа",
    "subject": "Математика",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "isActive": true,
    "creatorId": "john.doe@test.com",
    "createdAt": "2026-02-04T10:00:00",
    "answerKeys": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "testId": "{{test1Id}}",
        "questionNumber": 1,
        "correctAnswer": "ABC",
        "maxPoints": 10.0,
        "toleranceLevel": 1
      },
      ...
      (всего 10 ключей)
    ],
    "gradeThresholds": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "testId": "{{test1Id}}",
        "gradeName": "Отлично",
        "gradeSymbol": "5",
        "minPercentage": 91,
        "maxPercentage": 100
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440001",
        "gradeName": "Хорошо",
        "gradeSymbol": "4",
        "minPercentage": 71,
        "maxPercentage": 90
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440002",
        "gradeName": "Удовлетворительно",
        "gradeSymbol": "3",
        "minPercentage": 51,
        "maxPercentage": 70
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "gradeName": "Неудовлетворительно",
        "gradeSymbol": "2",
        "minPercentage": 0,
        "maxPercentage": 50
      }
    ]
  }
}
```

### Explanation
Получает тест со всеми связанными данными: 10 answer keys и 4 дефолтных порога оценок. Важно: после PHASE 4 обновления, минимум для оценки "5" изменится с 91 на 90.

---

## Step 3.4 - Get Tests by User

### API Address
```
GET http://localhost:8080/api/tests/user/{{userId}}
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "All tests retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "{{test1Id}}",
      "title": "Математика 5 класс - Контрольная работа",
      ...
    },
    {
      "id": "{{test2Id}}",
      "title": "Русский язык 6 класс - Проверочная работа",
      ...
    },
    {
      "id": "{{test3Id}}",
      "title": "История 7 класс - Тест по Средневековью",
      ...
    },
    {
      "id": "{{test4Id}}",
      "title": "Физика 9 класс - Механика (Полная)",
      ...
    }
  ]
}
```

### Explanation
Возвращает все тесты, созданные конкретным пользователем (по email). На этом этапе 4 теста, но после PHASE 5 будет 3.

---

## Step 3.5 - Get Answer Keys for Test 1

### API Address
```
GET http://localhost:8080/api/tests/{{test1Id}}/answer-keys
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Answer keys retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "testId": "{{test1Id}}",
      "questionNumber": 1,
      "correctAnswer": "ABC",
      "maxPoints": 10.0,
      "toleranceLevel": 1
    },
    {
      "questionNumber": 2,
      "correctAnswer": "DEF",
      ...
    },
    ...
    (всего 10 ключей, отсортированы по questionNumber)
  ]
}
```

### Explanation
Возвращает все answer keys для Test 1 (10 штук), отсортированные по номеру вопроса. Первый ключ сохраняется как `{{answerKey1_1}}` для обновления в PHASE 4.

---

## Step 3.6 - Get Grade Thresholds for Test 1

### API Address
```
GET http://localhost:8080/api/tests/{{test1Id}}/grade-thresholds
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Grade thresholds retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "testId": "{{test1Id}}",
      "gradeName": "Неудовлетворительно",
      "gradeSymbol": "2",
      "minPercentage": 0,
      "maxPercentage": 50
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "gradeName": "Удовлетворительно",
      "gradeSymbol": "3",
      "minPercentage": 51,
      "maxPercentage": 70
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440002",
      "gradeName": "Хорошо",
      "gradeSymbol": "4",
      "minPercentage": 71,
      "maxPercentage": 90
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "gradeName": "Отлично",
      "gradeSymbol": "5",
      "minPercentage": 91,
      "maxPercentage": 100
    }
  ]
}
```

### Explanation
Возвращает 4 дефолтных порога оценок для Test 1, отсортированные по minPercentage (от 0 до 91). Первый порог (ID) сохраняется как `{{gradeThreshold1_1}}` для обновления в PHASE 4.

---

# PHASE 4: UPDATE ENDPOINTS

## Step 4.1 - Update Test 1

### API Address
```
PUT http://localhost:8080/api/tests/update-test/{{test1Id}}
```

### Headers
```
Content-Type: application/json
```

### Request JSON
```json
{
  "title": "Математика 5 класс - Контрольная работа (ОБНОВЛЕНА)",
  "subject": "Арифметика",
  "description": "Обновленное описание",
  "isActive": true
}
```

### Expected Result
```json
{
  "success": true,
  "message": "Test updated successfully",
  "statusCode": 200,
  "data": {
    "id": "{{test1Id}}",
    "title": "Математика 5 класс - Контрольная работа (ОБНОВЛЕНА)",
    "subject": "Арифметика",
    "description": "Обновленное описание",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "isActive": true
  }
}
```

### Explanation
Обновляет информацию о тесте. **ВАЖНО**: `totalQuestions` (10) и `maxScore` (100.0) НЕ изменились - это read-only поля. Обновляются только title, subject и description.

---

## Step 4.2 - Update Answer Key 1 from Test 1

### API Address
```
PUT http://localhost:8080/api/tests/{{test1Id}}/answer-keys/{{answerKey1_1}}
```

### Headers
```
Content-Type: application/json
```

### Request JSON
```json
{
  "correctAnswer": "ABCD",
  "maxPoints": 15.0,
  "toleranceLevel": 2
}
```

### Expected Result
```json
{
  "success": true,
  "message": "Answer key updated successfully",
  "statusCode": 200,
  "data": {
    "id": "{{answerKey1_1}}",
    "testId": "{{test1Id}}",
    "questionNumber": 1,
    "correctAnswer": "ABCD",
    "maxPoints": 15.0,
    "toleranceLevel": 2
  }
}
```

### Explanation
Обновляет первый answer key Test 1. Изменяет правильный ответ с "ABC" на "ABCD", увеличивает баллы с 10.0 до 15.0, и увеличивает toleranceLevel с 1 до 2.

---

## Step 4.3 - Update Grade Threshold for Test 1

### API Address
```
PUT http://localhost:8080/api/tests/{{test1Id}}/grade-thresholds/{{gradeThreshold1_1}}
```

### Headers
```
Content-Type: application/json
Authorization: Bearer {{jwtToken}}
```

### Request JSON
```json
{
  "minPercentage": 90,
  "maxPercentage": 100
}
```

### Expected Result
```json
{
  "success": true,
  "message": "Grade threshold updated successfully",
  "statusCode": 200,
  "data": {
    "id": "{{gradeThreshold1_1}}",
    "testId": "{{test1Id}}",
    "gradeName": "Неудовлетворительно",
    "gradeSymbol": "2",
    "minPercentage": 90,
    "maxPercentage": 100
  }
}
```

### Explanation
Обновляет первый порог оценки Test 1. Изменяет минимум с 0 на 90 процентов. Теперь для оценки "2" нужно набрать минимум 90%.

---

## Step 4.4 - Activate Test 2

### API Address
```
PUT http://localhost:8080/api/tests/{{test2Id}}/activate
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(No body for PUT request)
```

### Expected Result
```json
{
  "success": true,
  "message": "Test activated successfully",
  "statusCode": 200,
  "data": "Test with ID {{test2Id}} has been activated."
}
```

### Explanation
Активирует Test 2 (устанавливает isActive = true). Test 2 уже был активен, поэтому это не меняет состояние, но проверяет функциональность.

---

## Step 4.5 - Deactivate Test 2

### API Address
```
PUT http://localhost:8080/api/tests/{{test2Id}}/deactivate
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(No body for PUT request)
```

### Expected Result
```json
{
  "success": true,
  "message": "Test deactivated successfully",
  "statusCode": 200,
  "data": "Test with ID {{test2Id}} has been deactivated."
}
```

### Explanation
Деактивирует Test 2 (устанавливает isActive = false). После этого Test 2 не будет появляться в списке `GET /api/tests` (возвращаются только активные тесты). Но Test 2 всё ещё существует в БД.

---

# PHASE 5: DELETE ENDPOINTS

## Step 5.1 - Delete Answer Key 1 from Test 3

### API Address
```
DELETE http://localhost:8080/api/tests/{{test3Id}}/answer-keys/{{answerKey3_1}}
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(DELETE request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Answer key deleted successfully",
  "statusCode": 200,
  "data": "Answer key with ID {{answerKey3_1}} has been deleted."
}
```

### Explanation
Удаляет первый answer key (questionNumber: 1) из Test 3. После этого Test 3 будет иметь 4 ключа вместо 5.

---

## Step 5.2 - Delete Grade Threshold from Test 1

### API Address
```
DELETE http://localhost:8080/api/tests/{{test1Id}}/grade-thresholds/{{gradeThreshold1_1}}
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(DELETE request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Grade threshold deleted successfully",
  "statusCode": 200,
  "data": "Grade threshold with ID {{gradeThreshold1_1}} has been deleted."
}
```

### Explanation
Удаляет первый порог оценок из Test 1. После этого Test 1 будет иметь 3 порога вместо 4.

---

## Step 5.3 - Delete Test 2

### API Address
```
DELETE http://localhost:8080/api/tests/delete-test/{{test2Id}}
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(DELETE request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Test deleted successfully",
  "statusCode": 200,
  "data": "Test with ID {{test2Id}} has been deleted."
}
```

### Explanation
Удаляет Test 2 полностью. **CASCADE DELETE**: все связанные данные (5 answer keys, 4 grade thresholds) автоматически удаляются. Test 2 больше не существует в БД.

---

# PHASE 6: VERIFICATION

## Step 6.1 - Verify Only 3 Tests Remain

### API Address
```
GET http://localhost:8080/api/tests
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "All tests retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "{{test1Id}}",
      "title": "Математика 5 класс - Контрольная работа (ОБНОВЛЕНА)",
      ...
    },
    {
      "id": "{{test3Id}}",
      "title": "История 7 класс - Тест по Средневековью",
      ...
    },
    {
      "id": "{{test4Id}}",
      "title": "Физика 9 класс - Механика (Полная)",
      ...
    }
  ]
}
```

### Explanation
Проверяет, что в списке осталось только 3 теста. Test 2 был удалён в Step 5.3. **ВАЖНО**: Test 1 имеет обновлённое название с "(ОБНОВЛЕНА)".

---

## Step 6.2 - Verify Test 3 Has 4 Answer Keys

### API Address
```
GET http://localhost:8080/api/tests/{{test3Id}}/answer-keys
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Answer keys retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "questionNumber": 2,
      "correctAnswer": "1453",
      ...
    },
    {
      "questionNumber": 3,
      "correctAnswer": "800",
      ...
    },
    {
      "questionNumber": 4,
      "correctAnswer": "1348",
      ...
    },
    {
      "questionNumber": 5,
      "correctAnswer": "1492",
      ...
    }
  ]
}
```

### Explanation
Проверяет, что Test 3 имеет **4 answer key** (было 5, один был удалён в Step 5.1). Первый ключ (questionNumber: 1) больше не существует.

---

## Step 6.3 - Verify Test 1 Has 3 Grade Thresholds

### API Address
```
GET http://localhost:8080/api/tests/{{test1Id}}/grade-thresholds
```

### Headers
```
(No headers needed)
```

### Request JSON
```
(GET request - no body)
```

### Expected Result
```json
{
  "success": true,
  "message": "Grade thresholds retrieved successfully",
  "statusCode": 200,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440001",
      "gradeName": "Удовлетворительно",
      "gradeSymbol": "3",
      "minPercentage": 51,
      "maxPercentage": 70
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440002",
      "gradeName": "Хорошо",
      "gradeSymbol": "4",
      "minPercentage": 71,
      "maxPercentage": 90
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "gradeName": "Отлично",
      "gradeSymbol": "5",
      "minPercentage": 91,
      "maxPercentage": 100
    }
  ]
}
```

### Explanation
Проверяет, что Test 1 имеет **3 grade threshold** (было 4, один был удалён в Step 5.2). Порог для оценки "2" больше не существует. **ВАЖНО**: обновленный порог с minPercentage: 90 был удален (это был первый порог).

---

## 📊 ИТОГОВАЯ СТАТИСТИКА

### ВСЕ 17 ENDPOINTS ПРОТЕСТИРОВАНЫ:

**POST (создание):**
- ✅ POST /api/tests/create-test
- ✅ POST /api/tests/{testId}/answer-keys

**GET (получение):**
- ✅ GET /api/tests
- ✅ GET /api/tests/{testId}
- ✅ GET /api/tests/{testId}/details
- ✅ GET /api/tests/user/{userId}
- ✅ GET /api/tests/{testId}/answer-keys
- ✅ GET /api/tests/{testId}/grade-thresholds

**PUT (обновление):**
- ✅ PUT /api/tests/update-test/{testId}
- ✅ PUT /api/tests/{testId}/answer-keys/{keyId}
- ✅ PUT /api/tests/{testId}/grade-thresholds/{id}
- ✅ PUT /api/tests/{testId}/activate
- ✅ PUT /api/tests/{testId}/deactivate

**DELETE (удаление):**
- ✅ DELETE /api/tests/delete-test/{testId}
- ✅ DELETE /api/tests/{testId}/answer-keys/{keyId}
- ✅ DELETE /api/tests/{testId}/grade-thresholds/{id}

### CONSTRAINT VALIDATION:
- ✅ totalQuestions (1-32): Step 1.4 ошибка, Step 1.5 успех
- ✅ Answer Keys (макс 32): 10+5+5+32 = все успешны
- ✅ Grade Thresholds (4 дефолтных): созданы автоматически
- ✅ Cascade Delete: Test 2 удален со всеми связанными данными

---

## ✨ ГОТОВО!

Все 23 шага полностью документированы с примерами JSON и объяснениями! 🚀

