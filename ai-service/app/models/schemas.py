from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class QueryRequest(BaseModel):
    question: str
    dataset: str = "ecommerce"
    session_id: str = ""

class SqlResponse(BaseModel):
    sql: str
    session_id: str

class ChartRequest(BaseModel):
    question: str
    columns: List[str]

class ChartResponse(BaseModel):
    chart_type: str  # line | bar | pie | scatter | area | heatmap

class InsightRequest(BaseModel):
    question: str
    data: List[Dict[str, Any]]

class InsightResponse(BaseModel):
    summary: str
    keyFindings: List[str]
    growthDrivers: List[str]
    risks: List[str]
    opportunities: List[str]
    recommendations: List[str]

class ForecastRequest(BaseModel):
    metric: str = "revenue"
    dataset: str = "ecommerce"
    periods: int = 30

class ForecastPoint(BaseModel):
    date: str
    value: float
    lower: float
    upper: float

class ForecastResponse(BaseModel):
    metric: str
    forecast: List[ForecastPoint]
    model_used: str
    recommendations: List[str]
