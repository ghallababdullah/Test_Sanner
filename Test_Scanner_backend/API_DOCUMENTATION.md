# API Documentation - Test Scanner Backend

**Версия:** v1.0  
**Дата:** 2026-02-14  
**Базовый URL:** `http://localhost:8080`

---

## Содержание
1. [Authentication Module](#authentication-module)
2. [Test Module](#test-module)
3. [Scan Module](#scan-module)
4. [Grading Module](#grading-module)

---

## Authentication Module

### Endpoint: Register (Регистрация)
**POST** `/api/auth/register`

**Описание:** Создание нового пользователя в системе

**Требуется авторизация:** ❌ Нет

**Request Body:**
```json
{
  "firstName": "string",           // Required
  "middleName": "string",          // Optional
  "lastName": "string",            // Optional
  "phoneNumber": "string",         // Optional
  "email": "user@example.com",     // Required, must be valid email
  "password": "password123",       // Required, min 8 chars
  "roles": ["USER"]                // Optional, default ["USER"]
}
```

**Успешный ответ (201 Created):**
```json
{
  "success": true,
  "message": "Пользователь успешно зарегистрирован. Проверьте вашу почту для подтверждения",
  "statusCode": 201,
  "data": null
}
```

**Возможные ошибки:**
- 400: Email уже существует
- 400: Некорректный формат email
- 400: Пароль не соответствует требованиям

---

### Endpoint: Login (Вход)
**POST** `/api/auth/login`

**Описание:** Аутентификация пользователя и получение токенов

**Требуется авторизация:** ❌ Нет

**Request Body:**
```json
{
  "email": "user@example.com",     // Required
  "password": "password123"        // Required
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Вход выполнен успешно",
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Петров"
  }
}
```

**Возможные ошибки:**
- 401: Email не найден
- 401: Некорректный пароль
- 403: Email не подтверждён

---

### Endpoint: Verify Email (Подтверждение Email)
**GET** `/api/auth/verify-email`

**Описание:** Подтверждение email адреса по токену из письма

**Требуется авторизация:** ❌ Нет

**Query Parameters:**
- `token` (string, required) - Токен верификации из письма

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Email успешно подтверждён",
  "statusCode": 200,
  "data": null
}
```

**Возможные ошибки:**
- 400: Токен истёк
- 400: Токен недействителен

---

### Endpoint: Refresh Token (Обновление токена)
**POST** `/api/auth/refresh-token`

**Описание:** Получение новой пары токенов используя refresh token

**Требуется авторизация:** ❌ Нет

**Query Parameters:**
- `refreshToken` (string, required) - Refresh токен

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Токены успешно обновлены",
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Петров"
  }
}
```

**Возможные ошибки:**
- 401: Refresh токен истёк
- 401: Refresh токен недействителен

---

### Endpoint: Forget Password (Восстановление пароля)
**POST** `/api/auth/forget-password`

**Описание:** Отправка письма для восстановления пароля

**Требуется авторизация:** ❌ Нет

**Query Parameters:**
- `email` (string, required) - Email пользователя

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Письмо для восстановления пароля отправлено на ваш email",
  "statusCode": 200,
  "data": null
}
```

**Возможные ошибки:**
- 404: Email не найден в системе

---

### Endpoint: Reset Password (Сброс пароля)
**POST** `/api/auth/reset-password`

**Описание:** Сброс пароля используя токен из письма

**Требуется авторизация:** ❌ Нет

**Query Parameters:**
- `token` (string, required) - Токен сброса пароля из письма

**Request Body:**
```json
{
  "newPassword": "newPassword123",      // Required, min 8 chars
  "confirmPassword": "newPassword123"   // Required, must match newPassword
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Пароль успешно изменён",
  "statusCode": 200,
  "data": null
}
```

**Возможные ошибки:**
- 400: Токен истёг
- 400: Пароли не совпадают
- 400: Новый пароль не соответствует требованиям

---

## Test Module

### Endpoint: Create Test (Создать тест)
**POST** `/api/tests/create-test`

**Описание:** Создание нового теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Request Body:**
```json
{
  "title": "Математика 5 класс",           // Required
  "subject": "Математика",                 // Optional
  "classLevel": "5А",                      // Optional - для какого класса этот тест
  "description": "Контрольная работа",     // Optional
  "totalQuestions": 10,                    // Required, 1-32
  "maxScore": 100.0                        // Required, > 0
}
```

**Успешный ответ (201 Created):**
```json
{
  "success": true,
  "message": "Тест успешно создан",
  "statusCode": 201,
  "data": {
    "id": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "title": "Математика 5 класс",
    "subject": "Математика",
    "classLevel": "5А",
    "description": "Контрольная работа",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "isActive": true,
    "creatorId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
    "creatorEmail": "teacher@example.com",
    "createdAt": "2026-02-14T10:00:00",
    "updatedAt": "2026-02-14T10:00:00",
    "version": 1
  }
}
```

**Возможные ошибки:**
- 401: Не авторизован
- 400: Некорректные данные

---

### Endpoint: Update Test (Обновить тест)
**PUT** `/api/tests/update-test/{testId}`

**Описание:** Обновление информации о тесте

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Request Body:**
```json
{
  "title": "Новое название",           // Optional
  "subject": "Новый предмет",          // Optional
  "description": "Новое описание",     // Optional
  "isActive": true                     // Optional
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Тест успешно обновлён",
  "statusCode": 200,
  "data": {
    "id": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "title": "Новое название",
    ...
  }
}
```

---

### Endpoint: Delete Test (Удалить тест)
**DELETE** `/api/tests/delete-test/{testId}`

**Описание:** Удаление теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Тест успешно удалён",
  "statusCode": 200,
  "data": null
}
```

**Возможные ошибки:**
- 404: Тест не найден
- 403: У вас нет прав удалить этот тест

---

### Endpoint: Get Test by ID (Получить тест по ID)
**GET** `/api/tests/{testId}`

**Описание:** Получение информации о конкретном тесте

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Тест успешно получен",
  "statusCode": 200,
  "data": {
    "id": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "title": "Математика 5 класс",
    "subject": "Математика",
    "classLevel": "5А",
    "description": "Контрольная работа",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "isActive": true,
    "creatorId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
    "creatorEmail": "teacher@example.com",
    "createdAt": "2026-02-14T10:00:00",
    "updatedAt": "2026-02-14T10:00:00",
    "version": 1
  }
}
```

---

### Endpoint: Get Test with Details (Получить тест со всеми деталями)
**GET** `/api/tests/{testId}/details`

**Описание:** Получение теста со всеми ключами ответов и порогами оценок

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Тест с деталями успешно получен",
  "statusCode": 200,
  "data": {
    "id": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "title": "Математика 5 класс",
    "subject": "Математика",
    "description": "Контрольная работа",
    "totalQuestions": 10,
    "maxScore": 100.0,
    "isActive": true,
    "creatorId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
    "createdAt": "2026-02-14T10:00:00",
    "answerKeys": [
      {
        "id": "key-id-1",
        "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
        "questionNumber": 1,
        "correctAnswer": "ABC",
        "maxPoints": 10.0,
        "toleranceLevel": 1,
        "answerType": "TEXT",
        "createdAt": "2026-02-14T10:00:00",
        "updatedAt": "2026-02-14T10:00:00",
        "version": 1
      }
    ],
    "gradeThresholds": [
      {
        "id": "threshold-id-1",
        "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
        "gradeName": "Отлично",
        "gradeSymbol": "5",
        "minPercentage": 91,
        "maxPercentage": 100,
        "createdAt": "2026-02-14T10:00:00",
        "updatedAt": "2026-02-14T10:00:00",
        "version": 1
      }
    ]
  }
}
```

---

### Endpoint: Get All Tests (Получить все тесты пользователя)
**GET** `/api/tests`

**Описание:** Получение всех тестов, созданных текущим пользователем

**Требуется авторизация:** ✅ Да (Bearer Token)

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Тесты успешно получены",
  "statusCode": 200,
  "data": [
    {
      "id": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "title": "Математика 5 класс",
      "subject": "Математика",
      "classLevel": "5А",
      "description": "Контрольная работа",
      "totalQuestions": 10,
      "maxScore": 100.0,
      "isActive": true,
      "creatorId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
      "creatorEmail": "teacher@example.com",
      "createdAt": "2026-02-14T10:00:00",
      "updatedAt": "2026-02-14T10:00:00",
      "version": 1
    }
  ]
}
```

---

### Endpoint: Activate Test (Активировать тест)
**PUT** `/api/tests/{testId}/activate`

**Описание:** Активирование теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Тест успешно активирован",
  "statusCode": 200,
  "data": "Тест активен"
}
```

