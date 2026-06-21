import os
import json
import redis
from typing import List, Dict, Any
from datetime import datetime
import uuid

_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)

DEFAULT_RULES = [
    {"id": "rev_drop", "name": "Revenue Drop", "metric": "revenue_growth_pct",
     "condition": "lt", "threshold": -20, "severity": "critical",
     "message": "Revenue has dropped more than 20% vs prior period"},
    {"id": "rev_spike", "name": "Revenue Spike", "metric": "revenue_growth_pct",
     "condition": "gt", "threshold": 30, "severity": "info",
     "message": "Revenue spike detected — above 30% growth"},
    {"id": "low_orders", "name": "Low Order Volume", "metric": "total_orders",
     "condition": "lt", "threshold": 5, "severity": "warning",
     "message": "Total completed orders are unusually low"},
    {"id": "high_anomaly", "name": "High Anomaly Count", "metric": "anomaly_count",
     "condition": "gt", "threshold": 3, "severity": "warning",
     "message": "Multiple anomalies detected in revenue data"},
]


def get_alert_rules(username: str = "default") -> List[Dict]:
    raw = _redis.get(f"alert_rules:{username}")
    return json.loads(raw) if raw else DEFAULT_RULES


def save_alert_rules(username: str, rules: List[Dict]) -> bool:
    _redis.set(f"alert_rules:{username}", json.dumps(rules))
    return True


def evaluate_alerts(kpis: Dict[str, Any], anomaly_count: int = 0,
                    username: str = "default") -> List[Dict]:
    rules = get_alert_rules(username)
    triggered = []

    metric_map = {
        "revenue_growth_pct": kpis.get("revenueGrowthPct", 0),
        "total_orders": kpis.get("totalOrders", 0),
        "total_revenue": kpis.get("totalRevenue", 0),
        "churn_rate": kpis.get("churnRate", 0) * 100,
        "anomaly_count": anomaly_count,
    }

    for rule in rules:
        if not rule.get("enabled", True):
            continue
        value = metric_map.get(rule["metric"])
        if value is None:
            continue

        condition = rule["condition"]
        threshold = rule["threshold"]
        fired = (
            (condition == "gt" and value > threshold) or
            (condition == "lt" and value < threshold) or
            (condition == "eq" and value == threshold)
        )

        if fired:
            triggered.append({
                "id": rule["id"],
                "name": rule["name"],
                "severity": rule["severity"],
                "message": rule["message"],
                "actual_value": round(float(value), 2),
                "threshold": threshold,
                "condition": condition,
                "triggered_at": datetime.utcnow().isoformat(),
            })

    # Store triggered alerts in Redis
    if triggered:
        existing_raw = _redis.get(f"alerts:{username}")
        existing = json.loads(existing_raw) if existing_raw else []
        for alert in triggered:
            alert["notification_id"] = str(uuid.uuid4())
            existing.insert(0, alert)
        _redis.setex(f"alerts:{username}", 86400, json.dumps(existing[:100]))

    return triggered


def get_alert_notifications(username: str = "default", unread_only: bool = False) -> List[Dict]:
    raw = _redis.get(f"alerts:{username}")
    alerts = json.loads(raw) if raw else []
    if unread_only:
        alerts = [a for a in alerts if not a.get("read", False)]
    return alerts


def mark_alerts_read(username: str, notification_ids: List[str]) -> bool:
    raw = _redis.get(f"alerts:{username}")
    alerts = json.loads(raw) if raw else []
    id_set = set(notification_ids)
    for a in alerts:
        if a.get("notification_id") in id_set:
            a["read"] = True
    _redis.setex(f"alerts:{username}", 86400, json.dumps(alerts))
    return True
