# AI Data Analytics & Business Intelligence Agent

A production-grade, enterprise-scale AI-powered BI platform — conversational analytics, KPI dashboards, forecasting, anomaly detection, PDF/CSV/Excel reports, governance, security, and executive decision support.

> Combines the power of Power BI + Tableau + Looker + AI Copilot in one platform.

---

## Architecture

```
User → React Dashboard (port 3000)
     → Spring Boot API (port 8080)   ← JWT Auth, RLS, SQL Validator, Analytics Service
     → Python AI Service (port 8000) ← NL→SQL (GPT-4o), Insights, Forecasting (Prophet),
                                         Anomaly Detection, Copilot, Alerts, Scheduler
     → PostgreSQL (port 5432)        ← E-Commerce, Banking, Logistics schemas + seeds
     → Redis (port 6379)             ← Session memory, KPI cache, alert store
     → Prometheus (port 9090)        ← Metrics scraping
     → Grafana (port 3001)           ← Pre-built dashboards (auto-provisioned)
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- OpenAI API key

### Setup

```bash
cd "2AI Data Analytics & BI Agent"

# Add your OpenAI key
echo "OPENAI_API_KEY=sk-your-key" > .env

# Start everything
docker compose -f docker/docker-compose.yml up -d
```

### Access

| Service        | URL                          | Credentials          |
|----------------|------------------------------|----------------------|
| Dashboard      | http://localhost:3000        | See below            |
| API (Swagger)  | http://localhost:8080/swagger-ui.html | —           |
| AI Service     | http://localhost:8000/docs   | —                    |
| Grafana        | http://localhost:3001        | admin / admin123     |
| Prometheus     | http://localhost:9090        | —                    |

### Demo Credentials

| Username | Password    | Role    | Access                          |
|----------|-------------|---------|----------------------------------|
| admin    | admin123    | Admin   | Full access                     |
| analyst  | analyst123  | Analyst | Analytics, reports, forecasts   |
| viewer   | viewer123   | Viewer  | Read-only dashboard             |

---

## Local Development (without Docker)

### Database
```bash
psql -U postgres -c "CREATE DATABASE bi_analytics;"
psql -U postgres -d bi_analytics -f database/schemas/01_ecommerce_schema.sql
psql -U postgres -d bi_analytics -f database/schemas/02_banking_logistics_schema.sql
psql -U postgres -d bi_analytics -f database/seeds/01_ecommerce_seed.sql
psql -U postgres -d bi_analytics -f database/seeds/02_banking_seed.sql
psql -U postgres -d bi_analytics -f database/seeds/03_logistics_seed.sql
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env   # Add OPENAI_API_KEY, SMTP, Slack config
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

### Run Tests
```bash
# Python tests
cd ai-service && pytest tests/ -v

# Java tests
cd backend && mvn test
```

---

## Features

### Core Analytics
| Feature | Description |
|---------|-------------|
| **Ask AI** | Conversational NL→SQL with GPT-4o, multi-turn memory (Redis), dataset-aware |
| **Dashboard** | Executive KPIs, revenue trend, region/category/product charts, top customers |
| **SQL Engine** | Joins, aggregations, window functions, rankings, time-series, cohort queries |
| **SQL Security** | SELECT-only enforcement, blocks DML/DDL, multi-statement injection prevention |
| **Auto Charts** | Rule-based chart type detection (line/bar/pie/scatter/area) |
| **AI Insights** | GPT-4o executive summary, key findings, growth drivers, risks, recommendations |

### Advanced Analytics
| Feature | Description |
|---------|-------------|
| **Forecasting** | Prophet + linear fallback for E-Commerce, Banking, Logistics metrics |
| **Anomaly Detection** | Z-score on revenue, fraud (banking), delivery failures/delays (logistics) |
| **Benchmarking** | MoM, QoQ, YoY, region, segment comparisons with AI variance analysis |
| **Cohort Analysis** | Customer lifetime value and retention via NL queries |

### Enterprise
| Feature | Description |
|---------|-------------|
| **AI Copilot** | Executive strategic advisor — risk, opportunity, recommendation engine |
| **Schema Intelligence** | Auto-discover table relationships, foreign keys, business glossary |
| **Data Quality** | Health scoring, null detection, duplicate check, outlier detection per table |
| **Query History** | Save, favorite, search, delete query history per user |
| **Row-Level Security** | Region-scoped data access enforced at SQL execution time |
| **Alert Engine** | Configurable KPI thresholds → email (SMTP) + Slack webhook notifications |
| **Scheduled Reports** | Daily/weekly/monthly report execution via APScheduler background jobs |
| **Observability** | API latency, cache hit ratio, error tracking — Prometheus + Grafana |

