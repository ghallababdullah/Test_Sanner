# 🚀 ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ AUTH CONTROLLER В POSTMAN

---

## ✅ СТАТУС: ПРИЛОЖЕНИЕ 100% ГОТОВО К ТЕСТИРОВАНИЮ

Все проверено и готово:
- ✅ PostgreSQL конфигурация
- ✅ JWT конфигурация
- ✅ Email (Mailtrap) конфигурация
- ✅ Entity, DTO, Service, Controller готовы
- ✅ Dependency Injection настроена
- ✅ Компиляция без ошибок
- ✅ Database миграции готовы

---

## 🎯 БЫСТРЫЙ СТАРТ

### Шаг 1: Запустить приложение

```bash
cd "C:\Users\Abdullah\Desktop\Test_Sanner\Test_Scanner_backend"
./gradlew bootRun
```

Ожидайте вывода:
```
Started TestScannerBackendApplication in X.XXX seconds
Tomcat started on port(s): 8080 with context path: ''
```

### Шаг 2: Открыть Postman

- Скачайте и установите Postman (если нет): https://www.postman.com/downloads/
- Откройте Postman

### Шаг 3: Импортировать Collection

**Способ 1 (РЕКОМЕНДУЕТСЯ):**
1. В Postman нажмите "Import" (левый верхний угол)
2. Выберите файл: `Auth_Controller_Postman_Collection.json`
3. Коллекция импортируется со всеми тестами

**Способ 2 (РУЧНОЙ):**
1. Создайте новую коллекцию "Auth Controller Tests"
2. Создайте новую переменную среду (Environment)
3. Введите переменные (см. ниже)
4. Следуйте шагам в файле `AUTH_CONTROLLER_POSTMAN_TEST_CASES.md`

### Шаг 4: Настроить переменные

Нажмите на иконку "Environment" (справа сверху) → "Manage Environments" → "New"

Создайте переменную среду с данными:

```
VARIABLE NAME          | INITIAL VALUE
─────────────────────────────────────────────────
base_url               | http://localhost:8080
email                  | john.doe@test.com
password               | SecurePassword123
firstName              | John
lastName               | Doe
middleName             | Michael
phoneNumber            | +1-234-567-8900
accessToken            | (оставить пусто)
refreshToken           | (оставить пусто)
```

Нажмите "Save"

---

## 📋 ПОЛНЫЙ ТЕСТОВЫЙ СЦЕНАРИЙ

### ПЕРВЫЙ ПРОХОД (Позитивные тесты - новый пользователь):

#### 1️⃣ Register (Регистрация)

```
Метод: POST
URL: http://localhost:8080/api/auth/register

BODY (JSON):
{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "email": "john.doe@test.com",
  "password": "SecurePassword123",
  "phoneNumber": "+1-234-567-8900"
}

ОЖИДАЕМЫЙ КОД: 201 Created
ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify.",
  "data": "Registration successful"
}

✅ ПРОВЕРИТЬ В БД:
SELECT * FROM users WHERE email = 'john.doe@test.com';
- verified должен быть FALSE
- active должен быть TRUE
- roles должны быть ['USER']
```

#### 2️⃣ Login (Вход)

```
Метод: POST
URL: http://localhost:8080/api/auth/login

BODY (JSON):
{
  "email": "john.doe@test.com",
  "password": "SecurePassword123"
}

ОЖИДАЕМЫЙ КОД: 200 OK
ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "email": "john.doe@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "message": "Login successful"
  }
}

⚠️ ВАЖНО:
1. Скопируйте accessToken
2. Скопируйте refreshToken
3. В Postman: выберите Environment → обновите {{accessToken}} и {{refreshToken}}
```

#### 3️⃣ Verify Email (Проверка email)

```
Метод: GET
URL: http://localhost:8080/api/auth/verify-email

QUERY PARAM:
token = (email verification token)

⚠️ КАК ПОЛУЧИТЬ ТОКЕН:
Способ 1 (ЛУЧШЕ):
1. Откройте https://mailtrap.io
2. Зайдите в ваш аккаунт (username: 7574b621c1f8bf)
3. Найдите письмо с subject "Подтверждение электронной почты"
4. В письме найдите URL типа:
   http://localhost:8080/api/auth/verify-email?token=eyJ...
5. Скопируйте token

Способ 2:
1. В консоли приложения найдите логи
2. Ищите строку: "http://localhost:8080/api/auth/verify-email?token="
3. Скопируйте полный URL

ПОЛНЫЙ ПРИМЕР URL:
http://localhost:8080/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLmRvZUB0ZXN0LmNvbSIsInR5cGUiOiJFTUFJTF9WRVJJRklDQVRJT04iLCJpYXQiOjE3MzY3NTY3MjMsImV4cCI6MTczNjg0MzEyM30.abc123...

ОЖИДАЕМЫЙ КОД: 200 OK
ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Email verified successfully",
  "data": "Your email has been verified. You can now log in."
}

✅ ПРОВЕРИТЬ В БД:
SELECT verified FROM users WHERE email = 'john.doe@test.com';
- verified должен быть TRUE теперь!
```

#### 4️⃣ Refresh Token (Обновление токена)

```
Метод: POST
URL: http://localhost:8080/api/auth/refresh-token

QUERY PARAM:
refreshToken = {{refreshToken}} (из login ответа)

ОЖИДАЕМЫЙ КОД: 200 OK
ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs... (НОВЫЙ!)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs... (НОВЫЙ!)",
    "email": "john.doe@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "message": "Token refreshed successfully"
  }
}

⚠️ ОБНОВИТЕ ПЕРЕМЕННЫЕ:
1. Скопируйте новый accessToken
2. Скопируйте новый refreshToken
3. Обновите {{accessToken}} и {{refreshToken}} в Environment
```