---

### Endpoint: Deactivate Test (Деактивировать тест)
**PUT** `/api/tests/{testId}/deactivate`

**Описание:** Деактивирование теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Тест успешно деактивирован",
  "statusCode": 200,
  "data": "Тест неактивен"
}
```

---

## Answer Key Module

### Endpoint: Create Answer Key (Создать ключ ответа)
**POST** `/api/tests/{testId}/answer-keys`

**Описание:** Создание ключа ответа для конкретного вопроса теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Request Body:**
```json
{
  "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",  // Required
  "questionNumber": 1,                                // Required, 1-32
  "correctAnswer": "ABC",                            // Required
  "maxPoints": 10.0,                                 // Optional, default 1.0
  "toleranceLevel": 1,                               // Optional, default 1
  "answerType": "TEXT"                               // Optional, default TEXT
}
```

**Успешный ответ (201 Created):**
```json
{
  "success": true,
  "message": "Ключ ответа успешно создан",
  "statusCode": 201,
  "data": {
    "id": "key-id-1",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "questionNumber": 1,
    "correctAnswer": "ABC",
    "maxPoints": 10.0,
    "toleranceLevel": 1,
    "answerType": "TEXT",
    "createdAt": "2026-02-14T10:00:00",
    "updatedAt": "2026-02-14T10:00:00",
    "version": 1
  }
}
```

---

### Endpoint: Get Answer Keys (Получить все ключи для теста)
**GET** `/api/tests/{testId}/answer-keys`

**Описание:** Получение всех ключей ответов для конкретного теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Ключи ответов успешно получены",
  "statusCode": 200,
  "data": [
    {
      "id": "key-id-1",
      "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "questionNumber": 1,
      "correctAnswer": "ABC",
      "maxPoints": 10.0,
      "toleranceLevel": 1,
      "answerType": "TEXT",
      "createdAt": "2026-02-14T10:00:00",
      "updatedAt": "2026-02-14T10:00:00",
      "version": 1
    }
  ]
}
```

