# 🔄 БЫСТРАЯ СПРАВКА: Entity, DTO, Repository

---

## 📌 3-СЕКУНДНОЕ ОБЪЯСНЕНИЕ

```
Entity  = Таблица в БД (напрямую связана)
DTO     = Данные для клиента (НЕ связана с БД)
Repository = Способ работы с Entity в БД
```

---

## 🎯 ВСЕ СЛОИ В ОДНОЙ ТАБЛИЦЕ

| Слой | Что это | Для чего | Примеры методов |
|------|--------|---------|-----------------|
| **Entity** | Java класс с @Entity | Соответствует таблице БД | `user.getId()`, `user.getEmail()` |
| **DTO** | Java класс без @Entity | Обмен с клиентом | `request.getEmail()`, `response.getAccessToken()` |
| **Repository** | Интерфейс с методами | Работа с Entity в БД | `save()`, `findByEmail()`, `delete()` |

---

## 💾 СОХРАНЕНИЕ В БД (STEP BY STEP)

```
1. DTO получена от клиента (JSON преобразован)
   RegistrationRequest { firstName, email, password }

2. Преобразуем в Entity
   User user = new User();
   user.setFirstName(request.getFirstName());
   user.setEmail(request.getEmail());
   user.setPasswordHash(encode(request.getPassword()));

3. Сохраняем в БД
   userRepository.save(user);

4. Repository генерирует SQL
   INSERT INTO users (first_name, email, password_hash) 
   VALUES ('John', 'john@...', '***hash***')

5. PostgreSQL сохраняет в таблице
```

---

## 📖 ПОЛУЧЕНИЕ ИЗ БД (STEP BY STEP)

```
1. Repository ищет в БД
   Optional<User> user = userRepository.findByEmail(email);

2. Repository генерирует SQL
   SELECT * FROM users WHERE email = 'john@...'

3. PostgreSQL находит запись и возвращает
   [id, email, password_hash, first_name, ...]

4. Repository преобразует в Entity
   User { id: UUID, email: "john@...", ... }

5. Используем Entity в коде
   if (user.isPresent()) {
       User u = user.get();
       System.out.println(u.getEmail());
   }

6. Преобразуем в DTO для отправки
   UserResponse response = mapper.map(user, UserResponse.class);

7. Отправляем JSON клиенту
   { "email": "john@...", "firstName": "John", ... }
```

---

## 🔑 ВАШЕ ИЗМЕНЕНИЕ STEP BY STEP

```
Задача: Отметить email как подтвержденный

ШАГ 1: Получить Entity из БД
   User user = userRepository.findByEmail(email)
       .orElseThrow(() -> new NotFoundException(...));
   
   В памяти: verified = false

ШАГ 2: Изменить поле
   user.setVerified(true);
   
   В памяти: verified = true
   В БД: ЕЩЕ false!

ШАГ 3: Сохранить в БД
   userRepository.save(user);  ← КРИТИЧНО!
   
   Repository генерирует: UPDATE users SET verified = true WHERE id = ?
   В БД: ТЕПЕРЬ true!

ИТОГ: Email отмечен как подтвержденный
```

---

## 🎨 ВИЗУАЛЬНАЯ СХЕМА

```
┌─────────────────────┐
│   CLIENT (JSON)     │
│                     │
│  {firstName, email} │
└──────────┬──────────┘
           │
           ↓ Десериализация JSON
    
┌─────────────────────────────────────┐
│   DTO (Request)                     │
│   RegistrationRequest               │
│   - firstName: String               │
│   - email: String                   │
│   - password: String                │
└──────────┬──────────────────────────┘
           │
           ↓ Преобразование через Mapper
           
┌─────────────────────────────────────┐
│   ENTITY                            │
│   User                              │
│   - id: UUID                        │
│   - firstName: String               │
│   - email: String                   │
│   - passwordHash: String (encoded)  │
│   - verified: Boolean               │
│   - createdAt: LocalDateTime        │
│   - active: Boolean                 │
└──────────┬──────────────────────────┘
           │
           ↓ Repository.save()
           
┌─────────────────────┐
│  SQL: INSERT INTO   │
│  users (...)        │
│  VALUES (...)       │
└──────────┬──────────┘
           │
           ↓ Выполнение SQL
           
┌─────────────────────────┐
│  PostgreSQL БД          │
│                         │
│  users table            │
│  id | firstName | email │
│  1  | John      | j@... │
│  2  | Jane      | j@... │
└─────────────────────────┘
```

