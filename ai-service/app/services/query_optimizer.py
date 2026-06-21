"""
AI Query Optimization Advisor
Analyzes SQL queries for performance issues, suggests indexes,
detects bottlenecks, rewrites queries, and compares execution plans.
"""
import os
import json
import time
import re
from typing import Any, Dict, List, Optional
from sqlalchemy import create_engine, text
from openai import OpenAI

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bi_analytics")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ─── Prompts ──────────────────────────────────────────────────────────────────

_OPTIMIZER_PROMPT = """You are an expert PostgreSQL query optimizer and database performance engineer.

ORIGINAL SQL:
{sql}

EXECUTION STATS (original):
{stats}

SCHEMA CONTEXT:
{schema}

EXISTING INDEXES:
{indexes}

Analyze this query for performance issues and return a complete optimization report as JSON:

{{
  "performance_score": 42,
  "severity": "critical | high | medium | low",
  "bottlenecks": [
    {{
      "type": "Sequential Scan | Missing Index | SELECT * | Cartesian Join | N+1 | Subquery | No LIMIT | Implicit Cast",
      "table": "orders",
      "description": "Full table scan on orders — 50,000 rows scanned with no index",
      "impact": "high | medium | low",
      "estimated_rows_scanned": 50000
    }}
  ],
  "optimized_sql": "SELECT o.order_id, o.total_amount ... (rewritten SQL)",
  "optimization_changes": [
    "Replaced SELECT * with explicit columns to reduce I/O",
    "Added covering index hint on order_date + status"
  ],
  "index_recommendations": [
    {{
      "ddl": "CREATE INDEX CONCURRENTLY idx_orders_date_status ON orders(order_date, status);",
      "table": "orders",
      "columns": ["order_date", "status"],
      "index_type": "btree",
      "rationale": "Covers the WHERE clause filter on order_date and status, eliminating full table scan",
      "estimated_speedup": "10-50x",
      "priority": "HIGH | MEDIUM | LOW"
    }}
  ],
  "rewrite_explanation": "Plain English explanation of every change made and why",
  "estimated_improvement": "85% reduction in execution time — from ~2400ms to ~120ms",
  "best_practices_violated": [
    "SELECT * used — always specify columns",
    "No LIMIT clause on potentially large result set"
  ],
  "additional_tips": [
    "Consider partitioning the orders table by order_date for queries spanning large date ranges",
    "Run ANALYZE on the orders table to update planner statistics"
  ]
}}

Rules:
- performance_score is 0-100 (100 = perfect, 0 = terrible)
- optimized_sql must be valid PostgreSQL
- Be specific with table/column names from the actual SQL
- Return only valid JSON"""


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _engine():
    return create_engine(DATABASE_URL)


def _get_existing_indexes(tables: List[str]) -> List[Dict]:
    """Fetch existing indexes for tables mentioned in the query."""
    if not tables:
        return []
    try:
        placeholders = ", ".join(f"'{t}'" for t in tables)
        sql = f"""
            SELECT
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE tablename IN ({placeholders})
            ORDER BY tablename, indexname
        """
        with _engine().connect() as conn:
            result = conn.execute(text(sql))
            return [dict(row._mapping) for row in result]
    except Exception:
        return []


def _get_explain_plan(sql: str) -> Dict[str, Any]:
    """Run EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) and return the plan."""
    try:
        # Only run EXPLAIN on SELECT queries
        if not sql.strip().upper().startswith("SELECT"):
            return {"error": "Only SELECT queries can be analyzed"}

        explain_sql = f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {sql}"
        with _engine().connect() as conn:
            result = conn.execute(text(explain_sql))
            plan_data = result.fetchone()[0]
            if isinstance(plan_data, list):
                plan = plan_data[0]
            else:
                plan = json.loads(plan_data)[0]

            node = plan.get("Plan", {})
            return {
                "plan_type": node.get("Node Type", "Unknown"),
                "total_cost": round(node.get("Total Cost", 0), 2),
                "actual_time_ms": round(node.get("Actual Total Time", 0), 2),
                "rows_estimated": node.get("Plan Rows", 0),
                "rows_actual": node.get("Actual Rows", 0),
                "shared_hit_blocks": plan.get("Planning", {}).get("Shared Hit Blocks", 0),
                "shared_read_blocks": plan.get("Planning", {}).get("Shared Read Blocks", 0),
                "full_plan": plan,
            }
    except Exception as e:
        return {"error": str(e), "note": "EXPLAIN requires live database connection"}


def _run_query_timed(sql: str) -> Dict[str, Any]:
    """Execute a query and measure its actual runtime."""
    try:
        if not sql.strip().upper().startswith("SELECT"):
            return {"error": "Only SELECT queries can be benchmarked"}
        with _engine().connect() as conn:
            start = time.perf_counter()
            result = conn.execute(text(sql + " LIMIT 1000"))
            rows = result.fetchall()
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return {
                "execution_time_ms": elapsed_ms,
                "row_count": len(rows),
            }
    except Exception as e:
        return {"error": str(e)}


