# Local Development Guide

## Prerequisites

- Python 3.11+
- Java 17+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16
- Redis 7
- OpenAI API key

---

## 1. Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE bi_analytics;"

# Run schemas (order matters)
psql -U postgres -d bi_analytics -f database/schemas/01_ecommerce_schema.sql
psql -U postgres -d bi_analytics -f database/schemas/02_banking_logistics_schema.sql

# Seed data
psql -U postgres -d bi_analytics -f database/seeds/01_ecommerce_seed.sql
psql -U postgres -d bi_analytics -f database/seeds/02_banking_seed.sql
psql -U postgres -d bi_analytics -f database/seeds/03_logistics_seed.sql
```

---

## 2. AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — add OPENAI_API_KEY

uvicorn main:app --reload --port 8000
```

Verify: http://localhost:8000/docs

---

## 3. Backend

```bash
cd backend
mvn spring-boot:run
```

Verify: http://localhost:8080/swagger-ui.html

---

## 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Verify: http://localhost:3000

---

## 5. Run Tests

```bash
# Python
cd ai-service
pytest tests/ -v

# Java
cd backend
mvn test
```

---

## Environment Variables

### AI Service (`ai-service/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | GPT-4o API key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `SMTP_HOST` | ❌ | Email alerts SMTP host |
| `SMTP_USER` | ❌ | Email alerts sender |
| `SMTP_PASSWORD` | ❌ | Email app password |
| `SLACK_WEBHOOK_URL` | ❌ | Slack notifications webhook |

### Backend (`application.yml` / env overrides)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (set in yml) | Min 256-bit JWT signing key |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `REDIS_HOST` | `localhost` | Redis host |
| `AI_SERVICE_URL` | `http://localhost:8000` | AI service base URL |

---

## Troubleshooting

**AI service can't connect to Redis/Postgres**
→ Ensure both services are running. Check `DATABASE_URL` and `REDIS_URL` in `.env`.

**Backend fails to start**
→ Verify PostgreSQL is running and `bi_analytics` database exists with schemas applied.

**JWT errors in frontend**
→ Token is stored in `sessionStorage`. Clear browser session storage and log in again.

**Prophet install fails**
→ On Windows: `pip install pystan==2.19.1.1` before `pip install prophet`

**GPT-4o rate limit**
→ The AI service has graceful fallbacks for all GPT calls — SQL generation will fail hard but insights/copilot return empty responses.
