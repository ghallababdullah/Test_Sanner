# 🏗️ AUTH MODULE ARCHITECTURE DIAGRAM

## 📊 АРХИТЕКТУРНАЯ ДИАГРАММА

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Postman/Frontend)                        │
└────────────┬────────────────────────────────────────────────────────────┘
             │ HTTP Requests
             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    AuthController (@RestController)                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ POST   /api/auth/register          @PostMapping                 │  │
│  │ POST   /api/auth/login              @PostMapping                 │  │
│  │ POST   /api/auth/refresh-token      @PostMapping                 │  │
│  │ GET    /api/auth/verify-email       @GetMapping                  │  │
│  │ POST   /api/auth/forget-password    @PostMapping                 │  │
│  │ POST   /api/auth/reset-password     @PostMapping                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────────────┘
             │ Вызывает методы
             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   AuthService Interface (Контракт)                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Response<String> register(RegistrationRequest)                   │  │
│  │ Response<LoginResponse> login(LoginRequest)                      │  │
│  │ Response<LoginResponse> refreshToken(String)                     │  │
│  │ Response<String> verifyEmail(String token)                       │  │
│  │ Response<String> forgetPassword(String email)                    │  │
│  │ Response<String> resetPassword(String, ResetPasswordRequest)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────┬────────────────────────────────────────────────────────────┘
             │ Реализует (implements)
             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│              AuthServiceImpl (@Service, @Transactional)                   │
│                                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐   │
│  │  register() │──│ ModelMapper  │──│ validate   │──│ save to DB  │   │
│  │             │  │              │  │ & encrypt  │  │ + send mail │   │
│  └─────────────┘  └──────────────┘  └────────────┘  └─────────────┘   │
│                                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐   │
│  │  login()    │──│ find user    │──│ check pwd  │──│ gen tokens  │   │
│  │             │  │ & mapper     │  │ & update   │  │ + response  │   │
│  └─────────────┘  └──────────────┘  └────────────┘  └─────────────┘   │
│                                                                            │
│  ┌─────────────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ refreshToken()          │──│ validate     │──│ gen new tokens   │  │
│  │ verifyEmail()           │  │ refresh tkn  │  │ + return response│  │
│  │ forgetPassword()        │  └──────────────┘  └──────────────────┘  │
│  │ resetPassword()         │                                             │
│  └─────────────────────────┘                                             │
│                                                                            │
│  Dependencies (Injected via @RequiredArgsConstructor):                   │
│  ├─ UserRepository        (UserRepository extends JpaRepository)        │
│  ├─ PasswordEncoder       (Spring Security)                             │
│  ├─ TokenService          (JWT generation/validation)                   │
│  ├─ NotificationService   (Email sending)                               │
│  └─ UserMapper            (DTO ↔ Entity conversion)                     │
└────────────┬────────────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬────────────┬─────────────┬──────────────┐
    ↓                 ↓            ↓             ↓              ↓
┌──────────┐   ┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐
│UserMapper│   │UserRepository│ │TokenServ │ │Notification │ │ Password │
│          │   │              │ │ Service  │ │  Service    │ │ Encoder  │
│.toUserEnt│   │.findByEmail()│ │generate()│ │.sendEmail() │ │.encode() │
│ity()    │   │.save()       │ │validate()│ │             │ │.matches()│
│.toLoginR │   │.existsByEmail│ │          │ │             │ │          │
│esponse() │   │              │ │          │ │             │ │          │
└──────────┘   └──────┬───────┘ └──────────┘ └──────────────┘ └──────────┘
                      │
                      ↓
              ┌───────────────────┐
              │  PostgreSQL DB    │
              │                   │
              │ users table       │
              │ (Entity: User)    │
              └───────────────────┘
```

---

## 🔄 FLOW DIAGRAM - Регистрация (register)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/auth/register
       │ { firstName, lastName, email, password }
       ↓
┌─────────────────────────────────────────────────┐
│  AuthController.register(RegistrationRequest)   │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  AuthServiceImpl.register(RegistrationRequest)   │
│                                                  │
│  1. Check if email exists                       │
│     ├─ YES → throw BadRequestException          │
│     └─ NO → continue                            │
│                                                  │
│  2. ✅ USE MAPPER: userMapper.toUserEntity()   │
│     RegistrationRequest → User Entity           │
│                                                  │
│  3. Encode password using PasswordEncoder       │
│                                                  │
│  4. Save User to database via UserRepository    │
│                                                  │
│  5. Generate email verification token           │
│                                                  │
│  6. Send verification email via NotificationSrv │
│                                                  │
│  7. Return success response                     │
└──────┬──────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Response<String>                 │
│ {                                │
│   "success": true,               │
│   "message": "...",              │
│   "data": "Registration success" │
│ }                                │
└──────────────────────────────────┘
```

---

## 🔄 FLOW DIAGRAM - Вход (login)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/auth/login
       │ { email, password }
       ↓
