import json
import re
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EXPLAIN_PROMPT = """You are an expert SQL analyst. Analyze this SQL query and return a structured explanation.

SQL:
{sql}

Return JSON exactly:
{{
  "summary": "One sentence: what this query does in business terms",
  "tables_used": ["list", "of", "tables"],
  "joins": ["describe each JOIN"],
  "aggregations": ["SUM(total_amount) as revenue", "COUNT(*) as total_orders"],
  "filters": ["status = completed", "date range filter"],
  "sorting": "ORDER BY revenue DESC",
  "business_interpretation": "2-3 sentence plain English explanation for a business user",
  "complexity": "simple | moderate | complex"
}}

Return only valid JSON."""


def explain_sql(sql: str, execution_time_ms: int = 0, row_count: int = 0) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": EXPLAIN_PROMPT.format(sql=sql)}],
        temperature=0,
        max_tokens=600,
        response_format={"type": "json_object"},
    )
    explanation = json.loads(response.choices[0].message.content)
    explanation["execution_time_ms"] = execution_time_ms
    explanation["row_count"] = row_count
    explanation["has_aggregation"] = bool(re.search(r'\b(SUM|COUNT|AVG|MIN|MAX)\b', sql, re.I))
    explanation["has_join"] = bool(re.search(r'\bJOIN\b', sql, re.I))
    explanation["has_subquery"] = bool(re.search(r'\bSELECT\b.*\bSELECT\b', sql, re.I | re.S))
    return explanation
