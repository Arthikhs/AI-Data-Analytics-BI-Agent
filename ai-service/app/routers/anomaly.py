from fastapi import APIRouter
from app.services.anomaly_service import detect_anomalies

router = APIRouter()

@router.get("")
def anomaly_detection():
    return detect_anomalies()
