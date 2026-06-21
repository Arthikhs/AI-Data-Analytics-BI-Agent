import os
from sqlalchemy import create_engine, inspect, text
from typing import Dict, List, Any
import json
import redis
from openai import OpenAI

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bi_analytics")
_redis = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), decode_responses=True)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

BUSINESS_GLOSSARY_PROMPT = """You are a Business Intelligence expert. Given this database schema, generate a business glossary.

Schema:
{schema}

Return JSON:
{{
  "glossary": [
    {{"term": "column_or_table", "business_meaning": "plain English description", "example": "e.g. revenue = total completed order amounts"}}
  ],
  "dataset_summary": "one paragraph describing what this dataset tracks"
}}

Return only valid JSON."""


def discover_schema(dataset: str = "ecommerce") -> Dict[str, Any]:
    cache_key = f"schema_meta:{dataset}"
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)

    DATASET_TABLES = {
        "ecommerce": ["categories", "products", "customers", "orders", "order_items", "payments"],
        "banking": ["bank_customers", "branches", "accounts", "transactions"],
        "logistics": ["drivers", "routes", "shipments", "delivery_events"],
    }

    target_tables = DATASET_TABLES.get(dataset, DATASET_TABLES["ecommerce"])
    available = inspector.get_table_names()
    tables_info = {}

    for table in target_tables:
        if table not in available:
            continue
        columns = inspector.get_columns(table)
        fk_list = inspector.get_foreign_keys(table)
        pk_info = inspector.get_pk_constraint(table)
        indexes = inspector.get_indexes(table)

        col_meta = []
        for col in columns:
            col_meta.append({
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col.get("nullable", True),
                "default": str(col.get("default", "")) if col.get("default") else None,
                "is_primary_key": col["name"] in (pk_info.get("constrained_columns") or []),
            })

        fk_meta = [
            {
                "column": fk["constrained_columns"][0] if fk["constrained_columns"] else "",
                "references_table": fk["referred_table"],
                "references_column": fk["referred_columns"][0] if fk["referred_columns"] else "",
            }
            for fk in fk_list
        ]

        # Row count
        with engine.connect() as conn:
            count_result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            row_count = count_result.scalar()

        tables_info[table] = {
            "columns": col_meta,
            "foreign_keys": fk_meta,
            "indexes": [idx["name"] for idx in indexes],
            "row_count": row_count,
        }

    result = {
        "dataset": dataset,
        "tables": tables_info,
        "relationships": _build_relationship_map(tables_info),
    }

    _redis.setex(cache_key, 1800, json.dumps(result, default=str))
    return result


def _build_relationship_map(tables_info: Dict) -> List[Dict]:
    rels = []
    for table, meta in tables_info.items():
        for fk in meta.get("foreign_keys", []):
            rels.append({
                "from_table": table,
                "from_column": fk["column"],
                "to_table": fk["references_table"],
                "to_column": fk["references_column"],
                "type": "many-to-one",
            })
    return rels


def generate_business_glossary(dataset: str = "ecommerce") -> Dict[str, Any]:
    cache_key = f"glossary:{dataset}"
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    schema = discover_schema(dataset)
    schema_text = json.dumps(schema["tables"], indent=2, default=str)[:3000]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": BUSINESS_GLOSSARY_PROMPT.format(schema=schema_text)}],
        temperature=0.2,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    result["dataset"] = dataset
    _redis.setex(cache_key, 3600, json.dumps(result))
    return result