#### 5️⃣ Forget Password (Запрос сброса пароля)

```
Метод: POST
URL: http://localhost:8080/api/auth/forget-password

QUERY PARAM:
email = john.doe@test.com

ОЖИДАЕМЫЙ КОД: 200 OK
ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Password reset email sent. Please check your email.",
  "data": "Reset email sent"
}

⚠️ ПОЛУЧИТЬ RESET TOKEN:
1. Откройте https://mailtrap.io
2. Найдите письмо с subject "Сброс пароля"
3. В письме найдите URL типа:
   http://localhost:8080/api/auth/reset-password?token=eyJ...
4. Скопируйте token для следующего теста
```

#### 6️⃣ Reset Password (Сброс пароля)

```
Метод: POST
URL: http://localhost:8080/api/auth/reset-password

QUERY PARAM:
token = (password reset token из письма)

BODY (JSON):
{
  "newPassword": "NewSecurePassword456",
  "confirmPassword": "NewSecurePassword456"
}

ОЖИДАЕМЫЙ КОД: 200 OK
ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Password reset successfully",
  "data": "Your password has been reset. You can now log in with your new password."
}

✅ ПРОВЕРИТЬ:
Попробуйте LOGIN с НОВЫМ паролем:
Email: john.doe@test.com
Password: NewSecurePassword456

Должен пройти! ✅
```

---

### ВТОРОЙ ПРОХОД (Отрицательные тесты - ошибки):

#### ❌ Register - Email Already Exists
```
Email: john.doe@test.com (тот же)
Ожидаемый код: 400 Bad Request
Ожидаемое сообщение: "Email already exists"
```

#### ❌ Login - Wrong Password
```
Email: john.doe@test.com
Password: WrongPassword123
Ожидаемый код: 404 Not Found
Ожидаемое сообщение: "Invalid email or password"
```

#### ❌ Login - User Not Found
```
Email: nonexistent@test.com
Password: Password123
Ожидаемый код: 404 Not Found
Ожидаемое сообщение: "Invalid email or password"
```

#### ❌ Refresh Token - Invalid Token
```
refreshToken = invalid-token-12345
Ожидаемый код: 400 Bad Request
Ожидаемое сообщение: "Invalid or expired refresh token"
```

#### ❌ Reset Password - Passwords Don't Match
```
newPassword: NewPassword123
confirmPassword: DifferentPassword456
Ожидаемый код: 400 Bad Request
Ожидаемое сообщение: "Passwords do not match"
```

---

## 🔍 ПРОВЕРКА КОНСОЛИ ПРИЛОЖЕНИЯ

### Ожидаемые логи при успешной регистрации:
```
📝 Starting user registration for email: john.doe@test.com
✅ User registered successfully: [UUID]
✅ Verification email sent to: john.doe@test.com
```

### Ожидаемые логи при успешном входе:
```
🔐 User login attempt for email: john.doe@test.com
✅ User logged in successfully: [UUID]
```

### Ожидаемые логи при проверке email:
```
📧 Verifying email with token...
✅ Email verified successfully for user: john.doe@test.com
```

---

## 📊 ПРОВЕРКА РЕЗУЛЬТАТОВ

### Таблица результатов:

| Тест | Код | Success | Статус |
|------|-----|---------|---------|
| Register | 201 | true | ✅ |
| Login | 200 | true | ✅ |
| Verify Email | 200 | true | ✅ |
| Refresh Token | 200 | true | ✅ |
| Forget Password | 200 | true | ✅ |
| Reset Password | 200 | true | ✅ |

### Если какой-то тест не пройден:

```
❌ Проверьте:
1. Приложение запущено? (./gradlew bootRun)
2. PostgreSQL запущена? (pg_isready)
3. БД scanner_db существует?
4. Правильный email/password?
5. Токены скопированы правильно?
6. URL правильный?
7. BODY JSON корректен?
```

---

## 🔐 БЕЗОПАСНОСТЬ ПРИ ТЕСТИРОВАНИИ

⚠️ **ВАЖНО:**
- ❌ НЕ используйте реальные пароли
- ❌ НЕ коммитьте credentials в git
- ❌ НЕ делитесь токенами
- ✅ Используйте test@example.com для тестирования
- ✅ Используйте простые пароли (Password123)

---

## 📞 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ

### 1. Приложение не запускается?
```bash
./gradlew clean build
./gradlew bootRun
```

### 2. PostgreSQL error?
```bash
# Проверить что PostgreSQL запущена
pg_isready -h localhost -p 5432

# Если не запущена, запустить
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
```

### 3. Email не приходит?
- Проверьте Mailtrap: https://mailtrap.io
- Логин: 7574b621c1f8bf
- Пароль: c9d5b38ae805b0
- Проверьте spam folder

### 4. Token invalid?
- Скопируйте token правильно (без пробелов)
- Убедитесь что token не истек
- Создайте новый token (повторите register/forget-password)

### 5. Database error?
```sql
-- Проверить что таблица существует
SELECT * FROM users LIMIT 1;

-- Если нет, Spring создаст автоматически
-- Перезапустите приложение
```

---

## 📚 ДОКУМЕНТАЦИЯ

Если нужны детали, смотрите файлы:
- **AUTH_CONTROLLER_POSTMAN_TEST_CASES.md** - все тест-кейсы с деталями
- **READINESS_SCAN_REPORT.md** - статус готовности приложения
- **Entity_DTO_Repository_Explanation.md** - объяснение архитектуры

---

## ✅ ЗАКЛЮЧЕНИЕ

**Приложение 100% готово к тестированию!**

Следуйте инструкциям выше и все будет работать идеально! 🚀

**Начните с шага 1: Запустите приложение!**


