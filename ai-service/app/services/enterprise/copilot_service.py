import os
import json
from openai import OpenAI
from typing import Any, Dict, List

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

COPILOT_SYSTEM = """You are an elite executive business advisor and Chief Analytics Officer with deep expertise in data-driven strategy.

You have access to the following live business intelligence data:
- KPI Snapshot: {kpis}
- Revenue Forecasts: {forecasts}
- Active Anomalies: {anomalies}
- Historical Trends: {trends}

Your role: Answer the executive's question with strategic depth, citing specific numbers from the data.

Rules:
- Always reference specific metrics/numbers from the provided data
- Provide actionable recommendations with clear priorities
- Use executive-level language (concise, direct, data-backed)
- Identify root causes, not just symptoms
- Include risk assessment when relevant

Return JSON:
{{
  "answer": "Direct, data-backed answer to the executive question",
  "key_metrics": [{{"metric": "name", "value": "value", "significance": "why it matters"}}],
  "root_causes": ["cause 1", "cause 2"],
  "strategic_recommendations": [{{"priority": "HIGH|MEDIUM|LOW", "action": "specific action", "expected_impact": "outcome"}}],
  "risks": ["risk 1", "risk 2"],
  "opportunities": ["opportunity 1", "opportunity 2"],
  "executive_summary": "2-3 sentence board-ready summary"
}}"""


def ask_copilot(question: str, context: Dict[str, Any]) -> Dict[str, Any]:
    kpis = context.get("kpis", {})
    forecasts = context.get("forecasts", {})
    anomalies = context.get("anomalies", [])
    trends = context.get("trends", [])

    prompt = COPILOT_SYSTEM.format(
        kpis=json.dumps(kpis, default=str)[:1500],
        forecasts=json.dumps(forecasts, default=str)[:800],
        anomalies=json.dumps(anomalies[:5], default=str)[:600],
        trends=json.dumps(trends[:12], default=str)[:600],
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": question},
        ],
        temperature=0.3,
        max_tokens=1200,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def generate_executive_briefing(context: Dict[str, Any]) -> Dict[str, Any]:
    """Auto-generates a daily executive briefing from current platform data."""
    question = (
        "Generate a comprehensive executive briefing covering: "
        "current business performance, key risks, growth opportunities, "
        "and top 3 strategic actions management should take immediately."
    )
    return ask_copilot(question, context)
