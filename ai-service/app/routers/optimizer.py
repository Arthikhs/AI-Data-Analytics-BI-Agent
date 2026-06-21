from fastapi import APIRouter
from pydantic import BaseModel
from app.services.query_optimizer import optimize_query

router = APIRouter()


class OptimizeRequest(BaseModel):
    sql: str


@router.post("")
def optimizer(req: OptimizeRequest):
    return optimize_query(req.sql)
