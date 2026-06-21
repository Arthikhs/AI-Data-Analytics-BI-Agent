from fastapi import APIRouter
from app.models.schemas import ForecastRequest, ForecastResponse
from app.services.forecast_service import forecast_revenue

router = APIRouter()

@router.post("", response_model=ForecastResponse)
def forecast(request: ForecastRequest):
    return forecast_revenue(request.periods, request.dataset, request.metric)
