import os
import json
import redis
from typing import List, Dict, Any
from datetime import datetime
import uuid

_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
HISTORY_TTL = 60 * 60 * 24 * 30  # 30 days


def save_query(username: str, question: str, sql: str, dataset: str,
               row_count: int, execution_time_ms: int,
               chart_type: str = "bar", is_favorite: bool = False) -> str:
    entry_id = str(uuid.uuid4())
    entry = {
        "id": entry_id,
        "username": username,
        "question": question,
        "sql": sql,
        "dataset": dataset,
        "row_count": row_count,
        "execution_time_ms": execution_time_ms,
        "chart_type": chart_type,
        "is_favorite": is_favorite,
        "created_at": datetime.utcnow().isoformat(),
    }
    key = f"history:{username}"
    history = get_history(username)
    history.insert(0, entry)
    history = history[:200]  # Keep last 200
    _redis.setex(key, HISTORY_TTL, json.dumps(history))
    return entry_id


def get_history(username: str, limit: int = 50, search: str = "") -> List[Dict]:
    raw = _redis.get(f"history:{username}")
    history: List[Dict] = json.loads(raw) if raw else []
    if search:
        search_lower = search.lower()
        history = [h for h in history if search_lower in h.get("question", "").lower()]
    return history[:limit]


def toggle_favorite(username: str, entry_id: str) -> bool:
    history = get_history(username, limit=200)
    for entry in history:
        if entry["id"] == entry_id:
            entry["is_favorite"] = not entry.get("is_favorite", False)
            break
    _redis.setex(f"history:{username}", HISTORY_TTL, json.dumps(history))
    return True


def get_favorites(username: str) -> List[Dict]:
    history = get_history(username, limit=200)
    return [h for h in history if h.get("is_favorite")]


def delete_history_entry(username: str, entry_id: str) -> bool:
    history = get_history(username, limit=200)
    history = [h for h in history if h["id"] != entry_id]
    _redis.setex(f"history:{username}", HISTORY_TTL, json.dumps(history))
    return True