---

### Endpoint: Update Answer Key (Обновить ключ ответа)
**PUT** `/api/tests/{testId}/answer-keys/{keyId}`

**Описание:** Обновление ключа ответа

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста
- `keyId` (UUID) - ID ключа

**Request Body:**
```json
{
  "correctAnswer": "ABC",     // Optional
  "maxPoints": 10.0,          // Optional
  "toleranceLevel": 1         // Optional
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Ключ ответа успешно обновлен",
  "statusCode": 200,
  "data": {
    "id": "key-id-1",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "questionNumber": 1,
    "correctAnswer": "ABC",
    "maxPoints": 10.0,
    "toleranceLevel": 1,
    "answerType": "TEXT",
    "createdAt": "2026-02-14T10:00:00",
    "updatedAt": "2026-02-14T10:00:00",
    "version": 2
  }
}
```

---

### Endpoint: Delete Answer Key (Удалить ключ ответа)
**DELETE** `/api/tests/{testId}/answer-keys/{keyId}`

**Описание:** Удаление ключа ответа

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста
- `keyId` (UUID) - ID ключа

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Ключ ответа успешно удален",
  "statusCode": 200,
  "data": null
}
```

---

## Grade Threshold Module

### Endpoint: Create Grade Thresholds (Создать пороги оценок)
**POST** `/api/tests/{testId}/grade-thresholds`

**Описание:** Создание порогов оценок для теста (несколько за раз, заменяет старые)

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Request Body (МАССИВ):**
```json
[
  {
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "gradeName": "Отлично",
    "gradeSymbol": "5",
    "minPercentage": 91,
    "maxPercentage": 100
  },
  {
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "gradeName": "Хорошо",
    "gradeSymbol": "4",
    "minPercentage": 71,
    "maxPercentage": 90
  },
  {
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "gradeName": "Удовлетворительно",
    "gradeSymbol": "3",
    "minPercentage": 51,
    "maxPercentage": 70
  },
  {
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "gradeName": "Неудовлетворительно",
    "gradeSymbol": "2",
    "minPercentage": 0,
    "maxPercentage": 50
  }
]
```

**Успешный ответ (201 Created):**
```json
{
  "success": true,
  "message": "Пороги оценок успешно созданы",
  "statusCode": 201,
  "data": [
    {
      "id": "threshold-id-1",
      "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "gradeName": "Отлично",
      "gradeSymbol": "5",
      "minPercentage": 91,
      "maxPercentage": 100,
      "createdAt": "2026-02-14T10:00:00",
      "updatedAt": "2026-02-14T10:00:00",
      "version": 1
    }
  ]
}
```

---

### Endpoint: Create Single Grade Threshold (Создать один порог)
**POST** `/api/tests/{testId}/grade-thresholds/single`

**Описание:** Создание одного порога оценки (не удаляет существующие)

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Request Body:**
```json
{
  "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
  "gradeName": "Отлично",
  "gradeSymbol": "5",
  "minPercentage": 91,
  "maxPercentage": 100
}
```

**Успешный ответ (201 Created):**
```json
{
  "success": true,
  "message": "Порог оценки успешно создан",
  "statusCode": 201,
  "data": {
    "id": "threshold-id-1",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "gradeName": "Отлично",
    "gradeSymbol": "5",
    "minPercentage": 91,
    "maxPercentage": 100,
    "createdAt": "2026-02-14T10:00:00",
    "updatedAt": "2026-02-14T10:00:00",
    "version": 1
  }
}
```

---

### Endpoint: Get Grade Thresholds (Получить пороги оценок)
**GET** `/api/tests/{testId}/grade-thresholds`

**Описание:** Получение всех порогов оценок для теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Пороги оценок успешно получены",
  "statusCode": 200,
  "data": [
    {
      "id": "threshold-id-1",
      "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "gradeName": "Отлично",
      "gradeSymbol": "5",
      "minPercentage": 91,
      "maxPercentage": 100,
      "createdAt": "2026-02-14T10:00:00",
      "updatedAt": "2026-02-14T10:00:00",
      "version": 1
    }
  ]
}
```

