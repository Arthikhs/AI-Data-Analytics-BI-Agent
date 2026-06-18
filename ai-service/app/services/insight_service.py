import os
import json
from openai import OpenAI
from app.models.schemas import InsightResponse

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

INSIGHT_PROMPT = """You are an expert business intelligence analyst.

The user asked: "{question}"

Here is the data (first 50 rows shown):
{data_sample}

Generate executive-level business insights in JSON format:
{{
  "summary": "One paragraph executive summary",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "growthDrivers": ["driver1", "driver2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "recommendations": ["action1", "action2", "action3"]
}}

Be specific with numbers and percentages from the data. Return only valid JSON."""


def generate_insights(question: str, data: list) -> InsightResponse:
    data_sample = json.dumps(data[:50], default=str, indent=2)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": INSIGHT_PROMPT.format(question=question, data_sample=data_sample)
        }],
        temperature=0.3,
        max_tokens=800,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    return InsightResponse(
        summary=result.get("summary", ""),
        keyFindings=result.get("keyFindings", []),
        growthDrivers=result.get("growthDrivers", []),
        risks=result.get("risks", []),
        opportunities=result.get("opportunities", []),
        recommendations=result.get("recommendations", [])
    )