┌──────────────────────────────────────────────┐
│  AuthController.login(LoginRequest)          │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  AuthServiceImpl.login(LoginRequest)              │
│                                                  │
│  1. Find User by email                          │
│     ├─ NOT FOUND → throw NotFoundException      │
│     └─ FOUND → continue                         │
│                                                  │
│  2. Check password match                        │
│     ├─ NO MATCH → throw BadRequestException    │
│     └─ MATCH → continue                         │
│                                                  │
│  3. Check user is active                        │
│     ├─ INACTIVE → throw BadRequestException    │
│     └─ ACTIVE → continue                        │
│                                                  │
│  4. Update last login time                      │
│                                                  │
│  5. Generate tokens:                            │
│     ├─ accessToken (1 hour)                    │
│     └─ refreshToken (30 days)                  │
│                                                  │
│  6. ✅ USE MAPPER: userMapper.toLoginResponse() │
│     User Entity → LoginResponse DTO             │
│                                                  │
│  7. Return Response with tokens                 │
└──────┬───────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────┐
│ Response<LoginResponse>                  │
│ {                                        │
│   "success": true,                       │
│   "message": "Login successful",         │
│   "data": {                              │
│     "accessToken": "JWT...",             │
│     "refreshToken": "JWT...",            │
│     "email": "...",                      │
│     "firstName": "...",                  │
│     "lastName": "..."                    │
│   }                                      │
│ }                                        │
└──────────────────────────────────────────┘
```

---

## 🔄 FLOW DIAGRAM - Обновление токена (refreshToken)

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/auth/refresh-token?refreshToken=JWT
       ↓
┌──────────────────────────────────────────────┐
│  AuthController.refreshToken(String)         │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│  AuthServiceImpl.refreshToken(String)         │
│                                              │
│  1. Check token type == "REFRESH"            │
│     ├─ INVALID → throw BadRequestException   │
│     └─ VALID → continue                      │
│                                              │
│  2. Extract email from token                 │
│                                              │
│  3. Find User by email                       │
│     ├─ NOT FOUND → throw NotFoundException   │
│     └─ FOUND → continue                      │
│                                              │
│  4. Check user is active                     │
│                                              │
│  5. Generate new tokens:                     │
│     ├─ newAccessToken (1 hour)              │
│     └─ newRefreshToken (30 days)            │
│                                              │
│  6. ✅ USE MAPPER: userMapper.toLoginResponse()│
│     User Entity → LoginResponse DTO          │
│                                              │
│  7. Return Response with new tokens          │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────┐
│ Response<LoginResponse>                  │
│ {                                        │
│   "success": true,                       │
│   "message": "Token refreshed",          │
│   "data": {                              │
│     "accessToken": "NEW_JWT...",         │
│     "refreshToken": "NEW_JWT...",        │
│     ...                                  │
│   }                                      │
│ }                                        │
└──────────────────────────────────────────┘
```

---

## 📦 DEPENDENCY INJECTION DIAGRAM

```
┌──────────────────────────────────────┐
│    common/config/AppConfig.java      │
│  (создает Bean для ModelMapper)      │
└────────────┬───────────────────────┘
             │ @Bean
             ↓
    ┌────────────────┐
    │  ModelMapper   │
    │   (Singleton)  │
    └────────┬───────┘
             │ @Inject via constructor
             ↓
    ┌────────────────────┐
    │   UserMapper       │
    │ (@Component)       │
    └────────┬───────────┘
             │ @Inject via constructor
             ↓
    ┌────────────────────────────┐
    │ AuthServiceImpl             │
    │ (@Service)                 │
    │                            │
    │ private final UserMapper   │
    │ private final UserRepository│
    │ private final TokenService │
    │ private final NotificationSrv
    │ private final PasswordEncoder
    └────────────┬────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │ AuthController │
        │ (@RestController)
        └────────────────┘
```

---

## 🔐 SECURITY FLOW

```
┌─────────────┐
│ RegistrationRequest │
└────────┬────────────┘
         │
         ├─ Validation:
         │  ├─ @NotBlank firstName
         │  ├─ @NotBlank lastName  
         │  ├─ @Email email
         │  └─ @Size password (8-100 chars)
         │
         ↓
┌──────────────────────────┐
│ PasswordEncoder.encode() │
│ (BCrypt/Argon2)          │
└────────┬─────────────────┘
         │
         ↓
    ┌────────────────┐
    │ Hashed Password│
    │ in Database    │
    └────────────────┘


┌──────────────┐
│ LoginRequest │
└────────┬─────┘
         │
         ├─ Find User by email
         │
         ↓
    ┌────────────────────────────┐
    │ PasswordEncoder.matches()  │
    │ (Provided pwd vs DB hash)  │
    └────────┬───────────────────┘
             │
             ├─ YES → Generate tokens
             └─ NO → Throw exception
```

---

## 🎯 MODELMAPPER USAGE SUMMARY

### 3 основных использования:

```
1. UserMapper.toUserEntity(RegistrationRequest request)
   RegistrationRequest { firstName, lastName, email, password }
         ↓ ModelMapper.map()
   User Entity { id, firstName, lastName, email, passwordHash, roles, active }

2. UserMapper.toLoginResponse(User user, String accessToken, String refreshToken)
   User Entity { id, firstName, lastName, email, roles, ... }
         ↓ ModelMapper.map()
   LoginResponse { accessToken, refreshToken, email, firstName, lastName }

3. UserMapper.toUserResponse(User user)
   User Entity { id, firstName, lastName, email, ... }
         ↓ ModelMapper.map()
   UserResponse { id, firstName, lastName, email, ... }
```

---

## ✅ ИТОГОВАЯ АРХИТЕКТУРА

```
Client Request
    ↓
AuthController (REST Layer)
    ↓
AuthServiceImpl (Business Logic Layer)
    ├─ UserRepository (Data Access)
    ├─ UserMapper (DTO ↔ Entity Conversion) ← MODELLOADER
    ├─ TokenService (JWT Generation)
    ├─ NotificationService (Email Sending)
    └─ PasswordEncoder (Security)
    ↓
Database (PostgreSQL)
    ↓
Response (JSON)
```

Все компоненты связаны через Dependency Injection!