---

### Endpoint: Update Grade Threshold (Обновить порог оценки)
**PUT** `/api/tests/{testId}/grade-thresholds/{thresholdId}`

**Описание:** Обновление порога оценки

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста
- `thresholdId` (UUID) - ID порога

**Request Body:**
```json
{
  "minPercentage": 91,    // Optional
  "maxPercentage": 100    // Optional
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Порог оценки успешно обновлен",
  "statusCode": 200,
  "data": {
    "id": "threshold-id-1",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "gradeName": "Отлично",
    "gradeSymbol": "5",
    "minPercentage": 91,
    "maxPercentage": 100,
    "createdAt": "2026-02-14T10:00:00",
    "updatedAt": "2026-02-14T10:00:00",
    "version": 2
  }
}
```

---

### Endpoint: Delete Grade Threshold (Удалить порог оценки)
**DELETE** `/api/tests/{testId}/grade-thresholds/{thresholdId}`

**Описание:** Удаление порога оценки

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста
- `thresholdId` (UUID) - ID порога

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Порог оценки успешно удален",
  "statusCode": 200,
  "data": null
}
```

---

## Scan Module

### Endpoint: Start Scan Session (Начать сеанс сканирования)
**POST** `/api/scan/start-session`

**Описание:** Создание нового сеанса сканирования

**Требуется авторизация:** ✅ Да (Bearer Token)

**Request Body:**
```json
{
  "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",  // Required
  "name": "Сеанс сканирования класс 10A",            // Optional
  "description": "Сканирование контрольной работы", // Optional
  "deviceId": "iphone-teacher-001",                 // Optional
  "deviceModel": "iPhone 14 Pro Max",                // Optional
  "metadata": {                                      // Optional
    "ocrLibrary": "TensorFlow",
    "ocrVersion": "2.1.0",
    "appVersion": "1.0.0",
    "phoneOS": "iOS 16.2"
  }
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Сеанс сканирования успешно создан",
  "statusCode": 200,
  "data": {
    "id": "1e4417ec-5d83-4da1-8f2e-5a24e8d24d84",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "userId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
    "name": "Сеанс сканирования класс 10A",
    "description": "Сканирование контрольной работы",
    "deviceId": "iphone-teacher-001",
    "deviceModel": "iPhone 14 Pro Max",
    "totalBlanks": 0,
    "startedAt": "2026-02-14T10:00:00",
    "metadata": {
      "ocrLibrary": "TensorFlow",
      "ocrVersion": "2.1.0",
      "appVersion": "1.0.0",
      "phoneOS": "iOS 16.2"
    },
    "createdAt": "2026-02-14T10:00:00"
  }
}
```

---

### Endpoint: Submit Scanned Blank (Отправить отсканированный бланк)
**POST** `/api/scan/submit-blank`

**Описание:** Отправка отсканированного бланка с извлеченными данными OCR

**Требуется авторизация:** ✅ Да (Bearer Token)

**Request Body:**
```json
{
  "scanSessionId": "1e4417ec-5d83-4da1-8f2e-5a24e8d24d84",  // Required
  "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",        // Required
  "studentName": "Иван",                                    // Required
  "studentLastName": "Петров",                              // Optional
  "studentClass": "10A",                                    // Optional
  "testDate": "2026-02-14",                                 // Optional
  "answers": {                                              // Required
    "1": "ABC",
    "2": "124",
    "3": "НЕВЕРНО",
    "4": "В",
    "5": "45",
    "6": "нет",
    "7": "косинусоида",
    "8": "8",
    "9": "2",
    "10": "пересекающиеся"
  },
  "overallConfidence": 0.87,                               // Optional
  "errorCorrections": null,                                // Optional - исправления ошибок
  "isErrorCorrectionApplied": false                         // Optional
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Бланк успешно отправлен на сервер",
  "statusCode": 200,
  "data": {
    "id": "df560f56-ec1c-41cc-b31d-722107b0d8a1",
    "scanSessionId": "1e4417ec-5d83-4da1-8f2e-5a24e8d24d84",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "studentName": "Иван",
    "studentLastName": "Петров",
    "studentClass": "10A",
    "testDate": "2026-02-14",
    "overallConfidence": 0.87,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {
      "1": "ABC",
      "2": "124",
      ...
    },
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-14T10:00:00",
    "reviewedAt": null
  }
}
```

---

### Endpoint: Get Scanned Blanks by Test (Получить все бланки для теста)
**GET** `/api/scan/test/{testId}/blanks`

**Описание:** Получение всех отсканированных бланков для конкретного теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Бланки успешно получены",
  "statusCode": 200,
  "data": [
    {
      "id": "df560f56-ec1c-41cc-b31d-722107b0d8a1",
      "scanSessionId": "1e4417ec-5d83-4da1-8f2e-5a24e8d24d84",
      "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "studentName": "Иван",
      "studentLastName": "Петров",
      "studentClass": "10A",
      "testDate": "2026-02-14",
      "overallConfidence": 0.87,
      "needsReview": false,
      "reviewStatus": "PENDING",
      "answers": {...},
      "errorCorrections": null,
      "isErrorCorrectionApplied": false,
      "scannedAt": "2026-02-14T10:00:00",
      "reviewedAt": null
    }
  ]
}
```

