import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bi_analytics")


def detect_anomalies() -> dict:
    engine = create_engine(DATABASE_URL)
    anomalies = []

    with engine.connect() as conn:
        # Daily revenue anomaly
        df = pd.read_sql(text("""
            SELECT order_date AS date, SUM(total_amount) AS daily_revenue
            FROM orders WHERE status='completed'
            GROUP BY order_date ORDER BY order_date
        """), conn)

    if len(df) < 7:
        return {"anomalies": [], "message": "Insufficient data for anomaly detection"}

    df['rolling_mean'] = df['daily_revenue'].rolling(7, min_periods=1).mean()
    df['rolling_std'] = df['daily_revenue'].rolling(7, min_periods=1).std().fillna(0)
    df['z_score'] = np.where(
        df['rolling_std'] > 0,
        (df['daily_revenue'] - df['rolling_mean']) / df['rolling_std'],
        0
    )

    outliers = df[df['z_score'].abs() > 2.5]
    for _, row in outliers.iterrows():
        direction = "spike" if row['z_score'] > 0 else "drop"
        anomalies.append({
            "date": str(row['date']),
            "type": f"Revenue {direction}",
            "actual": round(float(row['daily_revenue']), 2),
            "expected": round(float(row['rolling_mean']), 2),
            "z_score": round(float(row['z_score']), 2),
            "severity": "high" if abs(row['z_score']) > 3 else "medium",
            "recommendation": (
                "Investigate marketing campaigns or external factors driving the spike."
                if direction == "spike"
                else "Review potential operational issues, cancellations, or system downtime."
            )
        })

    return {"anomalies": anomalies, "total_anomalies": len(anomalies)}
