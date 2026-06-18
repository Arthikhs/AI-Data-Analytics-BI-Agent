import io
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

router = APIRouter()


@router.post("/generate")
def generate_report(body: dict):
    kpis = body.get("kpis", {})
    insights = body.get("insights", {})
    title = body.get("title", "Business Intelligence Report")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=inch * 0.75, leftMargin=inch * 0.75,
                            topMargin=inch, bottomMargin=inch)

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=18, textColor=colors.HexColor("#1e3a5f"))
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=14, textColor=colors.HexColor("#2563eb"))
    body_style = styles["BodyText"]

    story = []

    # Title
    story.append(Paragraph(title, h1))
    story.append(Spacer(1, 12))

    # KPI Summary Table
    if kpis:
        story.append(Paragraph("Executive KPI Summary", h2))
        story.append(Spacer(1, 8))
        kpi_data = [["Metric", "Value"]]
        kpi_labels = {
            "totalRevenue": "Total Revenue (₹)",
            "totalOrders": "Total Orders",
            "avgOrderValue": "Avg. Order Value (₹)",
            "grossProfit": "Gross Profit (₹)",
            "revenueGrowthPct": "Revenue Growth (%)",
            "totalCustomers": "Total Customers"
        }
        for key, label in kpi_labels.items():
            if key in kpis:
                val = kpis[key]
                formatted = f"{val:,.2f}" if isinstance(val, float) else str(val)
                kpi_data.append([label, formatted])

        table = Table(kpi_data, colWidths=[3.5 * inch, 2.5 * inch])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(table)
        story.append(Spacer(1, 16))

    # Insights
    if insights:
        story.append(Paragraph("Business Insights", h2))
        if insights.get("summary"):
            story.append(Paragraph(insights["summary"], body_style))
            story.append(Spacer(1, 8))

        sections = [
            ("Key Findings", "keyFindings"),
            ("Growth Drivers", "growthDrivers"),
            ("Risks", "risks"),
            ("Recommendations", "recommendations"),
        ]
        for section_title, key in sections:
            items = insights.get(key, [])
            if items:
                story.append(Paragraph(section_title, ParagraphStyle("s", parent=h2, fontSize=11)))
                for item in items:
                    story.append(Paragraph(f"• {item}", body_style))
                story.append(Spacer(1, 6))

    doc.build(story)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{title.replace(" ", "_")}.pdf"'}
    )
