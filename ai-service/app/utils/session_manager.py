import os
import redis
import json
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
SESSION_TTL = 3600  # 1 hour


def get_session_history(session_id: str) -> List[Dict]:
    """Returns the conversation history for a session."""
    if not session_id:
        return []
    raw = _redis.get(f"session:{session_id}")
    return json.loads(raw) if raw else []


def append_to_session(session_id: str, question: str, sql: str):
    """Appends a Q&A turn to session history."""
    if not session_id:
        return
    history = get_session_history(session_id)
    history.append({"question": question, "sql": sql})
    # Keep last 10 turns only
    history = history[-10:]
    _redis.setex(f"session:{session_id}", SESSION_TTL, json.dumps(history))


def format_history(history: List[Dict]) -> str:
    if not history:
        return "No prior context."
    lines = []
    for turn in history:
        lines.append(f"Q: {turn['question']}")
        lines.append(f"SQL: {turn['sql']}")
    return "\n".join(lines)
