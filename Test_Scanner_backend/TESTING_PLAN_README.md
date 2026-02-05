# 🧪 COMPLETE TEST PLAN - README

## 📋 Структура Плана

Файл `Complete_Test_Plan.json` содержит **6 ФАЗ** с **17 НЕЗАВИСИМЫМИ ШАГАМИ**:

```
PHASE 1: CREATE TESTS (5 шагов)
  ├─ Step 1.1 - Create Test 1 (Математика - 10 questions)
  ├─ Step 1.2 - Create Test 2 (Русский язык - 5 questions)
  ├─ Step 1.3 - Create Test 3 (История - 5 questions)
  ├─ Step 1.4 - Try Create Test 4 with 33 Questions (SHOULD FAIL)
  └─ Step 1.5 - Create Test 4 CORRECTLY (Физика - 32 questions MAX)

PHASE 2: CREATE ANSWER KEYS (4 шага)
  ├─ Step 2.1 - Create 10 Answer Keys for Test 1
  ├─ Step 2.2 - Create 5 Answer Keys for Test 2
  ├─ Step 2.3 - Create 5 Answer Keys for Test 3
  └─ Step 2.4 - Create 32 Answer Keys for Test 4

PHASE 3: GET ENDPOINTS (6 шагов)
  ├─ Step 3.1 - Get All Tests
  ├─ Step 3.2 - Get Test 1 by ID
  ├─ Step 3.3 - Get Test 1 With Details
  ├─ Step 3.4 - Get Tests by User
  ├─ Step 3.5 - Get Answer Keys for Test 1
  └─ Step 3.6 - Get Grade Thresholds for Test 1

PHASE 4: UPDATE ENDPOINTS (5 шагов)
  ├─ Step 4.1 - Update Test 1
  ├─ Step 4.2 - Update Answer Key 1 from Test 1
  ├─ Step 4.3 - Update Grade Threshold for Test 1
  ├─ Step 4.4 - Activate Test 2
  └─ Step 4.5 - Deactivate Test 2

PHASE 5: DELETE ENDPOINTS (3 шага)
  ├─ Step 5.1 - Delete Answer Key 1 from Test 3
  ├─ Step 5.2 - Delete Grade Threshold from Test 1
  └─ Step 5.3 - Delete Test 2

PHASE 6: VERIFICATION (3 шага)
  ├─ Step 6.1 - Verify Only 3 Tests Remain
  ├─ Step 6.2 - Verify Test 3 Has 4 Answer Keys
  └─ Step 6.3 - Verify Test 1 Has 3 Grade Thresholds
```

---

## 🚀 КАК ИСПОЛЬЗОВАТЬ

### Шаг 1: Импортировать Collection в Postman

1. Открй Postman
2. Нажми **Import**
3. Выбери файл `Complete_Test_Plan.json`
4. Нажми **Import**

### Шаг 2: Установи Environment переменные

В Postman создай Environment с переменной:

```
Variable Name: jwtToken
Value: [твой JWT access token после login]
```

### Шаг 3: Выполни запросы по порядку

**ФАЗА 1 - Создание тестов:**
1. Step 1.1 - Create Test 1 ✅ (сохранит test1Id)
2. Step 1.2 - Create Test 2 ✅ (сохранит test2Id)
3. Step 1.3 - Create Test 3 ✅ (сохранит test3Id)
4. Step 1.4 - Try with 33 questions ❌ (должно ошибиться!)
5. Step 1.5 - Create Test 4 with 32 ✅ (сохранит test4Id)

**ФАЗА 2 - Создание Answer Keys:**
- Step 2.1 - Повтори 10 раз для Test 1 (questionNumber 1-10)
- Step 2.2 - Повтори 5 раз для Test 2 (questionNumber 1-5)
- Step 2.3 - Повтори 5 раз для Test 3 (questionNumber 1-5)
- Step 2.4 - Повтори 32 раза для Test 4 (questionNumber 1-32) **МАКСИМУМ!**

**ФАЗА 3 - GET операции:**
- Step 3.1-3.6 - Выполни один раз каждый

**ФАЗА 4 - UPDATE операции:**
- Step 4.1-4.5 - Выполни один раз каждый

**ФАЗА 5 - DELETE операции:**
- Step 5.1-5.3 - Выполни один раз каждый

**ФАЗА 6 - VERIFICATION:**
- Step 6.1-6.3 - Проверь финальное состояние

---

## 📊 Что Тестируется

### CONSTRAINT Validation

```
✅ totalQuestions (1-32):
   - Step 1.4: Попытка с 33 questions → ❌ ОШИБКА
   - Step 1.5: Создание с 32 questions → ✅ УСПЕХ

✅ Answer Keys (макс 32 на тест):
   - Test 1: 10 keys ✅
   - Test 2: 5 keys ✅
   - Test 3: 5 keys ✅
   - Test 4: 32 keys ✅ (МАКСИМУМ!)

✅ Grade Thresholds (4 дефолтных):
   - Каждый тест получает 4 порога
   - Step 5.2: Удаляем 1 порог

✅ Cascade Delete:
   - Step 5.3: Удаляем тест → должны удалиться все связанные данные
```

### ВСЕ 17 ENDPOINTS

