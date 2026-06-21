from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.services.agent.data_agent import run_agent_investigation

router = APIRouter()


@router.get("/investigate")
def investigate(
    dataset: str = Query("ecommerce", description="ecommerce | banking | logistics"),
    force: bool = Query(False, description="Force investigation even if no anomaly threshold breached"),
):
    """
    Autonomous AI Data Agent — full investigation pipeline.
    Detects anomaly → finds regions → finds segments → trend analysis → root cause → actions.
    """
    return run_agent_investigation(dataset, force)


@router.post("/investigate")
def investigate_post(body: dict):
    """POST version — accepts dataset and force in body."""
    return run_agent_investigation(
        dataset=body.get("dataset", "ecommerce"),
        force=body.get("force", False),
    )
