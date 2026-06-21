from fastapi import APIRouter, Query
from app.services.anomaly_service import detect_anomalies

router = APIRouter()

@router.get("")
def anomaly_detection(dataset: str = Query("all", description="ecommerce | banking | logistics | all")):
    return detect_anomalies(dataset)
