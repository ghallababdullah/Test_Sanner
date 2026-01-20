# 🎯 КРАТКАЯ СПРАВКА: Entity в памяти + Dependency Injection

---

## 🧠 ENTITY В ПАМЯТИ (3 СЕКУНДЫ)

```
Entity = Java объект в ПАМЯТИ приложения
         (НЕ в БД!)

Цикл жизни:
1. Repository.findBy...() → Создает Entity в памяти
2. entity.setField(...) → Изменяет Entity в памяти
3. entity.setField(...) → Изменяет Entity в памяти
4. Repository.save(entity) → Отправляет из памяти в БД
5. return → Entity удаляется из памяти

В БД данные остаются!
```

---

## 🔄 ПОТОК ДАННЫХ (ВИЗУАЛЬНО)

```
┌──────────┐
│ БД (ХД)  │  ← Постоянное хранилище
│ таблица  │     (жесткий диск)
└────┬─────┘
     │ SELECT
     ↓
┌──────────────────────────────┐
│ ПАМЯТЬ ПРИЛОЖЕНИЯ (RAM)      │
│                              │
│ User entity = new User()     │
│ id: "1"                      │
│ email: "john@..."            │
│ verified: false              │
│                              │
│ user.setVerified(true) ← ВЫ  │
│                              │
│ User object в памяти         │
│ verified: true  (изменено)   │
│                              │
└────┬──────────────────────────┘
     │ Repository.save()
     ↓
┌──────────┐
│ БД (ХД)  │  ← Обновлено!
│ verified │
│ = true   │
└──────────┘
```

---

## 🔗 DEPENDENCY INJECTION (3 СЕКУНДЫ)

```
БЕЗ DI:
Controller создает Service
├─ new AuthServiceImpl()
├─ new UserRepository()
├─ new PasswordEncoder()
└─ Контроллер должен знать как их создавать!

С DI (SPRING):
Spring создает Service
├─ @Bean, @Service, @Repository, @Component
├─ Spring внедряет в конструктор
├─ Контроллер просто использует!
└─ Контроллер НЕ знает как их создавать
```

---

## 📝 ГДЕ DI В ВАШЕМ КОДЕ?

### 1. AuthController:
```
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;  ← Инъецирована
}

Spring автоматически:
1. Создает AuthServiceImpl
2. Передает в конструктор AuthController
3. Готово к использованию!
```

### 2. AuthServiceImpl:
```
@Service
@RequiredArgsConstructor
public class AuthServiceImpl {
    private final UserRepository userRepository;        ← Инъецирована
    private final PasswordEncoder passwordEncoder;      ← Инъецирована
    private final TokenService tokenService;            ← Инъецирована
    private final NotificationService notificationSrv;  ← Инъецирована
    private final UserMapper userMapper;                ← Инъецирована
}

Spring автоматически:
1. Создает все 5 зависимостей
2. Передает в конструктор AuthServiceImpl
3. Готово к использованию!
```

### 3. UserMapper:
```
@Component
public class UserMapper {
    private final ModelMapper modelMapper;  ← Инъецирована
}

Spring автоматически:
1. Создает ModelMapper (из AppConfig.java @Bean)
2. Передает в конструктор UserMapper
3. Готово к использованию!
```

### 4. AppConfig.java:
```
@Configuration
public class AppConfig {
    @Bean
    public ModelMapper modelMapperConfig() {
        return new ModelMapper();  ← Spring создает и управляет
    }
}

Spring создает:
1. Bean PasswordEncoder
2. Bean ModelMapper
3. Все могут их использовать!
```

---

## 🌳 ГРАФ DEPENDENCY INJECTION

```
Spring Container (создает и управляет)
│
├─ PasswordEncoder (Bean)
├─ ModelMapper (Bean)
├─ UserRepository (Bean)
├─ TokenService (Bean)
│
├─ UserMapper (Component)
│  └─ зависит от: ModelMapper
│
├─ NotificationService (Service)
│  └─ зависит от: ничего особого
│
├─ AuthServiceImpl (Service)
│  └─ зависит от:
│     ├─ UserRepository
│     ├─ PasswordEncoder
│     ├─ TokenService
│     ├─ NotificationService
│     └─ UserMapper
│
└─ AuthController (RestController)
   └─ зависит от: AuthServiceImpl (через интерфейс AuthService)

Spring автоматически:
1. Видит зависимости
2. Создает нужные Bean'ы
3. Внедряет их в конструкторы
4. Готово!
```

---

## ✅ vs ❌ СРАВНЕНИЕ

### ❌ БЕЗ Dependency Injection:

```java
// В контроллере
AuthController {
    private AuthService authService;
    
    public AuthController() {
        this.authService = new AuthServiceImpl();  // Контроллер создает!
    }
}

ПРОБЛЕМЫ:
- Контроллер жестко привязан к AuthServiceImpl
- Если нужна другая имплементация, меняем контроллер
- Тестирование сложно (нельзя внедрить mock)
- Много boilerplate кода
```

### ✅ С Dependency Injection:

```java
// В контроллере
@RequiredArgsConstructor
AuthController {
    private final AuthService authService;  // Spring внедряет!
}

ПРЕИМУЩЕСТВА:
- Контроллер не привязан к имплементации
- Можно использовать любую имплементацию AuthService
- Тестирование легко (внедряем mock)
- Минимум кода
- Spring управляет всем
```

---

## 🎨 АННОТАЦИИ DEPENDENCY INJECTION

