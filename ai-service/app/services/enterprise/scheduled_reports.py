import os
import json
import redis
from typing import List, Dict, Any
from datetime import datetime
import uuid

_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)


def get_schedules(username: str) -> List[Dict]:
    raw = _redis.get(f"schedules:{username}")
    return json.loads(raw) if raw else []


def create_schedule(username: str, name: str, frequency: str,
                    report_type: str, recipients: List[str]) -> Dict:
    schedule = {
        "id": str(uuid.uuid4()),
        "name": name,
        "frequency": frequency,         # daily | weekly | monthly
        "report_type": report_type,     # kpi | executive | forecast | health
        "recipients": recipients,
        "enabled": True,
        "created_at": datetime.utcnow().isoformat(),
        "last_run": None,
        "next_run": _calc_next_run(frequency),
        "username": username,
    }
    schedules = get_schedules(username)
    schedules.append(schedule)
    _redis.set(f"schedules:{username}", json.dumps(schedules))
    return schedule


def update_schedule(username: str, schedule_id: str, updates: Dict) -> bool:
    schedules = get_schedules(username)
    for s in schedules:
        if s["id"] == schedule_id:
            s.update(updates)
            break
    _redis.set(f"schedules:{username}", json.dumps(schedules))
    return True


def delete_schedule(username: str, schedule_id: str) -> bool:
    schedules = [s for s in get_schedules(username) if s["id"] != schedule_id]
    _redis.set(f"schedules:{username}", json.dumps(schedules))
    return True


def _calc_next_run(frequency: str) -> str:
    from datetime import timedelta
    now = datetime.utcnow()
    delta_map = {"daily": timedelta(days=1), "weekly": timedelta(weeks=1), "monthly": timedelta(days=30)}
    return (now + delta_map.get(frequency, timedelta(days=1))).isoformat()


def get_report_downloads(username: str) -> List[Dict]:
    """Return list of generated report metadata available for download."""
    raw = _redis.get(f"report_downloads:{username}")
    return json.loads(raw) if raw else []


def record_report_generation(username: str, title: str, report_type: str) -> Dict:
    entry = {
        "id": str(uuid.uuid4()),
        "title": title,
        "report_type": report_type,
        "generated_at": datetime.utcnow().isoformat(),
        "username": username,
    }
    downloads = get_report_downloads(username)
    downloads.insert(0, entry)
    _redis.setex(f"report_downloads:{username}", 86400 * 7, json.dumps(downloads[:50]))
    return entry
