"""
Unit tests for AI service core logic.
Run with: pytest ai-service/tests/ -v
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ─── Chart type suggestion ────────────────────────────────────────────────────

from app.services.sql_generator import suggest_chart_type


class TestSuggestChartType:
    def test_time_keyword_returns_line(self):
        assert suggest_chart_type("revenue trend over time", ["month", "revenue"]) == "line"

    def test_compare_keyword_returns_bar(self):
        assert suggest_chart_type("compare sales by region", ["region", "sales"]) == "bar"

    def test_share_keyword_returns_pie(self):
        assert suggest_chart_type("market share breakdown", ["category", "pct"]) == "pie"

    def test_scatter_keyword_returns_scatter(self):
        assert suggest_chart_type("correlation between price and revenue", ["price", "revenue"]) == "scatter"

    def test_month_column_returns_line(self):
        assert suggest_chart_type("show data", ["month", "value"]) == "line"

    def test_default_returns_bar(self):
        assert suggest_chart_type("top products", ["product", "units"]) == "bar"


# ─── Session manager ─────────────────────────────────────────────────────────

from unittest.mock import patch, MagicMock
import json


class TestSessionManager:
    def test_format_history_empty(self):
        from app.utils.session_manager import format_history
        result = format_history([])
        assert result == "No prior context."

    def test_format_history_with_turns(self):
        from app.utils.session_manager import format_history
        history = [
            {"question": "show revenue", "sql": "SELECT SUM(total_amount) FROM orders"},
            {"question": "by region", "sql": "SELECT region, SUM(total_amount) FROM orders GROUP BY region"},
        ]
        result = format_history(history)
        assert "show revenue" in result
        assert "SELECT SUM" in result
        assert "by region" in result

    @patch("app.utils.session_manager._redis")
    def test_get_session_history_empty(self, mock_redis):
        from app.utils.session_manager import get_session_history
        mock_redis.get.return_value = None
        assert get_session_history("test-session") == []

    @patch("app.utils.session_manager._redis")
    def test_get_session_history_returns_data(self, mock_redis):
        from app.utils.session_manager import get_session_history
        data = [{"question": "q1", "sql": "SELECT 1"}]
        mock_redis.get.return_value = json.dumps(data)
        result = get_session_history("test-session")
        assert len(result) == 1
        assert result[0]["question"] == "q1"

    @patch("app.utils.session_manager._redis")
    def test_append_keeps_last_10(self, mock_redis):
        from app.utils.session_manager import append_to_session
        existing = [{"question": f"q{i}", "sql": f"SELECT {i}"} for i in range(10)]
        mock_redis.get.return_value = json.dumps(existing)
        mock_redis.setex = MagicMock()
        append_to_session("sess", "q_new", "SELECT 99")
        stored = json.loads(mock_redis.setex.call_args[0][2])
        assert len(stored) == 10
        assert stored[-1]["question"] == "q_new"


# ─── RLS service ─────────────────────────────────────────────────────────────

class TestRlsService:
    def test_admin_no_filter(self):
        from app.services.enterprise.rls_service import apply_row_level_filter
        sql = "SELECT * FROM orders"
        result = apply_row_level_filter(sql, "ROLE_ADMIN")
        assert result == sql

    def test_south_manager_injects_region_filter(self):
        from app.services.enterprise.rls_service import apply_row_level_filter
        sql = "SELECT * FROM orders WHERE status='completed'"
        result = apply_row_level_filter(sql, "ROLE_SOUTH_MANAGER")
        assert "South" in result

    def test_can_access_dataset_admin(self):
        from app.services.enterprise.rls_service import can_access_dataset
        assert can_access_dataset("ROLE_ADMIN", "banking") is True

    def test_can_access_dataset_viewer_limited(self):
        from app.services.enterprise.rls_service import can_access_dataset
        assert can_access_dataset("ROLE_VIEWER", "ecommerce") is True
        assert can_access_dataset("ROLE_VIEWER", "banking") is False

    def test_mask_columns_analyst(self):
        from app.services.enterprise.rls_service import mask_columns
        data = [{"name": "John", "email": "john@test.com", "revenue": 1000}]
        result = mask_columns(data, "ROLE_ANALYST")
        assert result[0]["email"] == "***"
        assert result[0]["revenue"] == 1000

    def test_mask_columns_admin_no_masking(self):
        from app.services.enterprise.rls_service import mask_columns
        data = [{"name": "John", "email": "john@test.com"}]
        result = mask_columns(data, "ROLE_ADMIN")
        assert result[0]["email"] == "john@test.com"


# ─── Anomaly service (unit, no DB) ───────────────────────────────────────────

class TestAnomalyService:
    def test_zscore_anomalies_insufficient_data(self):
        from app.services.anomaly_service import _zscore_anomalies
        import pandas as pd
        df = pd.DataFrame({"date": ["2024-01-01"], "value": [100.0]})
        result = _zscore_anomalies(df, "date", "value", "Spike", "Drop", "rec", "rec")
        assert result == []

    def test_zscore_anomalies_detects_spike(self):
        from app.services.anomaly_service import _zscore_anomalies
        import pandas as pd
        import numpy as np
        dates = pd.date_range("2024-01-01", periods=20, freq="D")
        values = [1000.0] * 19 + [50000.0]  # massive spike on last day
        df = pd.DataFrame({"date": dates, "value": values})
        result = _zscore_anomalies(df, "date", "value", "Spike", "Drop", "check spike", "check drop")
        assert len(result) >= 1
        assert result[-1]["type"] == "Spike"
