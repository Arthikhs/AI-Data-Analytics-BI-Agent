import os
import smtplib
import json
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any

# ─── Config from env ──────────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST", "")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM", SMTP_USER)
SLACK_WEBHOOK = os.getenv("SLACK_WEBHOOK_URL", "")


def _severity_emoji(severity: str) -> str:
    return {"critical": "🔴", "warning": "🟡", "info": "🟢"}.get(severity, "⚪")


# ─── Email ────────────────────────────────────────────────────────────────────

def send_email_alert(recipients: List[str], alerts: List[Dict[str, Any]]) -> bool:
    if not SMTP_HOST or not SMTP_USER or not recipients:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⚠️ BI Alert: {len(alerts)} alert(s) triggered"
        msg["From"]    = SMTP_FROM
        msg["To"]      = ", ".join(recipients)

        rows = "".join(
            f"""<tr>
                <td style="padding:8px;border-bottom:1px solid #eee">
                  {_severity_emoji(a['severity'])} <strong>{a['name']}</strong>
                </td>
                <td style="padding:8px;border-bottom:1px solid #eee">{a['message']}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">
                  {a.get('actual_value','—')}
                </td>
              </tr>"""
            for a in alerts
        )

        html = f"""
        <html><body style="font-family:sans-serif;color:#333">
          <h2 style="color:#2563eb">BI Platform Alert</h2>
          <p>{len(alerts)} alert(s) have been triggered:</p>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="padding:8px;text-align:left">Alert</th>
                <th style="padding:8px;text-align:left">Message</th>
                <th style="padding:8px;text-align:right">Value</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
          <p style="color:#888;font-size:12px;margin-top:20px">
            AI Data Analytics & BI Platform
          </p>
        </body></html>"""

        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, recipients, msg.as_string())
        return True
    except Exception:
        return False


# ─── Slack ────────────────────────────────────────────────────────────────────

def send_slack_alert(alerts: List[Dict[str, Any]]) -> bool:
    if not SLACK_WEBHOOK:
        return False
    try:
        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": f"⚠️ BI Platform — {len(alerts)} Alert(s) Triggered"}
            },
            {"type": "divider"},
        ]
        for a in alerts[:10]:  # Slack has block limits
            blocks.append({
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*{_severity_emoji(a['severity'])} {a['name']}*\n{a['message']}"},
                    {"type": "mrkdwn", "text": f"*Value:* {a.get('actual_value', '—')}\n*Threshold:* {a.get('threshold', '—')}"},
                ]
            })

        resp = httpx.post(SLACK_WEBHOOK, json={"blocks": blocks}, timeout=10)
        return resp.status_code == 200
    except Exception:
        return False


# ─── Unified dispatcher ───────────────────────────────────────────────────────

def dispatch_alerts(alerts: List[Dict[str, Any]],
                    email_recipients: List[str] = None) -> Dict[str, bool]:
    if not alerts:
        return {"email": False, "slack": False}
    return {
        "email": send_email_alert(email_recipients or [], alerts),
        "slack": send_slack_alert(alerts),
    }