```
@Service
└─ Помечает класс как Service Bean
└─ Spring создает и управляет

@Component
└─ Помечает класс как Component Bean
└─ Spring создает и управляет
└─ Более общий, чем @Service

@Repository
└─ Помечает интерфейс как Repository Bean
└─ Spring создает имплементацию
└─ Специально для доступа к данным

@RestController
└─ Помечает класс как REST контроллер Bean
└─ Spring создает и управляет
└─ Обрабатывает HTTP запросы

@Bean
└─ Помечает метод в @Configuration классе
└─ Spring создает объект, возвращаемый методом
└─ Используется для сложных объектов

@Configuration
└─ Помечает класс как конфигурация Spring
└─ Содержит @Bean методы

@RequiredArgsConstructor
└─ Lombok аннотация
└─ Генерирует конструктор с final полями
└─ Spring использует конструктор для DI

private final Service service
└─ Final поле
└─ Spring передает через конструктор
└─ Помечает зависимость явно
```

---

## 🔄 ЖИЗНЕННЫЙ ЦИКЛ SPRING APPLICATION

```
1. APPLICATION ЗАПУСКАЕТСЯ
   ├─ Spring Boot загружается
   └─ Spring Container инициализируется

2. SPRING СКАНИРУЕТ КЛАССЫ
   ├─ Ищет @Service, @Component, @Repository, @RestController
   ├─ Ищет @Bean методы в @Configuration классах
   └─ Записывает все

3. SPRING СОЗДАЕТ BEAN'Ы
   ├─ Создает все Bean'ы в порядке зависимостей
   ├─ Вычисляет какие зависимости нужны для каждого
   ├─ Создает их рекурсивно
   └─ Сохраняет в контейнере

4. SPRING ВНЕДРЯЕТ ЗАВИСИМОСТИ
   ├─ Для каждого Bean'а видит зависимости
   ├─ Находит нужные Bean'ы в контейнере
   ├─ Передает в конструктор (или через @Autowired)
   └─ Связывает все вместе

5. SPRING ГОТОВ
   ├─ Все Bean'ы созданы
   ├─ Все зависимости внедрены
   └─ Приложение готово к запросам

6. ЗАПРОСЫ ПРИХОДЯТ
   ├─ Spring находит нужный контроллер в контейнере
   ├─ Контроллер уже имеет все зависимости
   ├─ Вызывает методы
   └─ Сервис работает с Repository, PasswordEncoder и т.д.

7. ПРИЛОЖЕНИЕ ЗАВЕРШАЕТСЯ
   ├─ Все Bean'ы удаляются
   ├─ Ресурсы освобождаются
   └─ Spring Container выключается
```

---

## 🚀 ПРАКТИЧЕСКИЙ ПРИМЕР

```
ВЫ запускаете приложение

Spring видит AuthController:
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;  ← нужен AuthService
}

Spring ищет AuthService:
Находит: AuthServiceImpl implements AuthService

Spring видит AuthServiceImpl:
@Service
@RequiredArgsConstructor
public class AuthServiceImpl {
    private final UserRepository userRepository;    ← нужен Repository
    private final PasswordEncoder passwordEncoder;  ← нужен Encoder
    private final TokenService tokenService;        ← нужен TokenService
    private final UserMapper userMapper;            ← нужен Mapper
}

Spring ищет UserRepository:
Находит: public interface UserRepository extends JpaRepository
Spring автоматически генерирует имплементацию

Spring ищет PasswordEncoder:
Находит: @Bean public PasswordEncoder passwordEncoder() { ... }
в AppConfig.java

Spring ищет TokenService:
Находит: @Service public class TokenService { ... }

Spring ищет UserMapper:
Находит: @Component public class UserMapper {
    private final ModelMapper modelMapper;  ← нужен ModelMapper
}

Spring ищет ModelMapper:
Находит: @Bean public ModelMapper modelMapperConfig() { ... }
в AppConfig.java

SPRING СОЗДАЕТ В ПОРЯДКЕ ЗАВИСИМОСТЕЙ:
1. PasswordEncoder (Bean из AppConfig)
2. ModelMapper (Bean из AppConfig)
3. UserRepository (автоматическая имплементация)
4. TokenService (Service)
5. UserMapper (Component с внедренным ModelMapper)
6. AuthServiceImpl (Service со всеми зависимостями)
7. AuthController (RestController с AuthService)

ВСЕ ГОТОВО!

Когда клиент отправляет запрос:
POST /api/auth/login
├─ Spring находит AuthController в контейнере
├─ AuthController уже имеет AuthServiceImpl
├─ AuthServiceImpl уже имеет все зависимости
├─ Все работает идеально!
└─ Ответ возвращается клиенту
```

---

## 📌 КЛЮЧЕВЫЕ МОМЕНТЫ

```
1. ENTITY В ПАМЯТИ
   └─ Существует ТОЛЬКО в памяти приложения
   └─ НЕ в БД!
   └─ Когда метод заканчивается, удаляется из памяти
   └─ Данные в БД остаются навсегда

2. DEPENDENCY INJECTION
   └─ Spring создает объекты (Bean'ы)
   └─ Spring внедряет в конструкторы (инъецирует)
   └─ ВЫ просто используете готовые объекты
   └─ НЕ создаете сами

3. ИНВЕРСИЯ УПРАВЛЕНИЯ
   └─ ДО: ВЫ управляете созданием объектов
   └─ ПОСЛЕ: Spring управляет созданием объектов
   └─ ВЫ только используете

4. В ВАШЕМ ПРИЛОЖЕНИИ
   └─ @RequiredArgsConstructor = Spring создает конструктор
   └─ private final field = зависимость инъецируется
   └─ @Service/@Component/@Repository = Spring создает Bean
   └─ @Bean = Spring создает из метода
```

---

**Теперь вы ПОЛНОСТЬЮ понимаете Entity в памяти и Dependency Injection! 🎉**


