import os
import json
import pandas as pd
from sqlalchemy import create_engine, text
from openai import OpenAI
from typing import Dict, Any, List

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bi_analytics")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BENCHMARK_PROMPT = """You are a business analyst. Explain these variance analytics in business terms.

Data: {data}

Return JSON:
{{
  "trend_explanation": "2-3 sentence explanation of the trend",
  "key_drivers": ["driver 1", "driver 2"],
  "outlook": "positive | neutral | negative",
  "recommendation": "one actionable recommendation"
}}"""


def _engine():
    return create_engine(DATABASE_URL)


def mom_comparison(region: str = None) -> Dict[str, Any]:
    filter_sql = "AND region = :region" if region else ""
    sql = f"""
        SELECT TO_CHAR(DATE_TRUNC('month', order_date), 'YYYY-MM') AS month,
               SUM(total_amount) AS revenue, COUNT(*) AS orders
        FROM orders WHERE status='completed' {filter_sql}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 13
    """
    with _engine().connect() as conn:
        params = {"region": region} if region else {}
        df = pd.read_sql(text(sql), conn, params=params)

    if df.empty:
        return {"periods": [], "variance": []}

    df = df.sort_values("month")
    df["revenue"] = pd.to_numeric(df["revenue"])
    df["revenue_prev"] = df["revenue"].shift(1)
    df["variance_pct"] = ((df["revenue"] - df["revenue_prev"]) / df["revenue_prev"].abs() * 100).round(2)
    rows = df.dropna(subset=["revenue_prev"]).to_dict(orient="records")
    ai = _get_ai_insight(rows, "Month-over-Month")
    return {"comparison_type": "MoM", "periods": rows, "insight": ai}


def qoq_comparison(region: str = None) -> Dict[str, Any]:
    filter_sql = "AND region = :region" if region else ""
    sql = f"""
        SELECT CONCAT(EXTRACT(year FROM order_date)::TEXT, '-Q',
               EXTRACT(quarter FROM order_date)::TEXT) AS quarter,
               SUM(total_amount) AS revenue, COUNT(*) AS orders
        FROM orders WHERE status='completed' {filter_sql}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 8
    """
    with _engine().connect() as conn:
        params = {"region": region} if region else {}
        df = pd.read_sql(text(sql), conn, params=params)

    if df.empty:
        return {"periods": [], "variance": []}

    df = df.sort_values("quarter")
    df["revenue"] = pd.to_numeric(df["revenue"])
    df["revenue_prev"] = df["revenue"].shift(1)
    df["variance_pct"] = ((df["revenue"] - df["revenue_prev"]) / df["revenue_prev"].abs() * 100).round(2)
    rows = df.dropna(subset=["revenue_prev"]).to_dict(orient="records")
    ai = _get_ai_insight(rows, "Quarter-over-Quarter")
    return {"comparison_type": "QoQ", "periods": rows, "insight": ai}


def yoy_comparison() -> Dict[str, Any]:
    sql = """
        SELECT EXTRACT(year FROM order_date)::INT AS year,
               SUM(total_amount) AS revenue, COUNT(*) AS orders
        FROM orders WHERE status='completed'
        GROUP BY 1 ORDER BY 1
    """
    with _engine().connect() as conn:
        df = pd.read_sql(text(sql), conn)

    if df.empty:
        return {"periods": [], "variance": []}

    df["revenue"] = pd.to_numeric(df["revenue"])
    df["revenue_prev"] = df["revenue"].shift(1)
    df["variance_pct"] = ((df["revenue"] - df["revenue_prev"]) / df["revenue_prev"].abs() * 100).round(2)
    rows = df.dropna(subset=["revenue_prev"]).to_dict(orient="records")
    ai = _get_ai_insight(rows, "Year-over-Year")
    return {"comparison_type": "YoY", "periods": rows, "insight": ai}


def region_comparison(date_from: str = None, date_to: str = None) -> Dict[str, Any]:
    date_filter = ""
    params: Dict = {}
    if date_from:
        date_filter += " AND order_date >= :date_from"
        params["date_from"] = date_from
    if date_to:
        date_filter += " AND order_date <= :date_to"
        params["date_to"] = date_to

    sql = f"""
        SELECT region, SUM(total_amount) AS revenue, COUNT(*) AS orders,
               AVG(total_amount) AS avg_order_value
        FROM orders WHERE status='completed' {date_filter}
        GROUP BY region ORDER BY revenue DESC
    """
    with _engine().connect() as conn:
        df = pd.read_sql(text(sql), conn, params=params)

    rows = df.to_dict(orient="records")
    total = sum(r["revenue"] for r in rows) or 1
    for r in rows:
        r["revenue_share_pct"] = round(r["revenue"] / total * 100, 2)
        r["revenue"] = round(float(r["revenue"]), 2)
        r["avg_order_value"] = round(float(r["avg_order_value"]), 2)

    ai = _get_ai_insight(rows, "Region Comparison")
    return {"comparison_type": "Region", "data": rows, "insight": ai}


def segment_comparison(date_from: str = None, date_to: str = None) -> Dict[str, Any]:
    date_filter = ""
    params: Dict = {}
    if date_from:
        date_filter += " AND o.order_date >= :date_from"
        params["date_from"] = date_from
    if date_to:
        date_filter += " AND o.order_date <= :date_to"
        params["date_to"] = date_to

    sql = f"""
        SELECT c.segment, COUNT(DISTINCT c.customer_id) AS customers,
               SUM(o.total_amount) AS revenue,
               AVG(o.total_amount) AS avg_order_value,
               COUNT(o.order_id) AS total_orders
        FROM orders o JOIN customers c ON c.customer_id = o.customer_id
        WHERE o.status='completed' {date_filter}
        GROUP BY c.segment ORDER BY revenue DESC
    """
    with _engine().connect() as conn:
        df = pd.read_sql(text(sql), conn, params=params)

    rows = df.to_dict(orient="records")
    for r in rows:
        r["revenue"] = round(float(r["revenue"]), 2)
        r["avg_order_value"] = round(float(r["avg_order_value"]), 2)
    ai = _get_ai_insight(rows, "Customer Segment Comparison")
    return {"comparison_type": "Segment", "data": rows, "insight": ai}


def _get_ai_insight(data: List, comparison_type: str) -> Dict:
    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": BENCHMARK_PROMPT.format(
                data=json.dumps(data[:8], default=str)
            )}],
            temperature=0.2, max_tokens=300,
            response_format={"type": "json_object"},
        )
        return json.loads(resp.choices[0].message.content)
    except Exception:
        return {"trend_explanation": "Analysis unavailable.", "key_drivers": [], "outlook": "neutral", "recommendation": ""}
