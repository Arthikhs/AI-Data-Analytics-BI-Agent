from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import query, insights, forecast, anomaly, reports, optimizer
from app.routers.enterprise.enterprise_router import router as enterprise_router
from app.routers.agent.agent_router import router as agent_router
from app.services.enterprise.observability import record_metric
from app.services.enterprise.scheduled_reports import run_due_schedules
from prometheus_fastapi_instrumentator import Instrumentator
from apscheduler.schedulers.background import BackgroundScheduler
import time
import uvicorn

app = FastAPI(
    title="AI BI Analytics Service",
    description="NL-to-SQL, Forecasting, Insights, and Anomaly Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router,       prefix="/generate-sql",      tags=["Query"])
app.include_router(query.chart_router, prefix="/suggest-chart",     tags=["Query"])
app.include_router(insights.router,    prefix="/generate-insights",  tags=["Insights"])
app.include_router(forecast.router,    prefix="/forecast",           tags=["Forecast"])
app.include_router(anomaly.router,     prefix="/anomaly",            tags=["Anomaly"])
app.include_router(reports.router,     prefix="/reports",            tags=["Reports"])
app.include_router(enterprise_router,  prefix="/enterprise",         tags=["Enterprise"])
app.include_router(agent_router,        prefix="/agent",               tags=["AI Agent"])
app.include_router(optimizer.router,    prefix="/optimize-query",      tags=["Query Optimizer"])

Instrumentator().instrument(app).expose(app)

# ─── Background scheduler ─────────────────────────────────────────────────────
_scheduler = BackgroundScheduler()
_scheduler.add_job(run_due_schedules, "interval", minutes=1, id="report_scheduler")

@app.on_event("startup")
def startup():
    _scheduler.start()

@app.on_event("shutdown")
def shutdown():
    _scheduler.shutdown(wait=False)

# ─── Observability middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    record_metric("api_latency", elapsed_ms, {"path": request.url.path, "method": request.method})
    return response

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
