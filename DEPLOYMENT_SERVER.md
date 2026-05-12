**Server Deploy**
This file is the exact order for the first production deployment.

**What You Need**
- GitHub repository with the latest code
- Docker Hub account and images
- Linux server with SSH access
- Domain already pointed to the server IP
- Docker Hub secrets in GitHub:
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`

**Files To Use**
- [docker-compose.prod.yml](/abs/path/c:/Users/abdullah/Desktop/Test_Sanner/docker-compose.prod.yml:1)
- [.env.production.example](/abs/path/c:/Users/abdullah/Desktop/Test_Sanner/.env.production.example:1)

**Step 1**
Copy `.env.production.example` to `.env.production` on your machine and fill it with real values.

Important values:
- `DOCKERHUB_NAMESPACE`
- `POSTGRES_PASSWORD`
- `RABBIT_PASS`
- `JWT_SECRET`
- `MAIL_PASSWORD`
- `FRONTEND_BASE_URL`
- `BACKEND_PUBLIC_BASE_URL`
- `APP_ALLOWED_ORIGINS`

**Step 2**
Push the latest code to `main`.

```powershell
git add .
git commit -m "Prepare production deployment"
git push origin main
```

**Step 3**
Wait for GitHub Actions to finish.

Workflow:
- [docker-publish.yml](/abs/path/c:/Users/abdullah/Desktop/Test_Sanner/.github/workflows/docker-publish.yml:1)

Expected images in Docker Hub:
- `your_dockerhub_username/skanproverka-frontend:latest`
- `your_dockerhub_username/skanproverka-backend:latest`
- `your_dockerhub_username/skanproverka-ocr-worker:latest`

**Step 4**
SSH into the server.

```bash
ssh your_user@your_server_ip
```

**Step 5**
Install Docker if it is not installed yet.

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

Check:

```bash
docker --version
docker compose version
```

**Step 6**
Create the app folder on the server.

```bash
mkdir -p ~/skanproverka
cd ~/skanproverka
```

**Step 7**
Copy these two files to the server:
- `docker-compose.prod.yml`
- `.env.production`

From your PC:

```powershell
scp docker-compose.prod.yml your_user@your_server_ip:~/skanproverka/
scp .env.production your_user@your_server_ip:~/skanproverka/.env
```

**Step 8**
If Docker Hub images are private, log in on the server.

```bash
docker login
```

**Step 9**
Start the stack.

```bash
cd ~/skanproverka
docker compose -f docker-compose.prod.yml up -d
```

**Step 10**
Check running containers.

```bash
docker ps
```

Expected containers:
- `skanproverka-frontend`
- `skanproverka-backend`
- `skanproverka-ocr-worker`
- `skanproverka-postgres`
- `skanproverka-rabbitmq`
- `skanproverka-watchtower`

**Step 11**
Check logs if something fails.

```bash
docker logs -f skanproverka-frontend
docker logs -f skanproverka-backend
docker logs -f skanproverka-ocr-worker
docker logs -f skanproverka-rabbitmq
```

**Step 12**
Open the site in the browser.

```text
https://your-domain.example
```

**Expected Production Flow**
- frontend opens on your domain
- frontend calls `/api/...` through nginx
- backend uses PostgreSQL and RabbitMQ internally
- worker processes OCR jobs
- watchtower auto-updates containers after new Docker Hub images appear

**After The First Deploy**
Your normal update flow becomes:

1. change code locally
2. `git push origin main`
3. GitHub Actions rebuilds images
4. Docker Hub updates
5. Watchtower updates containers on the server automatically
