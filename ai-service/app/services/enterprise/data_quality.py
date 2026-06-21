import os
import json
import pandas as pd
import numpy as np
import redis
from sqlalchemy import create_engine, text
from openai import OpenAI
from typing import Dict, Any

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bi_analytics")
_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DATASET_TABLES = {
    "ecommerce": ["categories", "products", "customers", "orders", "order_items", "payments"],
    "banking": ["bank_customers", "branches", "accounts", "transactions"],
    "logistics": ["drivers", "routes", "shipments", "delivery_events"],
}

DQ_PROMPT = """You are a data quality expert. Given these data quality metrics, generate AI recommendations.

Metrics:
{metrics}

Return JSON:
{{
  "recommendations": ["Fix null values in...", "Remove duplicate records in..."],
  "critical_issues": ["list of critical issues"],
  "health_summary": "2 sentence summary of overall data health"
}}"""


def run_data_quality_check(dataset: str = "ecommerce") -> Dict[str, Any]:
    cache_key = f"dq:{dataset}"
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    engine = create_engine(DATABASE_URL)
    tables = DATASET_TABLES.get(dataset, DATASET_TABLES["ecommerce"])
    table_results = {}
    total_score = 0
    table_count = 0

    for table in tables:
        try:
            with engine.connect() as conn:
                df = pd.read_sql(text(f"SELECT * FROM {table} LIMIT 5000"), conn)
            if df.empty:
                continue

            total_rows = len(df)
            null_stats = {}
            for col in df.columns:
                null_count = int(df[col].isna().sum())
                null_stats[col] = {
                    "null_count": null_count,
                    "null_pct": round(null_count / total_rows * 100, 2) if total_rows > 0 else 0,
                }

            # Duplicate detection
            dup_count = int(df.duplicated().sum())

            # Outlier detection for numeric columns
            outliers = {}
            for col in df.select_dtypes(include=[np.number]).columns:
                z = np.abs((df[col] - df[col].mean()) / (df[col].std() + 1e-9))
                outlier_count = int((z > 3).sum())
                if outlier_count > 0:
                    outliers[col] = outlier_count

            # Completeness: % of non-null cells
            total_cells = total_rows * len(df.columns)
            null_cells = sum(v["null_count"] for v in null_stats.values())
            completeness = round((1 - null_cells / max(total_cells, 1)) * 100, 2)

            # Uniqueness score
            uniqueness = round((1 - dup_count / max(total_rows, 1)) * 100, 2)

            # Overall table health score
            table_score = round((completeness * 0.6 + uniqueness * 0.4), 2)
            total_score += table_score
            table_count += 1

            table_results[table] = {
                "total_rows": total_rows,
                "column_count": len(df.columns),
                "null_stats": null_stats,
                "duplicate_rows": dup_count,
                "outliers": outliers,
                "completeness_pct": completeness,
                "uniqueness_pct": uniqueness,
                "health_score": table_score,
            }
        except Exception as e:
            table_results[table] = {"error": str(e)}

    overall_score = round(total_score / max(table_count, 1), 2)

    metrics_summary = {t: {"health_score": v.get("health_score"), "completeness_pct": v.get("completeness_pct"),
                            "duplicate_rows": v.get("duplicate_rows"), "outliers": v.get("outliers")}
                       for t, v in table_results.items() if "error" not in v}

    try:
        ai_resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": DQ_PROMPT.format(metrics=json.dumps(metrics_summary, indent=2))}],
            temperature=0.2, max_tokens=500, response_format={"type": "json_object"},
        )
        ai_result = json.loads(ai_resp.choices[0].message.content)
    except Exception:
        ai_result = {"recommendations": [], "critical_issues": [], "health_summary": "Analysis unavailable."}

    result = {
        "dataset": dataset,
        "overall_health_score": overall_score,
        "tables": table_results,
        "ai_recommendations": ai_result.get("recommendations", []),
        "critical_issues": ai_result.get("critical_issues", []),
        "health_summary": ai_result.get("health_summary", ""),
    }
    _redis.setex(cache_key, 600, json.dumps(result, default=str))
    return result