def _extract_tables(sql: str) -> List[str]:
    """Extract table names from SQL using regex."""
    # Match FROM and JOIN clauses
    pattern = r'\b(?:FROM|JOIN)\s+([a-zA-Z_][a-zA-Z0-9_]*)'
    matches = re.findall(pattern, sql, re.IGNORECASE)
    # Filter out SQL keywords
    keywords = {"where", "select", "on", "and", "or", "not", "in", "as",
                "inner", "left", "right", "outer", "cross", "natural"}
    return list({m.lower() for m in matches if m.lower() not in keywords})


def _get_schema_for_tables(tables: List[str]) -> str:
    """Get column info for tables used in the query."""
    if not tables:
        return "Schema not available"
    try:
        placeholders = ", ".join(f"'{t}'" for t in tables)
        sql = f"""
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name IN ({placeholders})
            ORDER BY table_name, ordinal_position
        """
        with _engine().connect() as conn:
            result = conn.execute(text(sql))
            rows = [dict(r._mapping) for r in result]

        if not rows:
            return "Schema not found for specified tables"

        schema_lines = []
        current_table = None
        for row in rows:
            if row["table_name"] != current_table:
                current_table = row["table_name"]
                schema_lines.append(f"\n{current_table}:")
            nullable = "NULL" if row["is_nullable"] == "YES" else "NOT NULL"
            schema_lines.append(f"  {row['column_name']} {row['data_type']} {nullable}")
        return "\n".join(schema_lines)
    except Exception:
        return "Schema retrieval unavailable"


# ─── Public API ───────────────────────────────────────────────────────────────

def optimize_query(sql: str) -> Dict[str, Any]:
    """
    Full optimization pipeline:
    1. Extract tables + fetch schema + existing indexes
    2. Run EXPLAIN on original query
    3. Benchmark original query execution time
    4. Call GPT-4o for optimization report
    5. Benchmark optimized query
    6. Return full comparison
    """
    sql = sql.strip()

    # Step 1: Schema context
    tables = _extract_tables(sql)
    schema_context = _get_schema_for_tables(tables)
    existing_indexes = _get_existing_indexes(tables)

    # Step 2: EXPLAIN plan on original
    explain_result = _get_explain_plan(sql)

    # Step 3: Benchmark original
    original_bench = _run_query_timed(sql)

    # Step 4: GPT-4o optimization
    stats_info = {
        "execution_time_ms": original_bench.get("execution_time_ms", "unknown"),
        "row_count": original_bench.get("row_count", "unknown"),
        "explain_plan_type": explain_result.get("plan_type", "unknown"),
        "estimated_cost": explain_result.get("total_cost", "unknown"),
        "rows_estimated": explain_result.get("rows_estimated", "unknown"),
        "rows_actual": explain_result.get("rows_actual", "unknown"),
    }

    index_summary = "\n".join(
        f"  {idx['tablename']}: {idx['indexname']} — {idx['indexdef']}"
        for idx in existing_indexes
    ) or "  No existing indexes found for these tables"

    prompt = _OPTIMIZER_PROMPT.format(
        sql=sql,
        stats=json.dumps(stats_info, indent=2),
        schema=schema_context,
        indexes=index_summary,
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        ai_result = json.loads(response.choices[0].message.content)
    except Exception as e:
        ai_result = {
            "performance_score": 50,
            "severity": "medium",
            "bottlenecks": [],
            "optimized_sql": sql,
            "optimization_changes": [],
            "index_recommendations": [],
            "rewrite_explanation": f"AI analysis unavailable: {str(e)}",
            "estimated_improvement": "Unknown",
            "best_practices_violated": [],
            "additional_tips": [],
        }

    # Step 5: Benchmark optimized SQL
    optimized_sql = ai_result.get("optimized_sql", sql)
    optimized_bench = _run_query_timed(optimized_sql) if optimized_sql != sql else original_bench

    # Step 6: EXPLAIN on optimized
    optimized_explain = _get_explain_plan(optimized_sql) if optimized_sql != sql else explain_result

    return {
        "original_sql": sql,
        "optimized_sql": optimized_sql,
        "performance_score": ai_result.get("performance_score", 50),
        "severity": ai_result.get("severity", "medium"),
        "tables_analyzed": tables,
        "existing_indexes": existing_indexes,

        # Benchmark comparison
        "benchmark": {
            "original_time_ms": original_bench.get("execution_time_ms"),
            "optimized_time_ms": optimized_bench.get("execution_time_ms"),
            "original_rows": original_bench.get("row_count"),
            "optimized_rows": optimized_bench.get("row_count"),
            "speedup_ms": round(
                (original_bench.get("execution_time_ms", 0) or 0) -
                (optimized_bench.get("execution_time_ms", 0) or 0), 2
            ),
        },

        # EXPLAIN plans
        "explain_original": explain_result,
        "explain_optimized": optimized_explain,

        # AI analysis
        "bottlenecks": ai_result.get("bottlenecks", []),
        "optimization_changes": ai_result.get("optimization_changes", []),
        "index_recommendations": ai_result.get("index_recommendations", []),
        "rewrite_explanation": ai_result.get("rewrite_explanation", ""),
        "estimated_improvement": ai_result.get("estimated_improvement", ""),
        "best_practices_violated": ai_result.get("best_practices_violated", []),
        "additional_tips": ai_result.get("additional_tips", []),
    }
