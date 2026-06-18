# AI Data Analytics & Business Intelligence Agent

A production-grade AI-powered BI platform — conversational analytics, KPI dashboards, forecasting, anomaly detection, and PDF reports.

---

## Architecture

```
User → React Dashboard (port 3000)
     → Spring Boot API (port 8080)   ← JWT Auth, Query Validator, Analytics Service
     → Python AI Service (port 8000) ← NL→SQL (GPT-4o), Insights, Forecasting (Prophet), Anomaly Detection
     → PostgreSQL (port 5432)        ← E-Commerce, Banking, Logistics schemas
     → Redis (port 6379)             ← Session memory, KPI cache
```

---

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- OpenAI API key

### 2. Setup

```bash
# Clone / navigate to project
cd "2AI Data Analytics & BI Agent"

# Add your OpenAI key
echo "OPENAI_API_KEY=sk-your-key" > .env

# Start everything
docker compose -f docker/docker-compose.yml up -d
```

### 3. Access
| Service    | URL                        |
|------------|----------------------------|
| Dashboard  | http://localhost:3000      |
| API Docs   | http://localhost:8080      |
| AI Service | http://localhost:8000/docs |

### 4. Demo Credentials
| Username | Password    | Role    |
|----------|-------------|---------|
| admin    | admin123    | Admin   |
| analyst  | analyst123  | Analyst |
| viewer   | viewer123   | Viewer  |

---

## Local Development (without Docker)

### Database
```bash
psql -U postgres -c "CREATE DATABASE bi_analytics;"
psql -U postgres -d bi_analytics -f database/schemas/01_ecommerce_schema.sql
psql -U postgres -d bi_analytics -f database/schemas/02_banking_logistics_schema.sql
psql -U postgres -d bi_analytics -f database/seeds/01_ecommerce_seed.sql
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env  # Add your OpenAI key
uvicorn main:app --reload --port 8000
```

### Backend
```bash
cd backend
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| POST   | /api/auth/login             | Get JWT token                  |
| POST   | /api/query/run              | NL → SQL → Execute → Chart     |
| POST   | /api/query/generate         | NL → SQL only                  |
| GET    | /api/dashboard/kpis         | All KPI metrics                |
| GET    | /api/dashboard/revenue-trend| Monthly revenue data           |
| GET    | /api/dashboard/top-products | Top products by revenue        |
| POST   | /api/insights               | Generate AI business insights  |
| POST   | /api/forecast               | Revenue forecasting            |
| GET    | /api/anomaly                | Detect data anomalies          |
| POST   | /api/reports/generate       | Generate PDF report            |

---

## Features

- **Ask AI** — Conversational analytics with session memory (multi-turn)
- **Dashboard** — Executive KPI cards, charts, filters by date/region/category
- **Forecasting** — Prophet-based revenue forecasting with confidence intervals
- **Anomaly Detection** — Z-score statistical anomaly detection with explanations
- **Reports** — PDF generation with KPIs + AI insights
- **Security** — JWT auth, SQL injection prevention, SELECT-only query validation
- **Caching** — Redis-backed KPI caching for performance

---

## Supported Datasets
- E-Commerce (customers, products, orders, payments)
- Banking (accounts, transactions, fraud detection)
- Logistics (shipments, drivers, delivery events)
