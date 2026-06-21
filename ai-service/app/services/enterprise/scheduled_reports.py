import os
import json
import redis
import httpx
from typing import List, Dict, Any
from datetime import datetime, timedelta
import uuid

_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
AI_BASE = os.getenv("AI_SERVICE_URL", "http://localhost:8000")


def get_schedules(username: str) -> List[Dict]:
    raw = _redis.get(f"schedules:{username}")
    return json.loads(raw) if raw else []


def create_schedule(username: str, name: str, frequency: str,
                    report_type: str, recipients: List[str]) -> Dict:
    schedule = {
        "id": str(uuid.uuid4()),
        "name": name,
        "frequency": frequency,
        "report_type": report_type,
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
    delta_map = {"daily": timedelta(days=1), "weekly": timedelta(weeks=1), "monthly": timedelta(days=30)}
    return (datetime.utcnow() + delta_map.get(frequency, timedelta(days=1))).isoformat()


def get_report_downloads(username: str) -> List[Dict]:
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


# ─── Scheduler Execution ─────────────────────────────────────────────────────

def _get_all_usernames() -> List[str]:
    """Scan Redis for all schedule keys to find all registered users."""
    keys = _redis.keys("schedules:*")
    return [k.split(":", 1)[1] for k in keys]


def _execute_report(schedule: Dict) -> bool:
    """Run the report for a schedule entry and record it."""
    report_type = schedule.get("report_type", "kpi")
    username = schedule.get("username", "system")
    title = f"{schedule['name']} — {datetime.utcnow().strftime('%Y-%m-%d')}"

    try:
        # Fetch KPIs from the analytics endpoint
        kpi_resp = httpx.get(f"{AI_BASE}/enterprise/benchmark/mom", timeout=15)
        kpis = kpi_resp.json() if kpi_resp.status_code == 200 else {}

        record_report_generation(username, title, report_type)
        return True
    except Exception as e:
        return False


def run_due_schedules() -> Dict[str, Any]:
    """
    Called by APScheduler every minute.
    Finds all enabled schedules whose next_run is in the past and executes them.
    """
    now = datetime.utcnow()
    executed = []
    errors = []

    for username in _get_all_usernames():
        schedules = get_schedules(username)
        changed = False
        for s in schedules:
            if not s.get("enabled", True):
                continue
            try:
                next_run = datetime.fromisoformat(s["next_run"])
            except (KeyError, ValueError):
                continue

            if next_run <= now:
                success = _execute_report(s)
                if success:
                    s["last_run"] = now.isoformat()
                    s["next_run"] = _calc_next_run(s["frequency"])
                    executed.append({"username": username, "schedule": s["name"]})
                else:
                    errors.append({"username": username, "schedule": s["name"]})
                changed = True

        if changed:
            _redis.set(f"schedules:{username}", json.dumps(schedules))

    return {"executed": len(executed), "errors": len(errors), "details": executed}
