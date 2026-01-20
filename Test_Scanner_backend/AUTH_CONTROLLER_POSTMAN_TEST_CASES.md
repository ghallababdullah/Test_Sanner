# 🧪 ПОЛНЫЕ ТЕСТОВЫЕ СЛУЧАИ ДЛЯ POSTMAN

---

## 📌 ПРЕДВАРИТЕЛЬНЫЕ УСЛОВИЯ

### 1. Запустить приложение
```bash
./gradlew bootRun
```

### 2. Убедиться что PostgreSQL запущена
```bash
# Windows PowerShell
pg_isready -h localhost -p 5432
```

### 3. Убедиться что Mailtrap правильно настроен
- Проверьте username и password в application.yaml
- Логин в Mailtrap (https://mailtrap.io)

### 4. Настроить Postman переменные
```
{{base_url}} = http://localhost:8080
{{email}} = test@example.com (будет меняться)
{{password}} = Password123456
{{firstName}} = John
{{lastName}} = Doe
{{accessToken}} = (будет получена после login)
{{refreshToken}} = (будет получена после login)
{{resetToken}} = (будет получена после forget-password)
```

---

## 🧪 ТЕСТОВЫЙ СЦЕНАРИЙ (ПОЛНЫЙ ЦИКЛ)

---

## 1️⃣ REGISTER - Регистрация пользователя

### Тестовый Случай 1.1: Успешная регистрация

```
Название: Register - Valid User
Метод: POST
URL: {{base_url}}/api/auth/register
Content-Type: application/json

BODY (JSON):
{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "email": "john.doe@test.com",
  "password": "SecurePassword123",
  "phoneNumber": "+1-234-567-8900"
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 201 Created

ОЖИДАЕМЫЙ ОТВЕТ (JSON):
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify.",
  "data": "Registration successful"
}

ПРОВЕРИТЬ В БД:
SELECT * FROM users WHERE email = 'john.doe@test.com';

Ожидается:
- verified = false  (поначалу)
- active = true
- roles = ['USER']
```

### Тестовый Случай 1.2: Регистрация - Email уже существует

```
Название: Register - Email Already Exists
Метод: POST
URL: {{base_url}}/api/auth/register

BODY:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "john.doe@test.com",  ← ТОТ ЖЕ EMAIL
  "password": "Password123"
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ (JSON):
{
  "success": false,
  "message": "Email already exists"
}
```

### Тестовый Случай 1.3: Регистрация - Invalid Email

```
Название: Register - Invalid Email Format
Метод: POST
URL: {{base_url}}/api/auth/register

BODY:
{
  "firstName": "Test",
  "lastName": "User",
  "email": "invalid-email-format",  ← НЕПРАВИЛЬНЫЙ ФОРМАТ
  "password": "Password123"
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ (JSON):
{
  "success": false,
  "message": "Validation failed: Email should be valid"
}
```

### Тестовый Случай 1.4: Регистрация - Missing Required Fields

```
Название: Register - Missing First Name
Метод: POST
URL: {{base_url}}/api/auth/register

BODY:
{
  "lastName": "User",
  "email": "test@test.com",
  "password": "Password123"
  ← ОТСУТСТВУЕТ firstName
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ (JSON):
{
  "success": false,
  "message": "Validation failed: First name is required"
}
```

### Тестовый Случай 1.5: Регистрация - Short Password

```
Название: Register - Password Too Short
Метод: POST
URL: {{base_url}}/api/auth/register

BODY:
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@test.com",
  "password": "Short"  ← СЛИШКОМ КОРОТКИЙ (нужен минимум 8)
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "Validation failed: Password must be between 8 and 100 characters"
}
```

---

## 2️⃣ LOGIN - Вход в систему

### Тестовый Случай 2.1: Успешный вход

```
Название: Login - Valid Credentials
Метод: POST
URL: {{base_url}}/api/auth/login
Content-Type: application/json

BODY:
{
  "email": "john.doe@test.com",
  "password": "SecurePassword123"
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 200 OK

ОЖИДАЕМЫЙ ОТВЕТ (JSON):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "john.doe@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "message": "Login successful"
  }
}

⚠️ ВАЖНО:
Сохраните accessToken и refreshToken для следующих тестов!
В Postman используйте "Set as Variable":
- {{accessToken}} = data.accessToken
- {{refreshToken}} = data.refreshToken
```

### Тестовый Случай 2.2: Вход - Wrong Password

```
Название: Login - Wrong Password
Метод: POST
URL: {{base_url}}/api/auth/login

BODY:
{
  "email": "john.doe@test.com",
  "password": "WrongPassword123"  ← НЕПРАВИЛЬНЫЙ ПАРОЛЬ
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 404 Not Found

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Тестовый Случай 2.3: Вход - User Not Found

```
Название: Login - User Not Found
Метод: POST
URL: {{base_url}}/api/auth/login

BODY:
{
  "email": "nonexistent@test.com",  ← ПОЛЬЗОВАТЕЛЬ НЕ СУЩЕСТВУЕТ
  "password": "Password123"
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 404 Not Found

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 3️⃣ VERIFY EMAIL - Проверка email

### Тестовый Случай 3.1: Успешная проверка email

```
Название: Verify Email - Valid Token
Метод: GET
URL: {{base_url}}/api/auth/verify-email

QUERY PARAMS:
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (email verification token)

⚠️ ВАЖНО:
1. Из логов консоли найдите сгенерированный token
2. Или вызовите register снова и скопируйте URL из логов

Полный URL пример:
http://localhost:8080/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLmRvZUB0ZXN0LmNvbSIsInR5cGUiOiJFTUFJTF9WRVJJRklDQVRJT04iLCJpYXQiOjE3MzY3NTY3MjMsImV4cCI6MTczNjg0MzEyM30.abc123...

ОЖИДАЕМЫЙ КОД ОТВЕТА: 200 OK

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Email verified successfully",
  "data": "Your email has been verified. You can now log in."
}

ПРОВЕРИТЬ В БД:
SELECT email, verified FROM users WHERE email = 'john.doe@test.com';

Ожидается:
verified = true  ← ИЗМЕНИЛОСЬ!
```

### Тестовый Случай 3.2: Verify Email - Invalid Token

```
Название: Verify Email - Invalid Token
Метод: GET
URL: {{base_url}}/api/auth/verify-email?token=invalid-token-12345

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "Invalid or expired verification token: JWT signature does not match locally computed signature"
}
```

---

## 4️⃣ REFRESH TOKEN - Обновление access token

### Тестовый Случай 4.1: Успешное обновление токена

```
Название: Refresh Token - Valid Refresh Token
Метод: POST
URL: {{base_url}}/api/auth/refresh-token

QUERY PARAMS:
refreshToken={{refreshToken}}  (из login ответа)

Полный URL пример:
http://localhost:8080/api/auth/refresh-token?refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

ОЖИДАЕМЫЙ КОД ОТВЕТА: 200 OK

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (новый!)",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (новый!)",
    "email": "john.doe@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "message": "Token refreshed successfully"
  }
}

⚠️ ВАЖНО:
Получены НОВЫЕ токены!
Обновите переменные:
- {{accessToken}} = новый
- {{refreshToken}} = новый
```

### Тестовый Случай 4.2: Refresh Token - Invalid Token

```
Название: Refresh Token - Invalid Token
Метод: POST
URL: {{base_url}}/api/auth/refresh-token?refreshToken=invalid-token

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "Invalid or expired refresh token: JWT signature does not match..."
}
```

---

## 5️⃣ FORGET PASSWORD - Запрос сброса пароля

### Тестовый Случай 5.1: Успешный запрос сброса

```
Название: Forget Password - Valid Email
Метод: POST
URL: {{base_url}}/api/auth/forget-password

QUERY PARAMS:
email=john.doe@test.com

Полный URL:
http://localhost:8080/api/auth/forget-password?email=john.doe@test.com

ОЖИДАЕМЫЙ КОД ОТВЕТА: 200 OK

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Password reset email sent. Please check your email.",
  "data": "Reset email sent"
}

⚠️ ВАЖНО:
1. На Mailtrap проверьте полученное письмо
2. Из письма скопируйте reset token
3. Используйте в следующем тесте (reset-password)
```

### Тестовый Случай 5.2: Forget Password - User Not Found

```
Название: Forget Password - User Not Found
Метод: POST
URL: {{base_url}}/api/auth/forget-password?email=nonexistent@test.com

ОЖИДАЕМЫЙ КОД ОТВЕТА: 404 Not Found

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "User not found"
}
```

---

## 6️⃣ RESET PASSWORD - Сброс пароля

### Тестовый Случай 6.1: Успешный сброс пароля

```
Название: Reset Password - Valid Token and Matching Passwords
Метод: POST
URL: {{base_url}}/api/auth/reset-password

QUERY PARAMS:
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (из письма от forget-password)

BODY:
{
  "newPassword": "NewSecurePassword456",
  "confirmPassword": "NewSecurePassword456"
}

ПОЛНЫЙ ПРИМЕР:
POST http://localhost:8080/api/auth/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
{
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 200 OK

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": true,
  "message": "Password reset successfully",
  "data": "Your password has been reset. You can now log in with your new password."
}

⚠️ ПРОВЕРИТЬ:
Попробуйте залогиниться с НОВЫМ паролем!
```

### Тестовый Случай 6.2: Reset Password - Passwords Don't Match

```
Название: Reset Password - Passwords Don't Match
Метод: POST
URL: {{base_url}}/api/auth/reset-password?token=...

BODY:
{
  "newPassword": "NewPassword123",
  "confirmPassword": "DifferentPassword456"  ← НЕ СОВПАДАЮТ!
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "Passwords do not match"
}
```

### Тестовый Случай 6.3: Reset Password - Invalid Token

```
Название: Reset Password - Invalid Token
Метод: POST
URL: {{base_url}}/api/auth/reset-password?token=invalid-token

BODY:
{
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}

ОЖИДАЕМЫЙ КОД ОТВЕТА: 400 Bad Request

ОЖИДАЕМЫЙ ОТВЕТ:
{
  "success": false,
  "message": "Invalid or expired reset token: ..."
}
```

---

## 📋 РЕКОМЕНДУЕМЫЙ ПОРЯДОК ТЕСТИРОВАНИЯ

### ✅ Первый проход (новый пользователь):
1. **Register** (1.1) - создать пользователя
2. **Login** (2.1) - войти (получить токены)
3. **Verify Email** (3.1) - проверить email
4. **Refresh Token** (4.1) - обновить токены
5. **Forget Password** (5.1) - запросить сброс
6. **Reset Password** (6.1) - сбросить пароль
7. **Login** (2.1) - войти с новым паролем ✅

### ✅ Второй проход (отрицательные тесты):
1. Register (1.2) - Email already exists
2. Login (2.2) - Wrong password
3. Login (2.3) - User not found
4. Verify Email (3.2) - Invalid token
5. Refresh Token (4.2) - Invalid token
6. Reset Password (6.2) - Passwords don't match
7. Reset Password (6.3) - Invalid token

---

## 📊 ПРИМЕРЫ ПЕРЕМЕННЫХ POSTMAN

### Создать переменные в Postman (Environment):

```
base_url = http://localhost:8080

email = john.doe@test.com
password = SecurePassword123
firstName = John
lastName = Doe
middleName = Michael
phoneNumber = +1-234-567-8900

accessToken = (получается из login ответа)
refreshToken = (получается из login ответа)

emailVerificationToken = (из логов после register)
resetToken = (из письма после forget-password)
```

### Как использовать в Postman:

```
URL: {{base_url}}/api/auth/login
BODY: {
  "email": "{{email}}",
  "password": "{{password}}"
}

После login:
Tests → Set variable:
pm.environment.set("accessToken", pm.response.json().data.accessToken);
pm.environment.set("refreshToken", pm.response.json().data.refreshToken);
```

---

## 🔍 ПРОВЕРКА ОТВЕТОВ

### Для каждого теста проверяйте:

1. **HTTP Status Code** правильный (201, 200, 400 и т.д.)
2. **success** флаг (true/false)
3. **message** содержит информацию об результате
4. **data** содержит нужную информацию (токены, сообщения и т.д.)
5. **Время ответа** разумно (< 1 сек)

### Примеры правильных ответов:

```
✅ 201 Created (Register):
{
  "success": true,
  "message": "User registered successfully...",
  "data": "Registration successful"
}

✅ 200 OK (Login):
{
  "success": true,
  "message": "Login successful",
  "data": { ... токены ... }
}

❌ 400 Bad Request:
{
  "success": false,
  "message": "Email already exists"
}

❌ 404 Not Found:
{
  "success": false,
  "message": "User not found"
}
```

---

## 💾 ПРОВЕРКА В БД

После каждого успешного теста проверяйте в БД:

```sql
-- Проверить пользователя
SELECT id, email, first_name, verified, active, roles, created_at 
FROM users 
WHERE email = 'john.doe@test.com';

-- Проверить логирование
-- (если есть audit logs)
SELECT * FROM audit_logs 
WHERE user_id = (SELECT id FROM users WHERE email = 'john.doe@test.com')
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📌 ВАЖНЫЕ ЗАМЕЧАНИЯ

⚠️ **Mailtrap Email Verification:**
- После Register письмо отправляется на Mailtrap
- Проверьте https://mailtrap.io инбокс
- Из письма скопируйте ссылку с токеном

⚠️ **Token Expiration:**
- Access Token: 1 час
- Refresh Token: 30 дней
- Email Verification Token: 24 часа
- Password Reset Token: 1 час

⚠️ **Database:**
- Все новые users сохраняются в `users` таблице
- Поле `verified` обновляется после email verification
- Пароль кодируется перед сохранением (BCrypt)

⚠️ **Security:**
- НЕ используйте реальные пароли в тестировании
- НЕ делитесь токенами
- НЕ коммитьте credentials в git

---

**Готовы к тестированию! Начните с первого тестового случая 👆**


