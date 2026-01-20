## 🧪 POSTMAN/INSOMNIA API EXAMPLES

### Базовый URL для всех запросов:
```
http://localhost:8080
```

---

## 1️⃣ REGISTRATION - Регистрация

**URL:** `POST /api/auth/register`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Абдулла",
  "lastName": "Галлаб",
  "middleName": "Ахмед",
  "email": "abdullah@test.com",
  "password": "Password123456",
  "phoneNumber": "+7-999-888-7777"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify.",
  "data": "Registration successful"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

## 2️⃣ LOGIN - Вход в приложение

**URL:** `POST /api/auth/login`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "abdullah@test.com",
  "password": "Password123456"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmR1bGxhaEB0ZXN0LmNvbSIsInR5cGUiOiJBQ0NFU1MiLCJpYXQiOjE3MzY3NTY3MjMsImV4cCI6MTczNjc2MDMyM30.abc123...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmR1bGxhaEB0ZXN0LmNvbSIsInR5cGUiOiJSRUZSRVNIIiwiaWF0IjoxNzM2NzU2NzIzLCJleHAiOjE3MzkyNDg3MjN9.xyz789...",
    "email": "abdullah@test.com",
    "firstName": "Абдулла",
    "lastName": "Галлаб",
    "message": "Login successful"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## 3️⃣ REFRESH TOKEN - Обновление Access Token

**URL:** `POST /api/auth/refresh-token?refreshToken=YOUR_REFRESH_TOKEN`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** (пусто)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_TOKEN_HERE...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.NEW_REFRESH_TOKEN_HERE...",
    "email": "abdullah@test.com",
    "firstName": "Абдулла",
    "lastName": "Галлаб",
    "message": "Token refreshed successfully"
  }
}
```

**Example URL:**
```
http://localhost:8080/api/auth/refresh-token?refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmR1bGxhaEB0ZXN0LmNvbSIsInR5cGUiOiJSRUZSRVNIIiwiaWF0IjoxNzM2NzU2NzIzLCJleHAiOjE3MzkyNDg3MjN9.xyz789
```

---

## 4️⃣ VERIFY EMAIL - Проверка Email

**URL:** `GET /api/auth/verify-email?token=YOUR_EMAIL_VERIFICATION_TOKEN`

**Request Headers:**
```
(Без тела запроса)
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": "Your email has been verified. You can now log in."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid or expired verification token: Invalid JWT signature"
}
```

**Example URL:**
```
http://localhost:8080/api/auth/verify-email?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmR1bGxhaEB0ZXN0LmNvbSIsInR5cGUiOiJFTUFJTF9WRVJJRklDQVRJT04iLCJpYXQiOjE3MzY3NTY3MjMsImV4cCI6MTczNjg0MzEyM30.abc123
```

---

## 5️⃣ FORGET PASSWORD - Запрос Сброса Пароля

**URL:** `POST /api/auth/forget-password?email=YOUR_EMAIL`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** (пусто)

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent. Please check your email.",
  "data": "Reset email sent"
}
```

**Example URL:**
```
http://localhost:8080/api/auth/forget-password?email=abdullah@test.com
```

---

## 6️⃣ RESET PASSWORD - Сброс Пароля

**URL:** `POST /api/auth/reset-password?token=YOUR_PASSWORD_RESET_TOKEN`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "newPassword": "NewPassword123456",
  "confirmPassword": "NewPassword123456"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": "Your password has been reset. You can now log in with your new password."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Passwords do not match"
}
```

**Example URL:**
```
http://localhost:8080/api/auth/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmR1bGxhaEB0ZXN0LmNvbSIsInR5cGUiOiJQQVNTV09SRF9SRVNFVCIsImlhdCI6MTczNjc1NjcyMywiZXhwIjoxNzM2NzYwMzIzfQ.def456
```

---

## 🔄 ПОЛНЫЙ ЦИКЛ ТЕСТИРОВАНИЯ

### Шаг 1: Регистрация
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Тест",
    "lastName": "Пользователь",
    "email": "test@example.com",
    "password": "Test123456",
    "phoneNumber": "+7-999-999-9999"
  }'
```

### Шаг 2: Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```
Сохраните `accessToken` и `refreshToken` из ответа!

### Шаг 3: Refresh Token (через 1 час)
```bash
curl -X POST "http://localhost:8080/api/auth/refresh-token?refreshToken=YOUR_REFRESH_TOKEN"
```

### Шаг 4: Verify Email
```bash
curl -X GET "http://localhost:8080/api/auth/verify-email?token=YOUR_VERIFICATION_TOKEN"
```

### Шаг 5: Forget Password
```bash
curl -X POST "http://localhost:8080/api/auth/forget-password?email=test@example.com"
```

### Шаг 6: Reset Password
```bash
curl -X POST "http://localhost:8080/api/auth/reset-password?token=YOUR_RESET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword": "NewTest123456",
    "confirmPassword": "NewTest123456"
  }'
```

---

## ⚠️ ОШИБКИ И РЕШЕНИЯ

### 1. "Email already exists"
**Причина:** Пользователь с этим email уже зарегистрирован
**Решение:** Используйте другой email или заранее удалите пользователя из БД

### 2. "Invalid email or password"
**Причина:** Неправильный email или пароль
**Решение:** Проверьте правильность email и пароля

### 3. "User account is inactive"
**Причина:** Аккаунт пользователя неактивный
**Решение:** Активируйте аккаунт в БД или обратитесь к администратору

### 4. "Invalid or expired refresh token"
**Причина:** Refresh token истек (30 дней) или некорректный
**Решение:** Пользователь должен снова залогиниться

### 5. "Invalid or expired verification token"
**Причина:** Email verification token истек (24 часа)
**Решение:** Пользователь должен заново зарегистрироваться

### 6. "Passwords do not match"
**Причина:** newPassword и confirmPassword не совпадают
**Решение:** Убедитесь что пароли идентичны

---

## 🔐 БЕЗОПАСНОСТЬ ПРИ ТЕСТИРОВАНИИ

1. **Никогда не делитесь токенами** публично
2. **Используйте httpOnly cookies** для хранения refresh token в продакшене
3. **Установите HTTPS** в продакшене
4. **Не логируйте** пароли и токены
5. **Используйте Short-lived access tokens** (1 час)
6. **Используйте Long-lived refresh tokens** (30 дней)

---

## 📌 ВАЖНЫЕ ЗАМЕЧАНИЯ

- **Access Token** действителен **1 час**
- **Refresh Token** действителен **30 дней**
- **Email Verification Token** действителен **24 часа**
- **Password Reset Token** действителен **1 час**

После истечения access token используйте refresh token для получения нового!


