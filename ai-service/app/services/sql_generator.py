import os
from openai import OpenAI
from app.utils.schema_context import SCHEMAS, SYSTEM_PROMPT
from app.utils.session_manager import get_session_history, append_to_session, format_history

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_sql(question: str, dataset: str, session_id: str) -> str:
    schema = SCHEMAS.get(dataset, SCHEMAS["ecommerce"])
    history = get_session_history(session_id)
    history_text = format_history(history)

    prompt = SYSTEM_PROMPT.format(
        schema_context=schema,
        history=history_text,
        question=question
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=500
    )

    sql = response.choices[0].message.content.strip()
    # Strip markdown fences if present
    if sql.startswith("```"):
        sql = "\n".join(sql.split("\n")[1:-1])

    append_to_session(session_id, question, sql)
    return sql


def suggest_chart_type(question: str, columns: list) -> str:
    question_lower = question.lower()
    col_str = " ".join(columns).lower()

    # Rule-based logic first (fast & cheap)
    time_keywords = ["trend", "month", "year", "daily", "weekly", "over time", "quarterly"]
    compare_keywords = ["compare", "vs", "versus", "by region", "by category", "top"]
    share_keywords = ["share", "distribution", "percentage", "breakdown", "pie"]
    scatter_keywords = ["correlation", "relationship", "scatter", "vs"]

    if any(k in question_lower for k in time_keywords) or "month" in col_str or "year" in col_str:
        return "line"
    if any(k in question_lower for k in scatter_keywords):
        return "scatter"
    if any(k in question_lower for k in share_keywords):
        return "pie"
    if any(k in question_lower for k in compare_keywords):
        return "bar"
    return "bar"
