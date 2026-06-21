"""
AI Data Agent — Autonomous Analytics Investigation Pipeline

When a metric anomaly is detected, this agent automatically:
1. Detects the anomaly & quantifies the drop/spike
2. Finds affected regions
3. Identifies impacted products/categories
4. Compares historical trends
5. Generates root-cause analysis
6. Suggests specific actions

No user prompting required.
"""
import os
import json
import time
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from openai import OpenAI
from typing import Dict, Any, List, Optional

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bi_analytics")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _engine():
    return create_engine(DATABASE_URL)


# ─── Step 1: Detect trigger metric ───────────────────────────────────────────

def _detect_trigger(dataset: str) -> Dict[str, Any]:
    """Detect the primary anomaly that triggered this investigation."""
    with _engine().connect() as conn:
        if dataset == "ecommerce":
            df = pd.read_sql(text("""
                SELECT DATE_TRUNC('week', order_date) AS period,
                       SUM(total_amount) AS revenue,
                       COUNT(*) AS orders
                FROM orders WHERE status='completed'
                GROUP BY 1 ORDER BY 1 DESC LIMIT 8
            """), conn)
        elif dataset == "banking":
            df = pd.read_sql(text("""
                SELECT DATE_TRUNC('week', txn_date) AS period,
                       COUNT(*) AS transactions,
                       SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) AS fraud_count
                FROM transactions GROUP BY 1 ORDER BY 1 DESC LIMIT 8
            """), conn)
        else:  # logistics
            df = pd.read_sql(text("""
                SELECT DATE_TRUNC('week', shipped_at) AS period,
                       COUNT(*) AS shipments,
                       SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failures
                FROM shipments WHERE shipped_at IS NOT NULL
                GROUP BY 1 ORDER BY 1 DESC LIMIT 8
            """), conn)

    if len(df) < 2:
        return {"triggered": False, "reason": "Insufficient data"}

    df = df.sort_values("period")
    metric_col = "revenue" if dataset == "ecommerce" else ("transactions" if dataset == "banking" else "shipments")
    current = float(df.iloc[-1][metric_col])
    previous = float(df.iloc[-2][metric_col])
    change_pct = ((current - previous) / previous * 100) if previous > 0 else 0

    return {
        "triggered": abs(change_pct) >= 5,  # trigger if >=5% change
        "metric": metric_col,
        "current_value": round(current, 2),
        "previous_value": round(previous, 2),
        "change_pct": round(change_pct, 2),
        "direction": "decline" if change_pct < 0 else "growth",
        "current_period": str(df.iloc[-1]["period"]),
        "previous_period": str(df.iloc[-2]["period"]),
        "history": df[[metric_col]].tail(6).values.flatten().tolist(),
    }


# ─── Step 2: Find affected regions ───────────────────────────────────────────

def _find_affected_regions(dataset: str) -> List[Dict]:
    """Identify which regions are driving the change."""
    with _engine().connect() as conn:
        if dataset == "ecommerce":
            df = pd.read_sql(text("""
                SELECT region,
                       SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '7 days'
                                THEN total_amount ELSE 0 END) AS current_week,
                       SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '14 days'
                                 AND order_date < CURRENT_DATE - INTERVAL '7 days'
                                THEN total_amount ELSE 0 END) AS prev_week
                FROM orders WHERE status='completed'
                  AND order_date >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY region ORDER BY current_week ASC
            """), conn)
        elif dataset == "banking":
            df = pd.read_sql(text("""
                SELECT br.region,
                       COUNT(CASE WHEN t.txn_date >= CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS current_week,
                       COUNT(CASE WHEN t.txn_date >= CURRENT_DATE - INTERVAL '14 days'
                                   AND t.txn_date < CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS prev_week
                FROM transactions t
                JOIN accounts a ON a.account_id = t.account_id
                JOIN branches br ON br.branch_id = a.branch_id
                WHERE t.txn_date >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY br.region ORDER BY current_week ASC
            """), conn)
        else:
            df = pd.read_sql(text("""
                SELECT d.region,
                       COUNT(CASE WHEN s.shipped_at >= CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS current_week,
                       COUNT(CASE WHEN s.shipped_at >= CURRENT_DATE - INTERVAL '14 days'
                                   AND s.shipped_at < CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS prev_week
                FROM shipments s JOIN drivers d ON d.driver_id = s.driver_id
                WHERE s.shipped_at >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY d.region ORDER BY current_week ASC
            """), conn)

    results = []
    for _, row in df.iterrows():
        curr = float(row.get("current_week", 0) or 0)
        prev = float(row.get("prev_week", 0) or 0)
        change = round(((curr - prev) / prev * 100) if prev > 0 else 0, 2)
        results.append({
            "region": row.get("region", "Unknown"),
            "current_week": round(curr, 2),
            "prev_week": round(prev, 2),
            "change_pct": change,
        })

    results.sort(key=lambda x: x["change_pct"])
    return results