---

### Endpoint: Get Scanned Blanks by Session (Получить бланки по сеансу)
**GET** `/api/scan/session/{sessionId}/blanks`

**Описание:** Получение всех бланков для конкретного сеанса сканирования

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `sessionId` (UUID) - ID сеанса сканирования

**Успешный ответ (200 OK):** (см. выше)

---

### Endpoint: Get Scanned Blank by ID (Получить конкретный бланк)
**GET** `/api/scan/blank/{blankId}`

**Описание:** Получение информации о конкретном отсканированном бланке

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `blankId` (UUID) - ID бланка

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Бланк успешно получен",
  "statusCode": 200,
  "data": {
    "id": "df560f56-ec1c-41cc-b31d-722107b0d8a1",
    "scanSessionId": "1e4417ec-5d83-4da1-8f2e-5a24e8d24d84",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "studentName": "Иван",
    "studentLastName": "Петров",
    "studentClass": "10A",
    "testDate": "2026-02-14",
    "overallConfidence": 0.87,
    "needsReview": false,
    "reviewStatus": "PENDING",
    "answers": {...},
    "errorCorrections": null,
    "isErrorCorrectionApplied": false,
    "scannedAt": "2026-02-14T10:00:00",
    "reviewedAt": null
  }
}
```

---

### Endpoint: Mark for Review (Отметить на проверку)
**PUT** `/api/scan/blank/{blankId}/mark-review`

**Описание:** Отметить бланк для ручной проверки

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `blankId` (UUID) - ID бланка

**Query Parameters:**
- `reviewNotes` (string, optional) - Заметки о проверке

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Бланк отмечен для проверки",
  "statusCode": 200,
  "data": {
    "id": "df560f56-ec1c-41cc-b31d-722107b0d8a1",
    "needsReview": true,
    "reviewStatus": "PENDING",
    ...
  }
}
```

