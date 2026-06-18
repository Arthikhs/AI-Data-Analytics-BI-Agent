from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import query, insights, forecast, anomaly, reports
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

app.include_router(query.router,    prefix="/generate-sql",      tags=["Query"])
app.include_router(query.chart_router, prefix="/suggest-chart",  tags=["Query"])
app.include_router(insights.router, prefix="/generate-insights", tags=["Insights"])
app.include_router(forecast.router, prefix="/forecast",          tags=["Forecast"])
app.include_router(anomaly.router,  prefix="/anomaly",           tags=["Anomaly"])
app.include_router(reports.router,  prefix="/reports",           tags=["Reports"])

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
