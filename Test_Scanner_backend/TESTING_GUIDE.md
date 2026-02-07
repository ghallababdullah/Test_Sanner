# 🧪 ПОШАГОВЫЙ ГАЙД ТЕСТИРОВАНИЯ GRADING MODULE

## 📊 ПРЕДВАРИТЕЛЬНЫЕ УСЛОВИЯ

Перед началом убедись что:
```
✅ Приложение запущено (http://localhost:8080)
✅ PostgreSQL работает
✅ Flyway миграции выполнены (V6, V7, V8)
✅ Ты авторизован в Postman
✅ Есть {{accessToken}} и {{userId}} в переменных
```

---

## 🎯 ПОШАГОВЫЙ ПЛАН

### ЭТАП 1: Подготовка (2 минуты)

1. Открой Postman
2. Создай новую Collection: "Grading Module Tests"
3. Настрой Authorization:
   - Type: Bearer Token
   - Token: {{accessToken}}
4. Убедись что есть переменные:
   - accessToken (от логина)
   - userId (от профиля)

---

### ЭТАП 2: Создание теста (1 минута)

#### Request 1: POST /api/tests/create-test

```
Title: Create Test
Method: POST
URL: http://localhost:8080/api/tests/create-test
Authorization: Bearer {{accessToken}}

Body (JSON):
{
  "title": "Математика - Итоговая контрольная",
  "subject": "Математика",
  "classLevel": "10A",
  "totalQuestions": 10,
  "maxScore": 100,
  "description": "Итоговая контрольная работа по математике для 10A класса"
}
```

#### Проверка ответа:
```
✅ Status: 201 Created
✅ success: true
✅ data.id существует
✅ data.classLevel = "10A"
```

#### Сохрани переменную:
```javascript
// In Tests tab:
if (pm.response.code === 201) {
    pm.collectionVariables.set("test1Id", pm.response.json().data.id);
    console.log("✅ Test ID saved: " + pm.response.json().data.id);
}
```

---

### ЭТАП 3: Создание Answer Keys (5 минут)

#### Request 2-11: POST /api/tests/{{test1Id}}/answer-keys

Запусти 10 отдельных requests для каждого вопроса:

```
Title: Create Answer Key Q1
Method: POST
URL: http://localhost:8080/api/tests/{{test1Id}}/answer-keys

Body:
{
  "questionNumber": 1,
  "correctAnswer": "ABC",
  "maxPoints": 10.0,
  "toleranceLevel": 1,
  "answerType": "TEXT"
}
```

Повтори для Q2-Q10 с соответствующими ответами:
- Q2: "125"
- Q3: "ДА"
- Q4: "3.14"
- Q5: "РЕШЕНИЕ"
- Q6: "100"
- Q7: "ВЕРНО"
- Q8: "2.5"
- Q9: "ОТВЕТ"
- Q10: "999"

#### Проверка каждого:
```
✅ Status: 201 Created
✅ success: true
✅ data.questionNumber = правильный номер
✅ data.correctAnswer = правильный ответ
```

---

### ЭТАП 4: Создание Grade Thresholds (1 минута)

#### Request 12: POST /api/tests/{{test1Id}}/grade-thresholds

```
Title: Create Grade Thresholds
Method: POST
URL: http://localhost:8080/api/tests/{{test1Id}}/grade-thresholds

Body (Array):
[
  {
    "gradeName": "Отлично",
    "gradeSymbol": "5",
    "minPercentage": 91,
    "maxPercentage": 100
  },
  {
    "gradeName": "Хорошо",
    "gradeSymbol": "4",
    "minPercentage": 71,
    "maxPercentage": 90
  },
  {
    "gradeName": "Удовлетворительно",
    "gradeSymbol": "3",
    "minPercentage": 51,
    "maxPercentage": 70
  },
  {
    "gradeName": "Неудовлетворительно",
    "gradeSymbol": "2",
    "minPercentage": 0,
    "maxPercentage": 50
  }
]
```

#### Проверка:
```
✅ Status: 200 OK
✅ success: true
✅ data.length = 4 (четыре оценки)
✅ Все оценки с правильными процентами
```