---

### Endpoint: Apply Error Corrections (Применить исправления ошибок)
**PUT** `/api/scan/blank/{blankId}/apply-corrections`

**Описание:** Применить исправления ошибок к отсканированным ответам

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `blankId` (UUID) - ID бланка

**Request Body:**
```json
{
  "errorCorrections": {
    "2": "134",      // Вопрос 2: исправленный ответ
    "5": "43"        // Вопрос 5: исправленный ответ
  }
}
```

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Исправления успешно применены",
  "statusCode": 200,
  "data": {
    "id": "df560f56-ec1c-41cc-b31d-722107b0d8a1",
    "answers": {
      "1": "ABC",
      "2": "134",    // ← обновлено
      "3": "НЕВЕРНО",
      "4": "В",
      "5": "43",     // ← обновлено
      ...
    },
    "isErrorCorrectionApplied": true,
    ...
  }
}
```

---

## Grading Module

### Endpoint: Evaluate Test (Оценить тест)
**POST** `/api/grading/evaluate`

**Описание:** Оценить ответы студента и выставить оценку

**Требуется авторизация:** ✅ Да (Bearer Token)

**Request Body:**
```json
{
  "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",  // Required
  "userId": "31f0ef4f-a56f-4616-979c-39b5f913393b",  // Required (ID того, кто сканировал)
  "studentName": "Иван",                              // Optional
  "studentLastName": "Петров",                        // Optional
  "studentClass": "10A",                              // Optional
  "answers": [                                         // Required
    {
      "questionNumber": 1,
      "answer": "ABC"
    },
    {
      "questionNumber": 2,
      "answer": "124"
    }
  ]
}
```

**Успешный ответ (201 Created):**
```json
{
  "success": true,
  "message": "Тест успешно оценен",
  "statusCode": 201,
  "data": {
    "gradingResultId": "grade-result-id-1",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "userId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
    "studentName": "Иван",
    "studentLastName": "Петров",
    "studentClass": "10A",
    "testClass": "10A",
    "classMatchesStudent": true,
    "rawScore": 85.0,
    "maxScore": 100.0,
    "percentage": 85.0,
    "grade": "4",
    "feedback": "Хорошая работа! Исправьте ошибки в вопросах 3 и 7",
    "answerDetails": [
      {
        "questionNumber": 1,
        "studentAnswer": "ABC",
        "correctAnswer": "ABC",
        "pointsEarned": 10.0,
        "maxPoints": 10.0,
        "distance": 0,
        "isCorrect": true,
        "matchType": "EXACT"
      },
      {
        "questionNumber": 2,
        "studentAnswer": "124",
        "correctAnswer": "123",
        "pointsEarned": 9.0,
        "maxPoints": 10.0,
        "distance": 1,
        "isCorrect": false,
        "matchType": "TOLERANCE_1"
      }
    ]
  }
}
```

---

### Endpoint: Get Results by Test (Получить результаты по тесту)
**GET** `/api/grading/results/{testId}`

**Описание:** Получение всех результатов оценки для конкретного теста

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `testId` (UUID) - ID теста

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Результаты успешно получены",
  "statusCode": 200,
  "data": [
    {
      "gradingResultId": "grade-result-id-1",
      "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
      "userId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
      "studentName": "Иван",
      "studentLastName": "Петров",
      "studentClass": "10A",
      "testClass": "10A",
      "classMatchesStudent": true,
      "rawScore": 85.0,
      "maxScore": 100.0,
      "percentage": 85.0,
      "grade": "4",
      "feedback": "Хорошая работа!",
      "answerDetails": [...]
    }
  ]
}
```

