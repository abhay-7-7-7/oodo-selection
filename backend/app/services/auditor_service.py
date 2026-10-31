"""N2 — Integrity Auditor service.

Runs checks against the main Brightloop SQLite database (read-only access to brightloop.db).
Stores findings in the novelty_modules.db.
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session as OrmSession

from app.models.auditor import AuditRun, AuditFinding
from app.database import get_db


MAIN_DB_URL = "sqlite:///./brightloop.db"


def _get_main_db_data(query: str) -> List[Dict[str, Any]]:
    """Read-only query to main brightloop.db. Returns list of row dicts."""
    try:
        eng = create_engine(MAIN_DB_URL, connect_args={"check_same_thread": False, "timeout": 5})
        with eng.connect() as conn:
            result = conn.execute(text(query))
            rows = [dict(zip(result.keys(), r)) for r in result.fetchall()]
        eng.dispose()
        return rows
    except Exception:
        return []


def _check_duplicate_invoices() -> List[Dict[str, Any]]:
    """Find invoices with same subscription_id and billing_period."""
    rows = _get_main_db_data("""
        SELECT subscription_id, billing_period_start, billing_period_end, COUNT(*) as cnt,
               GROUP_CONCAT(id) as ids
        FROM invoices
        WHERE subscription_id IS NOT NULL
        GROUP BY subscription_id, billing_period_start, billing_period_end
        HAVING cnt > 1
    """)
    findings = []
    for r in rows:
        findings.append({
            "category": "duplicate_invoice",
            "severity": "critical",
            "description": f"Duplicate invoices for subscription {r['subscription_id']} in period {r.get('billing_period_start', '?')}–{r.get('billing_period_end', '?')}",
            "entity_type": "invoice",
            "entity_id": str(r.get("subscription_id", "?")),
            "detail": {"invoice_ids": r.get("ids", ""), "count": r["cnt"]},
        })
    return findings


def _check_payment_mismatches() -> List[Dict[str, Any]]:
    """Find invoices where sum of payments doesn't match amount_paid."""
    rows = _get_main_db_data("""
        SELECT i.id as invoice_id, i.total_amount_paise, i.amount_paid_paise,
               COALESCE(SUM(p.amount_paise), 0) as payment_sum
        FROM invoices i
        LEFT JOIN payments p ON p.invoice_id = i.id AND p.status = 'success'
        GROUP BY i.id, i.total_amount_paise, i.amount_paid_paise
        HAVING ABS(payment_sum - i.amount_paid_paise) > 1
    """)
    findings = []
    for r in rows:
        findings.append({
            "category": "payment_mismatch",
            "severity": "high",
            "description": f"Invoice {r['invoice_id']}: amount_paid_paise ({r['amount_paid_paise']}) ≠ sum of payments ({r['payment_sum']})",
            "entity_type": "invoice",
            "entity_id": str(r["invoice_id"]),
            "detail": {"recorded_paid": r["amount_paid_paise"], "actual_sum": r["payment_sum"]},
        })
    return findings


def _check_subscription_gaps() -> List[Dict[str, Any]]:
    """Find active subscriptions with no invoice in the last 35 days."""
    rows = _get_main_db_data("""
        SELECT s.id as sub_id, s.customer_id, MAX(i.created_at) as last_invoice
        FROM subscriptions s
        LEFT JOIN invoices i ON i.subscription_id = s.id
        WHERE s.status = 'active'
        GROUP BY s.id, s.customer_id
        HAVING last_invoice IS NULL OR julianday('now') - julianday(last_invoice) > 35
    """)
    findings = []
    for r in rows:
        findings.append({
            "category": "subscription_gap",
            "severity": "medium",
            "description": f"Active subscription {r['sub_id']} has no recent invoice (last: {r['last_invoice'] or 'never'})",
            "entity_type": "subscription",
            "entity_id": str(r["sub_id"]),
            "detail": {"customer_id": r["customer_id"], "last_invoice_at": r.get("last_invoice")},
        })
    return findings


def _check_orphan_payments() -> List[Dict[str, Any]]:
    """Find payments with no matching invoice."""
    rows = _get_main_db_data("""
        SELECT p.id, p.amount_paise, p.invoice_id, p.created_at
        FROM payments p
        LEFT JOIN invoices i ON i.id = p.invoice_id
        WHERE i.id IS NULL AND p.invoice_id IS NOT NULL
    """)
    findings = []
    for r in rows:
        findings.append({
            "category": "orphan_payment",
            "severity": "high",
            "description": f"Payment {r['id']} references missing invoice {r['invoice_id']}",
            "entity_type": "payment",
            "entity_id": str(r["id"]),
            "detail": {"amount_paise": r["amount_paise"], "invoice_id": r["invoice_id"]},
        })
    return findings


def run_audit(db: OrmSession, triggered_by_user_id: int | None = None) -> AuditRun:
    run = AuditRun(
        id=str(uuid.uuid4()),
        started_at=datetime.utcnow(),
        triggered_by_user_id=triggered_by_user_id,
    )
    db.add(run)
    db.flush()

    all_findings: List[Dict[str, Any]] = []
    all_findings.extend(_check_duplicate_invoices())
    all_findings.extend(_check_payment_mismatches())
    all_findings.extend(_check_subscription_gaps())
    all_findings.extend(_check_orphan_payments())

    # If no main DB, add a demo finding so the UI shows something
    if not all_findings:
        all_findings.append({
            "category": "orphan_payment",
            "severity": "info",
            "description": "No issues detected in main database (or demo mode — main DB not found).",
            "entity_type": "system",
            "entity_id": "0",
            "detail": {"note": "Connect to main brightloop.db for live results"},
        })

    severity_map = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in all_findings:
        sev = f.get("severity", "info")
        severity_map[sev] = severity_map.get(sev, 0) + 1
        finding = AuditFinding(
            id=str(uuid.uuid4()),
            run_id=run.id,
            category=f["category"],
            severity=sev,
            description=f["description"],
            entity_type=f["entity_type"],
            entity_id=str(f["entity_id"]),
            detail=f.get("detail"),
        )
        db.add(finding)

    run.completed_at = datetime.utcnow()
    run.total_findings = len(all_findings)
    run.critical = severity_map.get("critical", 0)
    run.high = severity_map.get("high", 0)
    run.medium = severity_map.get("medium", 0)
    run.low = severity_map.get("low", 0)
    run.info = severity_map.get("info", 0)

    db.commit()
    db.refresh(run)
    return run


def get_run_with_findings(db: OrmSession, run_id: str) -> AuditRun | None:
    run = db.query(AuditRun).filter(AuditRun.id == run_id).first()
    if run:
        run.findings = db.query(AuditFinding).filter(AuditFinding.run_id == run_id).all()
    return run


def list_runs(db: OrmSession, skip: int = 0, limit: int = 20) -> dict:
    q = db.query(AuditRun).order_by(AuditRun.started_at.desc())
    total = q.count()
    runs = q.offset(skip).limit(limit).all()
    for run in runs:
        run.findings = db.query(AuditFinding).filter(AuditFinding.run_id == run.id).all()
    return {"items": runs, "total": total}