# ─── Step 3: Find impacted products/categories ────────────────────────────────

def _find_impacted_products(dataset: str) -> List[Dict]:
    """Identify which products or categories are most impacted."""
    with _engine().connect() as conn:
        if dataset == "ecommerce":
            df = pd.read_sql(text("""
                SELECT cat.category_name AS segment,
                       SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '7 days'
                                THEN oi.amount ELSE 0 END) AS current_week,
                       SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '14 days'
                                 AND o.order_date < CURRENT_DATE - INTERVAL '7 days'
                                THEN oi.amount ELSE 0 END) AS prev_week
                FROM order_items oi
                JOIN orders o ON o.order_id = oi.order_id
                JOIN products p ON p.product_id = oi.product_id
                JOIN categories cat ON cat.category_id = p.category_id
                WHERE o.status='completed'
                  AND o.order_date >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY cat.category_name ORDER BY current_week ASC LIMIT 10
            """), conn)
        elif dataset == "banking":
            df = pd.read_sql(text("""
                SELECT category AS segment,
                       COUNT(CASE WHEN txn_date >= CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS current_week,
                       COUNT(CASE WHEN txn_date >= CURRENT_DATE - INTERVAL '14 days'
                                   AND txn_date < CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS prev_week
                FROM transactions
                WHERE txn_date >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY category ORDER BY current_week ASC LIMIT 10
            """), conn)
        else:
            df = pd.read_sql(text("""
                SELECT r.origin || ' → ' || r.destination AS segment,
                       COUNT(CASE WHEN s.shipped_at >= CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS current_week,
                       COUNT(CASE WHEN s.shipped_at >= CURRENT_DATE - INTERVAL '14 days'
                                   AND s.shipped_at < CURRENT_DATE - INTERVAL '7 days'
                                  THEN 1 END) AS prev_week
                FROM shipments s JOIN routes r ON r.route_id = s.route_id
                WHERE s.shipped_at >= CURRENT_DATE - INTERVAL '14 days'
                GROUP BY segment ORDER BY current_week ASC LIMIT 10
            """), conn)

    results = []
    for _, row in df.iterrows():
        curr = float(row.get("current_week", 0) or 0)
        prev = float(row.get("prev_week", 0) or 0)
        change = round(((curr - prev) / prev * 100) if prev > 0 else 0, 2)
        results.append({
            "segment": str(row.get("segment", "Unknown")),
            "current_week": round(curr, 2),
            "prev_week": round(prev, 2),
            "change_pct": change,
        })

    results.sort(key=lambda x: x["change_pct"])
    return results[:5]


# ─── Step 4: Historical trend comparison ─────────────────────────────────────

def _historical_trend(dataset: str) -> List[Dict]:
    """Get last 8 weeks of the primary metric for trend context."""
    with _engine().connect() as conn:
        if dataset == "ecommerce":
            df = pd.read_sql(text("""
                SELECT TO_CHAR(DATE_TRUNC('week', order_date), 'YYYY-MM-DD') AS week,
                       SUM(total_amount) AS value
                FROM orders WHERE status='completed'
                  AND order_date >= CURRENT_DATE - INTERVAL '56 days'
                GROUP BY 1 ORDER BY 1
            """), conn)
        elif dataset == "banking":
            df = pd.read_sql(text("""
                SELECT TO_CHAR(DATE_TRUNC('week', txn_date), 'YYYY-MM-DD') AS week,
                       COUNT(*) AS value
                FROM transactions
                WHERE txn_date >= CURRENT_DATE - INTERVAL '56 days'
                GROUP BY 1 ORDER BY 1
            """), conn)
        else:
            df = pd.read_sql(text("""
                SELECT TO_CHAR(DATE_TRUNC('week', shipped_at), 'YYYY-MM-DD') AS week,
                       COUNT(*) AS value
                FROM shipments WHERE shipped_at IS NOT NULL
                  AND shipped_at >= CURRENT_DATE - INTERVAL '56 days'
                GROUP BY 1 ORDER BY 1
            """), conn)

    return [{"week": str(r["week"]), "value": round(float(r["value"]), 2)}
            for _, r in df.iterrows()]