---

### Endpoint: Get Results by User (Получить результаты пользователя)
**GET** `/api/grading/results/user/{userId}`

**Описание:** Получение всех результатов оценки для конкретного пользователя

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `userId` (UUID) - ID пользователя

**Успешный ответ (200 OK):** (см. выше)

---

### Endpoint: Get Grading Result Details (Получить детали результата)
**GET** `/api/grading/results/{gradingResultId}/details`

**Описание:** Получение полной информации о результате оценки со всеми деталями ответов

**Требуется авторизация:** ✅ Да (Bearer Token)

**Path Parameters:**
- `gradingResultId` (UUID) - ID результата оценки

**Успешный ответ (200 OK):**
```json
{
  "success": true,
  "message": "Детали результата успешно получены",
  "statusCode": 200,
  "data": {
    "gradingResultId": "grade-result-id-1",
    "testId": "a49d44a0-d6cf-4cff-92d4-cf4763eab12e",
    "userId": "31f0ef4f-a56f-4616-979c-39b5f913393b",
    "studentName": "Иван",
    "studentLastName": "Петров",
    "studentClass": "10A",
    "testClass": "10A",
    "classMatchesStudent": true,
    "rawScore": 85.0,
    "maxScore": 100.0,
    "percentage": 85.0,
    "grade": "4",
    "feedback": "Хорошая работа! Исправьте ошибки в вопросах 3 и 7",
    "answerDetails": [
      {
        "questionNumber": 1,
        "studentAnswer": "ABC",
        "correctAnswer": "ABC",
        "pointsEarned": 10.0,
        "maxPoints": 10.0,
        "distance": 0,
        "isCorrect": true,
        "matchType": "EXACT"
      },
      {
        "questionNumber": 2,
        "studentAnswer": "124",
        "correctAnswer": "123",
        "pointsEarned": 9.0,
        "maxPoints": 10.0,
        "distance": 1,
        "isCorrect": false,
        "matchType": "TOLERANCE_1"
      },
      {
        "questionNumber": 3,
        "studentAnswer": "НЕВЕРНО",
        "correctAnswer": "ПРЯМАЯ",
        "pointsEarned": 0.0,
        "maxPoints": 10.0,
        "distance": 7,
        "isCorrect": false,
        "matchType": "NO_MATCH"
      }
    ]
  }
}
```

---

## Error Handling

Все endpoints используют единый формат ошибок:

**Error Response Format:**
```json
{
  "success": false,
  "message": "Описание ошибки",
  "statusCode": 400,
  "data": null
}
```

### Common HTTP Status Codes:
- **200 OK** - Успешный запрос
- **201 Created** - Ресурс успешно создан
- **400 Bad Request** - Некорректные данные
- **401 Unauthorized** - Не авторизован (нет токена или токен истёк)
- **403 Forbidden** - Нет прав доступа
- **404 Not Found** - Ресурс не найден
- **500 Internal Server Error** - Ошибка сервера

---

## Authentication

Все endpoints (кромеAuth) требуют Bearer Token в header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

## Important Notes

1. **UUID Format**: Все ID параметры ожидаются в формате UUID
2. **Dates**: Используется формат ISO 8601 (YYYY-MM-DD и YYYY-MM-DDTHH:mm:ss)
3. **Decimals**: Используется BigDecimal для денежных значений
4. **JSON Serialization**: Object поля в requests/responses автоматически сериализуются в JSON
5. **Validation**: Все обязательные поля проверяются на backend'е


