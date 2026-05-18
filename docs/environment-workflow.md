# Environment Workflow

## Что подхватывается автоматически

- `frontend/.env.development`
  Используется Vite при `npm run dev`
- `frontend/.env.production`
  Используется Vite при production build, если файл существует
- backend через `application.yaml`
  Загружает `.env`, а затем `.env.local`, если они существуют

## Локальная разработка

### Frontend

Запуск:

```bash
cd frontend
npm run dev
```

Vite автоматически возьмёт значения из:

```text
frontend/.env.development
```

### Backend

1. Скопируйте шаблон:

```powershell
Copy-Item .env.local.example .env.local
```

2. При необходимости впишите свои локальные значения:
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `DB_PASSWORD`

3. Запускайте backend из IDE или через Gradle.

Spring Boot автоматически возьмёт:
- `.env`, если он есть
- затем `.env.local`, если он есть

`.env.local` загружается после `.env` и переопределяет его значения.

## Production

- На сервере используется отдельный файл:

```text
~/skanproverka/.env
```

- Frontend production-сборка может использовать:

```text
frontend/.env.production
```

или значения, переданные через Docker build args.

## Как переключаться

### Локальный режим

- frontend:
  - `cd frontend`
  - `npm run dev`
- backend:
  - используйте `.env.local`

### Production

- локально ничего не переключаете вручную
- делаете `git push`
- после успешной сборки на сервере:

```bash
cd ~/skanproverka
docker compose -f docker-compose.prod.yml pull <services>
docker compose -f docker-compose.prod.yml up -d <services>
```

## Практическое правило

- `frontend/.env.development` = локальный фронт
- `.env.local` = локальный backend
- `~/skanproverka/.env` = production на сервере

Так код остаётся один и тот же, а переключение происходит за счёт окружения.
