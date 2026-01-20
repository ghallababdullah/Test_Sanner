# 📌 QUICK REFERENCE - AUTH MODULE

## 🔗 API ENDPOINTS - QUICK ACCESS

### 1️⃣ Register (Регистрация)
```
POST http://localhost:8080/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Michael",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phoneNumber": "+1-234-567-8900"
}
```
**Status:** 201 Created

---

### 2️⃣ Login (Вход)
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```
**Status:** 200 OK
**Returns:** accessToken, refreshToken

---

### 3️⃣ Refresh Token (Обновление)
```
POST http://localhost:8080/api/auth/refresh-token?refreshToken=YOUR_REFRESH_TOKEN
```
**Status:** 200 OK
**Returns:** New accessToken, refreshToken

---

### 4️⃣ Verify Email (Проверка email)
```
GET http://localhost:8080/api/auth/verify-email?token=YOUR_EMAIL_TOKEN
```
**Status:** 200 OK

---

### 5️⃣ Forget Password (Запрос сброса)
```
POST http://localhost:8080/api/auth/forget-password?email=john@example.com
```
**Status:** 200 OK

---

### 6️⃣ Reset Password (Сброс пароля)
```
POST http://localhost:8080/api/auth/reset-password?token=YOUR_RESET_TOKEN
Content-Type: application/json

{
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```
**Status:** 200 OK

---

## 🎨 FILE STRUCTURE

```
auth/
├── controller/
│   └── AuthController.java          ← REST API
├── domain/
│   ├── entity/
│   │   └── User.java               ← Entity (тут email, password, etc)
│   ├── repository/
│   │   └── UserRepository.java      ← Data access
│   ├── service/
│   │   ├── AuthService.java         ← Interface
│   │   └── AuthServiceImpl.java      ← Implementation (6 methods)
│   └── event/
├── dto/
│   ├── LoginRequest.java            ← email, password
│   ├── LoginResponse.java           ← accessToken, refreshToken
│   ├── RegistrationRequest.java     ← firstName, lastName, email, password
│   ├── UserResponse.java            ← User data for API
│   ├── UserDto.java                 ← User data DTO
│   ├── UserCreateRequest.java       ← Create user request
│   ├── UserUpdateRequest.java       ← Update user request
│   └── ResetPasswordRequest.java    ← newPassword, confirmPassword
├── mapper/
│   └── UserMapper.java              ← ✅ USES MODELMAPPER
├── filter/
├── repository/
├── security/
│   ├── TokenService.java            ← JWT generation
│   ├── JwtUtils.java
│   └── CustomUserDetailsService.java
└── ...
```

---

## 🔄 METHOD SIGNATURES

### AuthService Interface
```java
public interface AuthService {
    Response<String> register(RegistrationRequest request);
    Response<LoginResponse> login(LoginRequest loginRequest);
    Response<LoginResponse> refreshToken(String refreshToken);
    Response<String> verifyEmail(String token);
    Response<String> forgetPassword(String email);
    Response<String> resetPassword(String token, ResetPasswordRequest request);
}
```

### UserMapper Component
```java
@Component
public class UserMapper {
    // ✅ Использует ModelMapper
    public User toUserEntity(RegistrationRequest request)
    public LoginResponse toLoginResponse(User user, String accessToken, String refreshToken)
    public UserResponse toUserResponse(User user)
    public UserDto toUserDto(User user)
    public void updateUserFromRequest(UserUpdateRequest request, User user)
    public User toUserEntity(UserCreateRequest request)
}
```

---

## 💾 DATABASE SCHEMA

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(75) NOT NULL,
    middle_name VARCHAR(75),
    last_name VARCHAR(75) NOT NULL,
    phone_number VARCHAR(20),
    roles VARCHAR(50)[] NOT NULL DEFAULT ARRAY['USER'],
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);
```

---

## 🔐 TOKEN EXAMPLE

```
Access Token (JWT):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiJqb2huQGV4YW1wbGUuY29tIiwidHlwZSI6IkFDQ0VTUyIsImlhdCI6MTczNjc1NjcyMywiZXhwIjoxNzM2NzYwMzIzfQ
.abcdef123456...

Claims:
{
  "sub": "john@example.com",
  "type": "ACCESS",
  "iat": 1736756723,
  "exp": 1736760323  (1 hour later)
}
```

---

## ✅ ERROR RESPONSES

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## 🧪 TESTING CHECKLIST

- [ ] Register new user
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Refresh token
- [ ] Verify email
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Reset password with wrong token (should fail)
- [ ] Check database for saved user
- [ ] Check logs for proper logging
- [ ] Test with Postman
- [ ] Test with curl

---

## 🔧 CONFIGURATION

### application.yaml
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

  jwt:
    secret:
      string: "your-secret-key-here-at-least-32-chars"
    expiration:
      time: 86400000  # 24 hours

app:
  mail:
    from: noreply@example.com
    name: App Name
```

### AppConfig.java
```java
@Configuration
public class AppConfig {
    @Bean
    public ModelMapper modelMapperConfig() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration()
            .setFieldMatchingEnabled(true)
            .setFieldAccessLevel(PRIVATE)
            .setMatchingStrategy(STANDARD);
        return modelMapper;
    }
}
```

---

## 📊 RESPONSE EXAMPLES

### Success Response (Login)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "message": "Login successful"
  }
}
```

### Success Response (Register)
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify.",
  "data": "Registration successful"
}
```

---

## 🔑 KEY CLASSES

| Class | Purpose |
|-------|---------|
| **AuthController** | REST endpoints |
| **AuthServiceImpl** | Business logic |
| **UserMapper** | DTO ↔ Entity conversion |
| **TokenService** | JWT generation/validation |
| **UserRepository** | Database access |
| **PasswordEncoder** | Password hashing |
| **NotificationService** | Email sending |

---

## 📌 IMPORTANT NOTES

1. **Access Token:** Valid for 1 hour
2. **Refresh Token:** Valid for 30 days
3. **Email Token:** Valid for 24 hours
4. **Password Reset Token:** Valid for 1 hour

After Access Token expires, use Refresh Token to get new one!

---

## 🚀 QUICK START

```bash
# 1. Clone/Setup project
cd Test_Scanner_backend

# 2. Compile
./gradlew clean build -x test

# 3. Run
./gradlew bootRun

# 4. Test in Postman
# Use examples from POSTMAN_API_EXAMPLES.md
```

---

## 📞 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Email already exists | Use different email |
| Invalid password | Check password requirements (min 8 chars) |
| Token expired | Use refresh token to get new access token |
| User not found | Check email spelling |
| Connection timeout | Ensure PostgreSQL is running |

---

## 🎯 MODELMAPPER USAGE

### In UserMapper:
```java
// Point 1: RegistrationRequest → User Entity
User user = modelMapper.map(request, User.class);

// Point 2: User Entity → LoginResponse DTO
LoginResponse response = modelMapper.map(user, LoginResponse.class);
```

### In AuthServiceImpl:
```java
// Point 3: Using mapper in register()
User user = userMapper.toUserEntity(request);

// Point 4: Using mapper in login()
LoginResponse loginResponse = userMapper.toLoginResponse(user, accessToken, refreshToken);

// Point 5: Using mapper in refreshToken()
LoginResponse loginResponse = userMapper.toLoginResponse(user, newAccessToken, newRefreshToken);
```

---

**✅ Ready to test! Use POSTMAN_API_EXAMPLES.md for detailed examples.**