### Reports & Export
| Format | Contents |
|--------|----------|
| **PDF** | KPI summary + AI insights + recommendations (ReportLab) |
| **CSV** | Raw data export from any query result |
| **Excel** | KPI summary sheet + formatted data sheet (openpyxl) |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Get JWT token |

### Core Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/query/run` | NL → SQL → Execute → Chart |
| POST | `/api/query/generate` | NL → SQL only |
| GET  | `/api/dashboard/kpis` | All KPI metrics (Redis cached) |
| POST | `/api/insights` | Generate AI business insights |
| POST | `/api/forecast` | Revenue/orders forecasting (Prophet) |
| GET  | `/api/anomaly?dataset=all` | Detect anomalies (ecommerce/banking/logistics/all) |
| POST | `/api/reports/generate` | Generate PDF report |
| POST | `/api/reports/export/csv` | Export data as CSV |
| POST | `/api/reports/export/excel` | Export data as Excel |

### Enterprise
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/enterprise/schema/discover` | Discover schema metadata |
| GET  | `/api/enterprise/schema/glossary` | Business glossary |
| POST | `/api/enterprise/query/explain` | Explain SQL query |
| GET  | `/api/enterprise/history/{username}` | Query history |
| GET  | `/api/enterprise/data-quality` | Data health dashboard |
| POST | `/api/enterprise/copilot/ask` | Executive AI copilot |
| GET  | `/api/enterprise/benchmark/mom` | Month-over-Month comparison |
| POST | `/api/enterprise/alerts/evaluate` | Evaluate & trigger alerts |
| GET  | `/api/enterprise/schedules/{username}` | List report schedules |
| POST | `/api/enterprise/rls/apply` | Apply row-level security to SQL |
| GET  | `/api/enterprise/observability/summary` | Platform metrics summary |
| POST | `/api/enterprise/alerts/test-notify` | Test email/Slack notifications |

Full interactive docs: **http://localhost:8080/swagger-ui.html**

---

## Supported Datasets

### E-Commerce
Tables: `customers`, `products`, `orders`, `order_items`, `payments`, `categories`
Analytics: Revenue, CLV, product performance, customer segmentation, cohort analysis

### Banking
Tables: `bank_customers`, `accounts`, `transactions`, `branches`
Analytics: Fraud detection, branch performance, transaction trends, customer profitability

### Logistics
Tables: `shipments`, `drivers`, `routes`, `delivery_events`, `orders`
Analytics: Delivery performance, route efficiency, fleet utilization, shipment delays

---

## Role-Based Access Control

| Role | Dashboard | Query/Insights | Reports | Enterprise | Admin |
|------|-----------|---------------|---------|------------|-------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| ANALYST | ✅ | ✅ | ✅ | ✅ | ❌ |
| VIEWER | ✅ (read-only) | ❌ | ❌ | Schema/Quality only | ❌ |

Row-level security: Region managers automatically see only their region's data.

---

## Deployment

### Docker Compose
```bash
docker compose -f docker/docker-compose.yml up -d
```

### Kubernetes
```bash
# Apply all manifests in order
kubectl apply -f k8s/00-namespace-secrets.yml
kubectl apply -f k8s/01-postgres-redis.yml
kubectl apply -f k8s/02-ai-service.yml
kubectl apply -f k8s/03-backend.yml
kubectl apply -f k8s/04-frontend-ingress.yml
kubectl apply -f k8s/05-monitoring.yml

# Check status
kubectl get pods -n bi-platform
```

> Update `k8s/00-namespace-secrets.yml` with your actual secrets before deploying.
> Replace `YOUR_GITHUB_USER` in image tags with your GitHub username.

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci-cd.yml`):

| Job | Trigger | Steps |
|-----|---------|-------|
| AI Service | Push/PR | Python lint (ruff) + import validation |
| Backend | Push/PR | Maven build + unit tests |
| Frontend | Push/PR | npm install + build |
| Docker | Push to `main` | Build & push all 3 images to GHCR |

---

## Monitoring

- **Prometheus** — scrapes AI service + backend metrics every 15s
- **Grafana** — pre-built dashboard auto-provisioned at startup
  - API request rate, P95 latency, error rate, request duration heatmap
  - Access: http://localhost:3001 (admin / admin123)

---

## Notifications

Configure in `ai-service/.env`:

```env
# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Test via: `POST /api/enterprise/alerts/test-notify`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS, Recharts, React Query |
| Backend | Spring Boot 3, Java 17, Spring Security, JPA |
| AI Layer | Python, FastAPI, OpenAI GPT-4o, LangChain |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Forecasting | Prophet, scikit-learn, NumPy, Pandas |
| Reports | ReportLab (PDF), openpyxl (Excel) |
| Scheduler | APScheduler |
| Monitoring | Prometheus, Grafana |
| Container | Docker, Kubernetes |
| CI/CD | GitHub Actions |