```
POST Endpoints (4):
  ✅ POST /api/tests/create-test
  ✅ POST /api/tests/{testId}/answer-keys
  ✅ POST /api/tests/{testId}/grade-thresholds (дефолт автоматически)

GET Endpoints (4):
  ✅ GET /api/tests
  ✅ GET /api/tests/{testId}
  ✅ GET /api/tests/{testId}/details
  ✅ GET /api/tests/user/{userId}
  ✅ GET /api/tests/{testId}/answer-keys
  ✅ GET /api/tests/{testId}/grade-thresholds

PUT Endpoints (5):
  ✅ PUT /api/tests/update-test/{testId}
  ✅ PUT /api/tests/{testId}/answer-keys/{keyId}
  ✅ PUT /api/tests/{testId}/grade-thresholds/{id}
  ✅ PUT /api/tests/{testId}/activate
  ✅ PUT /api/tests/{testId}/deactivate

DELETE Endpoints (3):
  ✅ DELETE /api/tests/delete-test/{testId}
  ✅ DELETE /api/tests/{testId}/answer-keys/{keyId}
  ✅ DELETE /api/tests/{testId}/grade-thresholds/{id}
```

---

## 🔍 ВАЖНЫЕ МОМЕНТЫ

### Шаги которые нужно ПОВТОРИТЬ (не один раз):

**Step 2.1** - Повтори 10 раз:
```
Меняй в body:
{
  "questionNumber": 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  "correctAnswer": "ABC", "DEF", "GHI", "JKL", "MNO", "PQR", "STU", "VWX", "YZA", "BCD"
}
```

**Step 2.2** - Повтори 5 раз:
```
Меняй в body:
{
  "questionNumber": 1, 2, 3, 4, 5
  "correctAnswer": "пример", "тест", "ответ", "слово", "вопрос"
}
```

**Step 2.3** - Повтори 5 раз:
```
Меняй в body:
{
  "questionNumber": 1, 2, 3, 4, 5
  "correctAnswer": "1066", "1453", "800", "1348", "1492"
}
```

**Step 2.4** - Повтори 32 раза:
```
Меняй в body:
{
  "questionNumber": 1, 2, 3, ..., 32
  "correctAnswer": "F=ma", "E=mc2", "v=at", ... (разные формулы)
}
```

---

## ✅ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### ФАЗА 1 (Create Tests)
```
Step 1.1: ✅ 201 Created - Test 1 (Математика)
Step 1.2: ✅ 201 Created - Test 2 (Русский)
Step 1.3: ✅ 201 Created - Test 3 (История)
Step 1.4: ❌ 400 Bad Request - Попытка с 33 questions
Step 1.5: ✅ 201 Created - Test 4 (Физика)
```

### ФАЗА 2 (Answer Keys)
```
Step 2.1: ✅ 201 Created x10 - Ключи для Test 1
Step 2.2: ✅ 201 Created x5 - Ключи для Test 2
Step 2.3: ✅ 201 Created x5 - Ключи для Test 3
Step 2.4: ✅ 201 Created x32 - Ключи для Test 4 (МАКСИМУМ!)
```

### ФАЗА 3 (Get Operations)
```
Step 3.1: ✅ 200 OK - Возвращает 4 теста
Step 3.2: ✅ 200 OK - Возвращает Test 1
Step 3.3: ✅ 200 OK - Возвращает Test 1 с деталями (10 keys + 4 thresholds)
Step 3.4: ✅ 200 OK - Возвращает 4 теста пользователя
Step 3.5: ✅ 200 OK - Возвращает 10 ключей
Step 3.6: ✅ 200 OK - Возвращает 4 порога
```

### ФАЗА 4 (Update Operations)
```
Step 4.1: ✅ 200 OK - Test 1 обновлён
Step 4.2: ✅ 200 OK - Answer Key обновлён
Step 4.3: ✅ 200 OK - Grade Threshold обновлён
Step 4.4: ✅ 200 OK - Test 2 активирован
Step 4.5: ✅ 200 OK - Test 2 деактивирован
```

### ФАЗА 5 (Delete Operations)
```
Step 5.1: ✅ 200 OK - Answer Key удалён из Test 3
Step 5.2: ✅ 200 OK - Grade Threshold удалён из Test 1
Step 5.3: ✅ 200 OK - Test 2 удалён (и все его связанные данные)
```

### ФАЗА 6 (Verification)
```
Step 6.1: ✅ 200 OK - Осталось 3 теста (Test 2 удалён)
Step 6.2: ✅ 200 OK - Test 3 имеет 4 key (было 5, 1 удалён)
Step 6.3: ✅ 200 OK - Test 1 имеет 3 threshold (было 4, 1 удалён)
```

---

## 📝 ПЕРЕМЕННЫЕ КОТОРЫЕ СОХРАНЯЮТСЯ АВТОМАТИЧЕСКИ

```
test1Id          - ID Test 1 (Математика)
test2Id          - ID Test 2 (Русский)
test3Id          - ID Test 3 (История)
test4Id          - ID Test 4 (Физика)
userId           - ID пользователя (creator)
answerKey1_1     - ID первого ключа Test 1
answerKey3_1     - ID первого ключа Test 3
gradeThreshold1_1 - ID первого порога Test 1
```

Используй эти переменные в запросах через `{{переменная}}`

---

## 🎯 ФИНАЛЬНОЕ СОСТОЯНИЕ

После всех 23 шагов:

```
Тесты:
✅ Test 1 (Математика) - АКТИВЕН - 10 ключей - 3 порога (1 удалён)
✅ Test 3 (История) - АКТИВЕН - 4 ключа (1 удалён) - 4 порога
✅ Test 4 (Физика) - АКТИВЕН - 32 ключа - 4 порога

❌ Test 2 (Русский) - УДАЛЕН (с cascade delete всех связанных данных)
```

---

## ✨ ГОТОВО!

Просто импортируй `Complete_Test_Plan.json` в Postman и следуй по шагам! 🚀


