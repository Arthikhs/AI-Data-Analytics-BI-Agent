from fastapi import APIRouter, Query, Header, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.services.enterprise.schema_intelligence import discover_schema, generate_business_glossary
from app.services.enterprise.sql_explainer import explain_sql
from app.services.enterprise.query_history import (
    save_query, get_history, toggle_favorite, get_favorites, delete_history_entry
)
from app.services.enterprise.data_quality import run_data_quality_check
from app.services.enterprise.copilot_service import ask_copilot, generate_executive_briefing
from app.services.enterprise.benchmarking import (
    mom_comparison, qoq_comparison, yoy_comparison, region_comparison, segment_comparison
)
from app.services.enterprise.alert_engine import (
    get_alert_rules, save_alert_rules, evaluate_alerts,
    get_alert_notifications, mark_alerts_read
)
from app.services.enterprise.scheduled_reports import (
    get_schedules, create_schedule, update_schedule,
    delete_schedule, get_report_downloads, record_report_generation
)
from app.services.enterprise.rls_service import (
    get_policy, save_policy, can_access_dataset, mask_columns, get_all_policies
)
from app.services.enterprise.observability import (
    get_platform_summary, get_metrics, record_metric
)

router = APIRouter()


# ─── Feature 1: Schema Intelligence ───────────────────────────────────────────

@router.get("/schema/discover")
def schema_discover(dataset: str = Query("ecommerce")):
    return discover_schema(dataset)


@router.get("/schema/glossary")
def schema_glossary(dataset: str = Query("ecommerce")):
    return generate_business_glossary(dataset)


# ─── Feature 2: SQL Explanation ───────────────────────────────────────────────

class SqlExplainRequest(BaseModel):
    sql: str
    execution_time_ms: int = 0
    row_count: int = 0


@router.post("/query/explain")
def query_explain(req: SqlExplainRequest):
    return explain_sql(req.sql, req.execution_time_ms, req.row_count)


# ─── Feature 3: Query History ─────────────────────────────────────────────────

class SaveQueryRequest(BaseModel):
    username: str
    question: str
    sql: str
    dataset: str
    row_count: int = 0
    execution_time_ms: int = 0
    chart_type: str = "bar"


@router.post("/history/save")
def history_save(req: SaveQueryRequest):
    entry_id = save_query(req.username, req.question, req.sql, req.dataset,
                          req.row_count, req.execution_time_ms, req.chart_type)
    return {"id": entry_id}


@router.get("/history/{username}")
def history_get(username: str, limit: int = Query(50), search: str = Query("")):
    return {"history": get_history(username, limit, search)}


@router.post("/history/{username}/favorite/{entry_id}")
def history_favorite(username: str, entry_id: str):
    toggle_favorite(username, entry_id)
    return {"ok": True}


@router.get("/history/{username}/favorites")
def history_favorites(username: str):
    return {"favorites": get_favorites(username)}


@router.delete("/history/{username}/{entry_id}")
def history_delete(username: str, entry_id: str):
    delete_history_entry(username, entry_id)
    return {"ok": True}


# ─── Feature 4: Data Quality ──────────────────────────────────────────────────

@router.get("/data-quality")
def data_quality(dataset: str = Query("ecommerce")):
    return run_data_quality_check(dataset)


# ─── Feature 5: Executive Copilot ─────────────────────────────────────────────

class CopilotRequest(BaseModel):
    question: str
    context: Dict[str, Any] = {}


@router.post("/copilot/ask")
def copilot_ask(req: CopilotRequest):
    return ask_copilot(req.question, req.context)


@router.post("/copilot/briefing")
def copilot_briefing(body: Dict[str, Any]):
    return generate_executive_briefing(body)


# ─── Feature 6: Benchmarking ──────────────────────────────────────────────────

@router.get("/benchmark/mom")
def benchmark_mom(region: Optional[str] = Query(None)):
    return mom_comparison(region)


@router.get("/benchmark/qoq")
def benchmark_qoq(region: Optional[str] = Query(None)):
    return qoq_comparison(region)


@router.get("/benchmark/yoy")
def benchmark_yoy():
    return yoy_comparison()


@router.get("/benchmark/region")
def benchmark_region(date_from: Optional[str] = Query(None), date_to: Optional[str] = Query(None)):
    return region_comparison(date_from, date_to)


@router.get("/benchmark/segment")
def benchmark_segment(date_from: Optional[str] = Query(None), date_to: Optional[str] = Query(None)):
    return segment_comparison(date_from, date_to)