---

### ЭТАП 5: Тестирование Grading (20 минут)

#### TEST CASE 1: Perfect Score (100%)

```
Title: Grading - Test Case 1 (Perfect 100%)
Method: POST
URL: http://localhost:8080/api/grading/evaluate

Body:
{
  "testId": "{{test1Id}}",
  "userId": "{{userId}}",
  "studentName": "Иван",
  "studentLastName": "Петров",
  "studentClass": "10A",
  "answers": [
    {"questionNumber": 1, "answer": "ABC"},
    {"questionNumber": 2, "answer": "125"},
    {"questionNumber": 3, "answer": "ДА"},
    {"questionNumber": 4, "answer": "3.14"},
    {"questionNumber": 5, "answer": "РЕШЕНИЕ"},
    {"questionNumber": 6, "answer": "100"},
    {"questionNumber": 7, "answer": "ВЕРНО"},
    {"questionNumber": 8, "answer": "2.5"},
    {"questionNumber": 9, "answer": "ОТВЕТ"},
    {"questionNumber": 10, "answer": "999"}
  ]
}
```

**Проверяемые данные:**
```
✅ Status: 201 Created
✅ rawScore: 100.00
✅ maxScore: 100.00
✅ percentage: 100.00
✅ grade: "5"
✅ classMatchesStudent: true
✅ Все answers имеют:
   - matchType: "EXACT"
   - isCorrect: true
   - pointsEarned: 10.00
   - distance: 0
```

**Сохрани переменную:**
```javascript
pm.collectionVariables.set("gradingResult1Id", pm.response.json().data.gradingResultId);
```

---

#### TEST CASE 2: With Tolerance (99%)

```
Title: Grading - Test Case 2 (Tolerance 99%)
Method: POST
URL: http://localhost:8080/api/grading/evaluate

Body: (ИЗМЕНИ только первый ответ!)
{
  "testId": "{{test1Id}}",
  "userId": "{{userId}}",
  "studentName": "Мария",
  "studentLastName": "Сидорова",
  "studentClass": "10A",
  "answers": [
    {"questionNumber": 1, "answer": "ABD"},      // ← Вместо "ABC"
    {"questionNumber": 2, "answer": "125"},
    ... остальное как в Case 1 ...
  ]
}
```

**Проверяемые данные:**
```
✅ rawScore: 99.00 (10 - 1 = 9 за первый вопрос)
✅ percentage: 99.00
✅ grade: "5"
✅ Первый ответ:
   - matchType: "TOLERANCE_1"
   - isCorrect: false
   - pointsEarned: 9.00
   - distance: 1
✅ Остальные ответы имеют matchType: "EXACT"
```

---

#### TEST CASE 3: Wrong Answers (50%)

```
Title: Grading - Test Case 3 (Wrong Answers 50%)
Method: POST
URL: http://localhost:8080/api/grading/evaluate

Body:
{
  "testId": "{{test1Id}}",
  "userId": "{{userId}}",
  "studentName": "Петр",
  "studentLastName": "Иванов",
  "studentClass": "10A",
  "answers": [
    {"questionNumber": 1, "answer": "XYZ"},      // ❌
    {"questionNumber": 2, "answer": "999"},      // ❌
    {"questionNumber": 3, "answer": "НЕТ"},      // ❌
    {"questionNumber": 4, "answer": "2.71"},     // ❌
    {"questionNumber": 5, "answer": "ОШИБКА"},   // ❌
    {"questionNumber": 6, "answer": "100"},      // ✅
    {"questionNumber": 7, "answer": "ВЕРНО"},    // ✅
    {"questionNumber": 8, "answer": "2.5"},      // ✅
    {"questionNumber": 9, "answer": "ОТВЕТ"},    // ✅
    {"questionNumber": 10, "answer": "999"}      // ✅
  ]
}
```