---

## ⚡ PATTERNS ДЛЯ КАЖДОЙ ОПЕРАЦИИ

### CREATE (Создание)
```java
// DTO от клиента
RegistrationRequest request = ...;

// Преобразуем в Entity
User user = mapper.map(request, User.class);

// Дополнительная обработка
user.setPasswordHash(encode(request.getPassword()));

// Сохраняем
User saved = userRepository.save(user);

// Ответ в виде DTO
LoginResponse response = mapper.map(saved, LoginResponse.class);
```

### READ (Чтение)
```java
// Repository ищет Entity
Optional<User> optionalUser = userRepository.findByEmail(email);

// Получаем Entity или выбрасываем исключение
User user = optionalUser.orElseThrow(() -> 
    new NotFoundException("User not found")
);

// Преобразуем Entity → DTO
UserResponse response = mapper.map(user, UserResponse.class);

// Отправляем DTO клиенту
return response;
```

### UPDATE (Обновление)
```java
// Получаем Entity
User user = userRepository.findByEmail(email)
    .orElseThrow(...);

// Изменяем поля
user.setVerified(true);
user.setLastLogin(LocalDateTime.now());

// Сохраняем изменения
userRepository.save(user);

// Отправляем DTO
UserResponse response = mapper.map(user, UserResponse.class);
```

### DELETE (Удаление)
```java
// Получаем Entity
User user = userRepository.findByEmail(email)
    .orElseThrow(...);

// Удаляем
userRepository.delete(user);
// или
userRepository.deleteById(user.getId());

// Ответ об успехе
return Response.success("User deleted");
```

---

## 🎓 КОГДА ЧТО ИСПОЛЬЗОВАТЬ

### Используйте Entity когда:
✅ Работаете с БД
✅ Читаете из Repository
✅ Сохраняете в Repository
✅ Нужны все поля (включая приватные)

### Используйте DTO когда:
✅ Получаете от клиента (@RequestBody)
✅ Отправляете клиенту (return)
✅ Нужны только публичные данные
✅ Request и Response могут быть разными

### Используйте Repository когда:
✅ Нужно сохранить в БД (save)
✅ Нужно получить из БД (findBy)
✅ Нужно удалить из БД (delete)
✅ Нужны CRUD операции

---

## ✅ ПРОВЕРОЧНЫЙ СПИСОК

При создании новой сущности (например, Post):

- [ ] Создана Entity (Post.java) с @Entity, @Table
- [ ] Все поля соответствуют колонкам в БД
- [ ] Создана Request DTO (CreatePostRequest.java)
- [ ] Создана Response DTO (PostResponse.java)
- [ ] Создана Repository (PostRepository.java)
- [ ] Создан Mapper (PostMapper.java)
- [ ] Создан Service (PostService.java)
- [ ] Создан Controller (PostController.java)
- [ ] В Service: DTO → Entity (через mapper)
- [ ] В Service: Entity → DTO (через mapper)
- [ ] Все save() вызывают repository.save()
- [ ] Все читают через repository методы

---

## 🚀 БЫСТРЫЕ ССЫЛКИ

| Вопрос | Ответ |
|--------|-------|
| Что такое Entity? | Java класс с @Entity соответствует таблице БД |
| Что такое DTO? | Java класс для обмена с клиентом без @Entity |
| Что такое Repository? | Интерфейс для CRUD операций с Entity |
| Как сохранить Entity? | `repository.save(entity)` |
| Как получить Entity? | `repository.findBy...(param).orElseThrow()` |
| Как преобразовать? | `mapper.map(source, targetClass)` |
| Когда DTO → Entity? | Когда получаем от клиента (Request) |
| Когда Entity → DTO? | Когда отправляем клиенту (Response) |

---

**Эта справка поможет вам вспомнить ключевые моменты! 🎯**