# ─── Feature 7: Alerts ────────────────────────────────────────────────────────

class EvaluateAlertsRequest(BaseModel):
    kpis: Dict[str, Any]
    anomaly_count: int = 0
    username: str = "default"


class AlertRulesRequest(BaseModel):
    username: str
    rules: List[Dict[str, Any]]


@router.post("/alerts/evaluate")
def alerts_evaluate(req: EvaluateAlertsRequest):
    triggered = evaluate_alerts(req.kpis, req.anomaly_count, req.username)
    return {"triggered": triggered, "count": len(triggered)}


@router.get("/alerts/notifications/{username}")
def alerts_notifications(username: str, unread_only: bool = Query(False)):
    return {"notifications": get_alert_notifications(username, unread_only)}


@router.get("/alerts/rules/{username}")
def alerts_get_rules(username: str):
    return {"rules": get_alert_rules(username)}


@router.post("/alerts/rules")
def alerts_save_rules(req: AlertRulesRequest):
    save_alert_rules(req.username, req.rules)
    return {"ok": True}


class MarkReadRequest(BaseModel):
    username: str
    notification_ids: List[str]


@router.post("/alerts/mark-read")
def alerts_mark_read(req: MarkReadRequest):
    mark_alerts_read(req.username, req.notification_ids)
    return {"ok": True}


# ─── Feature 8: Scheduled Reports ─────────────────────────────────────────────

class CreateScheduleRequest(BaseModel):
    username: str
    name: str
    frequency: str       # daily | weekly | monthly
    report_type: str     # kpi | executive | forecast | health
    recipients: List[str] = []


class UpdateScheduleRequest(BaseModel):
    username: str
    schedule_id: str
    updates: Dict[str, Any]


@router.get("/schedules/{username}")
def schedules_list(username: str):
    return {"schedules": get_schedules(username)}


@router.post("/schedules")
def schedules_create(req: CreateScheduleRequest):
    schedule = create_schedule(req.username, req.name, req.frequency,
                               req.report_type, req.recipients)
    return schedule


@router.put("/schedules")
def schedules_update(req: UpdateScheduleRequest):
    update_schedule(req.username, req.schedule_id, req.updates)
    return {"ok": True}


@router.delete("/schedules/{username}/{schedule_id}")
def schedules_delete(username: str, schedule_id: str):
    delete_schedule(username, schedule_id)
    return {"ok": True}


@router.get("/schedules/{username}/downloads")
def report_downloads(username: str):
    return {"downloads": get_report_downloads(username)}


class RecordReportRequest(BaseModel):
    username: str
    title: str
    report_type: str


@router.post("/schedules/record-report")
def record_report(req: RecordReportRequest):
    return record_report_generation(req.username, req.title, req.report_type)


# ─── Feature 9: Row-Level Security ────────────────────────────────────────────

class RlsPolicyRequest(BaseModel):
    role: str
    policy: Dict[str, Any]


class ApplyRlsRequest(BaseModel):
    sql: str
    role: str


class MaskRequest(BaseModel):
    data: List[Dict[str, Any]]
    role: str


@router.get("/rls/policies")
def rls_list_policies():
    return {"policies": get_all_policies()}


@router.get("/rls/policy/{role}")
def rls_get_policy(role: str):
    return get_policy(role)


@router.post("/rls/policy")
def rls_save_policy(req: RlsPolicyRequest):
    save_policy(req.role, req.policy)
    return {"ok": True}


@router.get("/rls/access")
def rls_check_access(role: str = Query(...), dataset: str = Query(...)):
    return {"allowed": can_access_dataset(role, dataset)}


@router.post("/rls/mask")
def rls_mask_columns(req: MaskRequest):
    return {"data": mask_columns(req.data, req.role)}


# ─── Feature 10: Observability ────────────────────────────────────────────────

@router.get("/observability/summary")
def obs_summary():
    return get_platform_summary()


@router.get("/observability/metrics/{metric_type}")
def obs_metrics(metric_type: str, limit: int = Query(100)):
    return {"metric": metric_type, "data": get_metrics(metric_type, limit)}


class RecordMetricRequest(BaseModel):
    metric_type: str
    value: float
    labels: Dict[str, str] = {}


@router.post("/observability/record")
def obs_record(req: RecordMetricRequest):
    record_metric(req.metric_type, req.value, req.labels)
    return {"ok": True}