**Проверяемые данные:**
```
✅ rawScore: 50.00 (5 правильных × 10 = 50)
✅ percentage: 50.00
✅ grade: "2" (Неудовлетворительно!)
✅ Неправильные ответы:
   - matchType: "NO_MATCH"
   - isCorrect: false
   - pointsEarned: 0.00
✅ Правильные ответы:
   - matchType: "EXACT"
   - isCorrect: true
   - pointsEarned: 10.00
```

---

#### TEST CASE 4: Class Mismatch ⚠️

```
Title: Grading - Test Case 4 (Class Mismatch)
Method: POST
URL: http://localhost:8080/api/grading/evaluate

Body:
{
  "testId": "{{test1Id}}",
  "userId": "{{userId}}",
  "studentName": "Алексей",
  "studentLastName": "Смирнов",
  "studentClass": "10B",      // ← ДРУГОЙ КЛАСС!
  "answers": [
    {"questionNumber": 1, "answer": "ABC"},
    ... все правильные ответы как в Case 1 ...
  ]
}
```

**Проверяемые данные:**
```
✅ rawScore: 100.00
✅ grade: "5"
⚠️ testClass: "10A"
⚠️ studentClass: "10B"
⚠️ classMatchesStudent: false  // ← ВАЖНО!
✅ Logs содержат warning: "CLASS MISMATCH DETECTED!"
```

---

### ЭТАП 6: Получение результатов (5 минут)

#### Request: GET /api/grading/results/{{test1Id}}

```
Title: Get All Results for Test
Method: GET
URL: http://localhost:8080/api/grading/results/{{test1Id}}

Response:
```
**Проверяемые данные:**
```
✅ Status: 200 OK
✅ success: true
✅ data.length = 4 (четыре результата)
✅ Все результаты содержат:
   - gradingResultId
   - studentName, studentLastName, studentClass
   - rawScore, percentage, grade
   - classMatchesStudent
```

---

#### Request: GET /api/grading/results/{{gradingResult1Id}}/details

```
Title: Get Result Details
Method: GET
URL: http://localhost:8080/api/grading/results/{{gradingResult1Id}}/details

Response:
```
**Проверяемые данные:**
```
✅ Status: 200 OK
✅ answerDetails.length = 10
✅ Каждый ответ содержит:
   - questionNumber
   - studentAnswer, correctAnswer
   - pointsEarned, maxPoints
   - matchType, distance
   - isCorrect
```

---

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

```
Test Case 1:  100% → Grade 5 ⭐⭐⭐⭐⭐
Test Case 2:   99% → Grade 5 ⭐⭐⭐⭐⭐
Test Case 3:   50% → Grade 2 ⭐
Test Case 4:  100% → Grade 5 (но classMatchesStudent = false)
```

---

## ✅ CHECKLIST

```
✅ Test создан (Step 1)
✅ Answer Keys созданы (Step 2 - 10 вопросов)
✅ Grade Thresholds установлены (Step 3)
✅ Grading Result 1 создан (Perfect Score)
✅ Grading Result 2 создан (Tolerance)
✅ Grading Result 3 создан (Wrong Answers)
✅ Grading Result 4 создан (Class Mismatch)
✅ GET результаты для теста работает
✅ GET детали результата работает
✅ Все классы совпадают (кроме Case 4)
✅ Все оценки правильные
✅ Все matchType'ы правильные
```

---

## 🐛 ОТЛАДКА

Если что-то не работает:

```
1. Проверь в базе данных:
   SELECT * FROM tests;
   SELECT * FROM answer_keys WHERE test_id = '...';
   SELECT * FROM grading_results;
   SELECT * FROM grading_answer_details;

2. Проверь logs приложения:
   tail -f server.log | grep -i grading

3. Проверь:
   ✅ Authorization header есть
   ✅ {{test1Id}} заменена на реальный ID
   ✅ {{userId}} заменена на реальный ID
   ✅ JSON синтаксис правильный
   ✅ Content-Type = application/json
```

---

## 🎉 РЕЗУЛЬТАТ

После выполнения всех шагов:
```
✅ Грading Module полностью протестирована
✅ Все 4 test cases пройдены
✅ Валидация классов работает
✅ Scoring логика правильная
✅ API возвращает корректные данные
✅ ГОТОВО К PRODUCTION!
```

