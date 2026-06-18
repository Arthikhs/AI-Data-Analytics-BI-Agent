from fastapi import APIRouter
from app.models.schemas import QueryRequest, SqlResponse, ChartRequest, ChartResponse
from app.services.sql_generator import generate_sql, suggest_chart_type
import uuid

router = APIRouter()
chart_router = APIRouter()


@router.post("", response_model=SqlResponse)
def nl_to_sql(request: QueryRequest):
    session_id = request.session_id or str(uuid.uuid4())
    sql = generate_sql(request.question, request.dataset, session_id)
    return SqlResponse(sql=sql, session_id=session_id)


@chart_router.post("", response_model=ChartResponse)
def chart_suggestion(request: ChartRequest):
    chart_type = suggest_chart_type(request.question, request.columns)
    return ChartResponse(chart_type=chart_type)
