from fastapi import APIRouter
from app.models.schemas import ForecastRequest, ForecastResponse
from app.services.forecast_service import forecast_revenue

router = APIRouter()

@router.post("", response_model=ForecastResponse)
def forecast(request: ForecastRequest):
    # Extend to support other metrics (orders, customers) as needed
    return forecast_revenue(request.periods)
