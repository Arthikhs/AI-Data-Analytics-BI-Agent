from fastapi import APIRouter
from app.models.schemas import InsightRequest, InsightResponse
from app.services.insight_service import generate_insights

router = APIRouter()

@router.post("", response_model=InsightResponse)
def insights(request: InsightRequest):
    return generate_insights(request.question, request.data)