# ─── Step 5: GPT-4o Root Cause Analysis ──────────────────────────────────────

_RCA_PROMPT = """You are an elite autonomous AI Data Agent performing a full investigation.

TRIGGER:
{trigger}

AFFECTED REGIONS (week-over-week):
{regions}

IMPACTED SEGMENTS (categories/products/routes):
{segments}

HISTORICAL TREND (last 8 weeks):
{trend}

Perform a deep root-cause analysis and generate a complete autonomous investigation report.

Return JSON:
{{
  "headline": "One-line executive headline (e.g. Revenue declined 12% this week)",
  "severity": "critical | high | medium | low",
  "primary_cause": "The single most likely root cause with evidence",
  "contributing_factors": [
    {{"factor": "name", "impact_pct": 18, "evidence": "specific data point"}}
  ],
  "affected_regions": [
    {{"region": "name", "change_pct": -18, "severity": "high|medium|low"}}
  ],
  "affected_segments": [
    {{"segment": "name", "change_pct": -22, "impact": "description"}}
  ],
  "trend_analysis": "2-3 sentence analysis of the historical trend pattern",
  "recommended_actions": [
    {{"priority": "IMMEDIATE|SHORT_TERM|STRATEGIC", "action": "specific action", "expected_impact": "outcome", "owner": "team/role"}}
  ],
  "investigation_steps": ["step 1 taken", "step 2 taken", "step 3 taken"],
  "confidence_score": 85,
  "executive_summary": "Board-ready 2-3 sentence summary of findings and recommendations"
}}"""


def _generate_rca(trigger: Dict, regions: List, segments: List, trend: List) -> Dict:
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": _RCA_PROMPT.format(
                trigger=json.dumps(trigger, default=str),
                regions=json.dumps(regions[:6], default=str),
                segments=json.dumps(segments[:5], default=str),
                trend=json.dumps(trend[-8:], default=str),
            )}],
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {
            "headline": "Investigation complete — AI analysis unavailable",
            "severity": "medium",
            "primary_cause": "Unable to generate AI analysis at this time.",
            "contributing_factors": [],
            "affected_regions": regions[:3],
            "affected_segments": segments[:3],
            "trend_analysis": "Historical data collected.",
            "recommended_actions": [],
            "investigation_steps": ["Anomaly detected", "Regions analyzed", "Segments analyzed"],
            "confidence_score": 0,
            "executive_summary": "Investigation data collected. AI analysis temporarily unavailable.",
        }


# ─── Main Agent Entry Point ───────────────────────────────────────────────────

def run_agent_investigation(dataset: str = "ecommerce",
                             force: bool = False) -> Dict[str, Any]:
    """
    Full autonomous investigation pipeline.
    Steps: detect → regions → products → trend → RCA → actions
    """
    start_time = time.perf_counter()
    steps_completed = []

    # Step 1: Detect trigger
    trigger = _detect_trigger(dataset)
    steps_completed.append("anomaly_detection")

    if not trigger.get("triggered") and not force:
        return {
            "triggered": False,
            "dataset": dataset,
            "message": f"No significant anomaly detected. {trigger.get('metric', 'Metric')} "
                       f"changed by {trigger.get('change_pct', 0):.1f}% (threshold: ±5%)",
            "trigger": trigger,
        }

    # Step 2: Affected regions
    regions = _find_affected_regions(dataset)
    steps_completed.append("region_analysis")

    # Step 3: Impacted products/segments
    segments = _find_impacted_products(dataset)
    steps_completed.append("segment_analysis")

    # Step 4: Historical trend
    trend = _historical_trend(dataset)
    steps_completed.append("trend_comparison")

    # Step 5: GPT-4o Root Cause Analysis
    rca = _generate_rca(trigger, regions, segments, trend)
    steps_completed.append("root_cause_analysis")

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

    return {
        "triggered": True,
        "dataset": dataset,
        "steps_completed": steps_completed,
        "investigation_time_ms": elapsed_ms,
        "trigger": trigger,
        "region_analysis": regions,
        "segment_analysis": segments,
        "historical_trend": trend,
        "root_cause_analysis": rca,
        # Convenience top-level fields from RCA
        "headline": rca.get("headline", ""),
        "severity": rca.get("severity", "medium"),
        "primary_cause": rca.get("primary_cause", ""),
        "recommended_actions": rca.get("recommended_actions", []),
        "executive_summary": rca.get("executive_summary", ""),
        "confidence_score": rca.get("confidence_score", 0),
    }
