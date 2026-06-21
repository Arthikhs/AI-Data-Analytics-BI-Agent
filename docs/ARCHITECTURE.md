# Architecture Deep-Dive

## System Overview

```
Browser (React + TypeScript)
    │  JWT in sessionStorage
    ▼
Nginx (port 80/3000)
    │  proxy /api/* → backend:8080
    ▼
Spring Boot API (port 8080)
    ├── JWT Authentication (JwtAuthFilter)
    ├── Role-Based Access Control (SecurityConfig)
    ├── SQL Validation (QueryValidatorService)
    ├── Redis Cache (@Cacheable on KPIs)
    ├── JdbcTemplate → PostgreSQL (AnalyticsService)
    └── WebClient → AI Service (AiServiceClient, proxies)
    │
    ▼
FastAPI AI Service (port 8000)
    ├── NL→SQL  (GPT-4o + schema context + Redis session memory)
    ├── Insights (GPT-4o JSON mode)
    ├── Forecast (Prophet → linear fallback)
    ├── Anomaly (Z-score, rolling window)
    ├── Reports (ReportLab PDF, openpyxl Excel, CSV)
    ├── Enterprise (schema, history, DQ, copilot, benchmarks,
    │               alerts, schedules, RLS, observability)
    └── AI Agent (autonomous 5-step investigation pipeline)
    │
    ├── PostgreSQL (port 5432) — 3 schemas, seeded data
    └── Redis (port 6379)      — session, KPI cache, alerts, history
```

---

## Data Flow: NL→SQL Query

```
1. User types question in Chat page
2. POST /api/query/run  (Spring Boot)
3. JwtAuthFilter validates token → sets SecurityContext
4. QueryController calls AiServiceClient.generateSql()
5. POST http://ai-service:8000/generate-sql
6. sql_generator.py:
   a. Loads schema context for dataset
   b. Loads Redis session history (multi-turn memory)
   c. Builds GPT-4o prompt with schema + history + question
   d. GPT-4o returns SQL
   e. Appends Q&A to session
7. SQL returned to Spring Boot
8. QueryExecutionService.executeQuery():
   a. QueryValidatorService.validate() — blocks DML/DDL/injection
   b. applyRls() — calls AI service RLS endpoint if role present
   c. appendLimit() — caps rows at max_rows
   d. JdbcTemplate.queryForList()
9. AiServiceClient.suggestChartType() — rule-based chart selection
10. QueryResponse returned to frontend
11. Frontend renders DynamicChart + data table
12. POST /api/insights (optional) → GPT-4o executive summary
```

---

## Authentication & Authorization

- JWT issued at `/api/auth/login`, valid 24h
- `JwtAuthFilter` validates on every request
- `SecurityConfig` enforces per-endpoint RBAC:
  - `VIEWER` — dashboard read-only, schema/data-quality
  - `ANALYST` — + query, insights, forecast, reports, enterprise
  - `ADMIN` — + RLS policy management, alert rules, all enterprise

---

## Row-Level Security

When `QueryExecutionService` receives a role, it:
1. POSTs `{sql, role}` to `/enterprise/rls/apply`
2. `rls_service.apply_row_level_filter()` reads the role's Redis policy
3. If `region_filter` is set, injects `WHERE region = 'X'` using regex
4. Modified SQL is returned and executed

---

## Forecasting Pipeline

```
ForecastController.forecast()
    → AiServiceClient.forecast()
    → POST /forecast (AI service)
    → forecast_service.forecast_revenue()
        → _load_series() — SQL query per (dataset, metric)
        → Prophet.fit() + make_future_dataframe()
        → fallback: linear trend if Prophet fails or <3 data points
        → _generate_recommendations() — growth/decline/stable message
```

---

## Anomaly Detection

Z-score with 7-day rolling window:
```
z = (value - rolling_mean) / rolling_std
threshold = |z| > 2.5 → anomaly
severity = |z| > 3 → high, else medium
```

Three independent detectors: ecommerce revenue, banking transactions + fraud, logistics failures + delays.

---

## AI Data Agent (Autonomous)

5-step autonomous pipeline, no user prompting:
1. **Anomaly Detection** — weekly metric comparison, triggers if ≥5% change
2. **Region Analysis** — current vs prior week by region
3. **Segment Analysis** — category/product/route breakdown
4. **Historical Trend** — last 8 weeks
5. **Root Cause Analysis** — GPT-4o JSON with headline, causes, actions, confidence score

---

## Caching Strategy

| Data | Cache | TTL |
|------|-------|-----|
| KPIs | Redis (`kpis:{params}`) | 5 min (Spring @Cacheable) |
| Schema metadata | Redis (`schema_meta:{dataset}`) | 30 min |
| Business glossary | Redis (`glossary:{dataset}`) | 1 hour |
| Data quality | Redis (`dq:{dataset}`) | 10 min |
| Session history | Redis (`session:{id}`) | 1 hour |
| Query history | Redis (`history:{user}`) | 30 days |
| Alerts | Redis (`alerts:{user}`) | 24 hours |

---

## Observability

- **Prometheus** scrapes AI service `/metrics` (FastAPI instrumentator) and backend `/actuator/prometheus` (Micrometer) every 15s
- **Custom metrics** recorded via `observability.py`: `api_latency`, `sql_latency`, `ai_latency`, `forecast_latency`, `errors`, `cache_hits/misses`
- **Grafana** auto-provisions from `/docker/grafana/provisioning/` at startup
