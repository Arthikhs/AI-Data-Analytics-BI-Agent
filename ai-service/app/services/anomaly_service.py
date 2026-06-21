import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from typing import List, Dict, Any

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bi_analytics")


def _engine():
    return create_engine(DATABASE_URL)


def _zscore_anomalies(df: pd.DataFrame, date_col: str, value_col: str,
                      anomaly_type_spike: str, anomaly_type_drop: str,
                      rec_spike: str, rec_drop: str) -> List[Dict]:
    """Reusable Z-score anomaly detection on any time-series dataframe."""
    if len(df) < 7:
        return []
    df = df.copy().sort_values(date_col)
    df['rolling_mean'] = df[value_col].rolling(7, min_periods=1).mean()
    df['rolling_std'] = df[value_col].rolling(7, min_periods=1).std().fillna(0)
    df['z_score'] = np.where(
        df['rolling_std'] > 0,
        (df[value_col] - df['rolling_mean']) / df['rolling_std'],
        0
    )
    results = []
    for _, row in df[df['z_score'].abs() > 2.5].iterrows():
        direction = "spike" if row['z_score'] > 0 else "drop"
        results.append({
            "date": str(row[date_col]),
            "dataset": "",  # filled by caller
            "type": anomaly_type_spike if direction == "spike" else anomaly_type_drop,
            "actual": round(float(row[value_col]), 2),
            "expected": round(float(row['rolling_mean']), 2),
            "z_score": round(float(row['z_score']), 2),
            "severity": "high" if abs(row['z_score']) > 3 else "medium",
            "recommendation": rec_spike if direction == "spike" else rec_drop,
        })
    return results


# ─── E-Commerce ───────────────────────────────────────────────────────────────

def _ecommerce_anomalies() -> List[Dict]:
    with _engine().connect() as conn:
        df = pd.read_sql(text("""
            SELECT order_date AS date, SUM(total_amount) AS value
            FROM orders WHERE status='completed'
            GROUP BY order_date ORDER BY order_date
        """), conn)
    items = _zscore_anomalies(
        df, 'date', 'value',
        'Revenue Spike', 'Revenue Drop',
        'Investigate marketing campaigns or promotions driving the spike.',
        'Review operational issues, cancellations, or system downtime.'
    )
    for i in items:
        i['dataset'] = 'ecommerce'
    return items


# ─── Banking ─────────────────────────────────────────────────────────────────

def _banking_anomalies() -> List[Dict]:
    anomalies = []
    with _engine().connect() as conn:
        # Daily transaction volume
        df_vol = pd.read_sql(text("""
            SELECT DATE(txn_date) AS date, COUNT(*) AS value
            FROM transactions GROUP BY 1 ORDER BY 1
        """), conn)
        # Daily fraud count
        df_fraud = pd.read_sql(text("""
            SELECT DATE(txn_date) AS date, COUNT(*) AS value
            FROM transactions WHERE is_fraud = TRUE GROUP BY 1 ORDER BY 1
        """), conn)

    vol_items = _zscore_anomalies(
        df_vol, 'date', 'value',
        'Transaction Volume Spike', 'Transaction Volume Drop',
        'Unusual surge in transactions — check for system duplication or fraud wave.',
        'Low transaction volume — investigate system downtime or data pipeline issues.'
    )
    for i in vol_items:
        i['dataset'] = 'banking'
    anomalies.extend(vol_items)

    fraud_items = _zscore_anomalies(
        df_fraud, 'date', 'value',
        'Fraud Spike', 'Fraud Drop',
        'Significant fraud spike detected — escalate to fraud prevention team immediately.',
        'Fraud activity below baseline — verify detection systems are operational.'
    )
    for i in fraud_items:
        i['dataset'] = 'banking'
    anomalies.extend(fraud_items)
    return anomalies


# ─── Logistics ────────────────────────────────────────────────────────────────

def _logistics_anomalies() -> List[Dict]:
    anomalies = []
    with _engine().connect() as conn:
        # Daily failed deliveries
        df_fail = pd.read_sql(text("""
            SELECT DATE(shipped_at) AS date, COUNT(*) AS value
            FROM shipments WHERE status = 'failed'
            AND shipped_at IS NOT NULL
            GROUP BY 1 ORDER BY 1
        """), conn)
        # Daily avg delivery delay (actual vs estimated)
        df_delay = pd.read_sql(text("""
            SELECT DATE(s.shipped_at) AS date,
                   AVG(EXTRACT(EPOCH FROM (s.delivered_at - s.shipped_at))/3600
                       - r.estimated_hrs) AS value
            FROM shipments s
            JOIN routes r ON r.route_id = s.route_id
            WHERE s.status = 'delivered'
              AND s.shipped_at IS NOT NULL
              AND s.delivered_at IS NOT NULL
            GROUP BY 1 ORDER BY 1
        """), conn)

    fail_items = _zscore_anomalies(
        df_fail, 'date', 'value',
        'Delivery Failure Spike', 'Delivery Failure Drop',
        'High delivery failure rate — audit driver performance and route conditions.',
        'Delivery failures below normal — validate data completeness.'
    )
    for i in fail_items:
        i['dataset'] = 'logistics'
    anomalies.extend(fail_items)

    delay_items = _zscore_anomalies(
        df_delay, 'date', 'value',
        'Delivery Delay Spike', 'Early Delivery Spike',
        'Significant delivery delays detected — check route congestion or driver issues.',
        'Deliveries arriving much earlier than estimated — review route time estimates.'
    )
    for i in delay_items:
        i['dataset'] = 'logistics'
    anomalies.extend(delay_items)
    return anomalies


# ─── Public API ───────────────────────────────────────────────────────────────

def detect_anomalies(dataset: str = "all") -> Dict[str, Any]:
    """Detect anomalies across ecommerce, banking, logistics, or all datasets."""
    runners = {
        "ecommerce": _ecommerce_anomalies,
        "banking": _banking_anomalies,
        "logistics": _logistics_anomalies,
    }

    if dataset in runners:
        anomalies = runners[dataset]()
    else:  # "all"
        anomalies = []
        for fn in runners.values():
            try:
                anomalies.extend(fn())
            except Exception:
                pass  # skip dataset if tables don't exist yet

    anomalies.sort(key=lambda x: abs(x.get('z_score', 0)), reverse=True)
    return {
        "dataset": dataset,
        "anomalies": anomalies,
        "total_anomalies": len(anomalies),
        "high_severity": sum(1 for a in anomalies if a['severity'] == 'high'),
        "medium_severity": sum(1 for a in anomalies if a['severity'] == 'medium'),
    }
