import os
import json
import re
import redis
from typing import Dict, Any, Optional

_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)

# Default policies — override per deployment
DEFAULT_POLICIES: Dict[str, Dict] = {
    "ROLE_ADMIN":   {"datasets": ["ecommerce", "banking", "logistics"], "region_filter": None, "column_masks": []},
    "ROLE_ANALYST": {"datasets": ["ecommerce", "banking", "logistics"], "region_filter": None, "column_masks": ["email", "phone"]},
    "ROLE_VIEWER":  {"datasets": ["ecommerce"], "region_filter": None, "column_masks": ["email", "phone", "balance"]},
    # Region-scoped example
    "ROLE_SOUTH_MANAGER": {"datasets": ["ecommerce"], "region_filter": "South", "column_masks": []},
    "ROLE_NORTH_MANAGER": {"datasets": ["ecommerce"], "region_filter": "North", "column_masks": []},
}

REGION_TABLES = {"orders": "region", "customers": "region", "branches": "region", "drivers": "region"}


def get_policy(role: str) -> Dict[str, Any]:
    cached = _redis.get(f"rls_policy:{role}")
    if cached:
        return json.loads(cached)
    return DEFAULT_POLICIES.get(role, DEFAULT_POLICIES["ROLE_VIEWER"])


def save_policy(role: str, policy: Dict) -> bool:
    _redis.set(f"rls_policy:{role}", json.dumps(policy))
    return True


def apply_row_level_filter(sql: str, role: str) -> str:
    """Inject region-based WHERE filter into SELECT queries."""
    policy = get_policy(role)
    region_filter = policy.get("region_filter")
    if not region_filter:
        return sql  # Admin / no restriction

    # Find which tables in the query support region filtering
    injected_conditions = []
    for table, col in REGION_TABLES.items():
        pattern = rf'\b{re.escape(table)}\b'
        if re.search(pattern, sql, re.I):
            # Check for alias usage (e.g. "orders o")
            alias_match = re.search(rf'\b{re.escape(table)}\s+(\w+)\b', sql, re.I)
            prefix = alias_match.group(1) if alias_match else table
            injected_conditions.append(f"{prefix}.{col} = '{region_filter}'")

    if not injected_conditions:
        return sql

    condition_str = " AND ".join(injected_conditions)
    where_match = re.search(r'\bWHERE\b', sql, re.I)
    if where_match:
        insert_pos = where_match.end()
        return sql[:insert_pos] + f" {condition_str} AND " + sql[insert_pos:]
    else:
        # Insert before GROUP BY / ORDER BY / LIMIT or at end
        for keyword in ["GROUP BY", "ORDER BY", "LIMIT", "HAVING"]:
            kw_match = re.search(rf'\b{keyword}\b', sql, re.I)
            if kw_match:
                return sql[:kw_match.start()] + f" WHERE {condition_str} " + sql[kw_match.start():]
        return sql.rstrip(";") + f" WHERE {condition_str}"


def can_access_dataset(role: str, dataset: str) -> bool:
    policy = get_policy(role)
    return dataset in policy.get("datasets", [])


def mask_columns(data: list, role: str) -> list:
    """Mask sensitive columns in query results based on role policy."""
    policy = get_policy(role)
    masks = [c.lower() for c in policy.get("column_masks", [])]
    if not masks:
        return data
    masked_data = []
    for row in data:
        masked_row = {}
        for k, v in row.items():
            masked_row[k] = "***" if k.lower() in masks else v
        masked_data.append(masked_row)
    return masked_data


def get_all_policies() -> Dict:
    return DEFAULT_POLICIES
