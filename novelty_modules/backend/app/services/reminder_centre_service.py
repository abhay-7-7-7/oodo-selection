"""N6 — Reminder Centre service."""
import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError

from app.models.reminder_centre import ReminderSettings, ReminderRecord

MAIN_DB_URL = "sqlite:///./brightloop.db"


def get_settings(db: Session) -> ReminderSettings:
    s = db.query(ReminderSettings).filter(ReminderSettings.id == 1).first()
    if not s:
        s = ReminderSettings(id=1)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


def update_settings(db: Session, updates: dict) -> ReminderSettings:
    s = get_settings(db)
    for k, v in updates.items():
        if v is not None:
            setattr(s, k, v)
    s.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(s)
    return s


def _get_upcoming_invoice_dues() -> List[Dict[str, Any]]:
    try:
        eng = create_engine(MAIN_DB_URL, connect_args={"check_same_thread": False, "timeout": 5})
        with eng.connect() as conn:
            result = conn.execute(text("""
                SELECT i.id, i.due_date, i.total_amount_paise,
                       COALESCE(u.email, '') as email,
                       COALESCE(u.name, u.email, 'Customer') as customer_name
                FROM invoices i
                JOIN subscriptions s ON s.id = i.subscription_id
                JOIN users u ON u.id = s.customer_id
                WHERE i.status IN ('pending', 'partial', 'overdue')
                  AND i.due_date IS NOT NULL
                  AND u.email IS NOT NULL
            """))
            rows = [dict(zip(result.keys(), r)) for r in result.fetchall()]
        eng.dispose()
        return rows
    except Exception:
        return []


def _get_expiring_subscriptions() -> List[Dict[str, Any]]:
    try:
        eng = create_engine(MAIN_DB_URL, connect_args={"check_same_thread": False, "timeout": 5})
        with eng.connect() as conn:
            result = conn.execute(text("""
                SELECT s.id, s.end_date,
                       COALESCE(u.email, '') as email,
                       COALESCE(u.name, u.email, 'Customer') as customer_name,
                       COALESCE(pl.name, 'Plan') as plan_name
                FROM subscriptions s
                JOIN users u ON u.id = s.customer_id
                LEFT JOIN plans pl ON pl.id = s.plan_id
                WHERE s.status = 'active'
                  AND s.end_date IS NOT NULL
                  AND u.email IS NOT NULL
            """))
            rows = [dict(zip(result.keys(), r)) for r in result.fetchall()]
        eng.dispose()
        return rows
    except Exception:
        return []


def run_reminders(db: Session) -> Dict[str, Any]:
    settings = get_settings(db)
    if not settings.enabled:
        return {"run_at": datetime.utcnow(), "sent": 0, "skipped": 0, "failed": 0, "details": []}

    today = date.today()
    sent = 0
    skipped = 0
    failed = 0
    details = []

    # Invoice due reminders
    for inv in _get_upcoming_invoice_dues():
        if not inv.get("email"):
            continue
        try:
            due = date.fromisoformat(str(inv["due_date"])[:10])
        except Exception:
            continue
        days_to_due = (due - today).days

        # Invoice due (upcoming)
        for d in settings.invoice_due_days_before:
            if days_to_due == d:
                kind = "invoice_due"
                subject = f"Payment due in {d} days — Invoice #{inv['id']}"
                scheduled_at = datetime.utcnow()
                try:
                    rec = ReminderRecord(
                        id=str(uuid.uuid4()),
                        kind=kind,
                        recipient_email=inv["email"],
                        subject=subject,
                        status="sent",  # simulate send
                        scheduled_at=scheduled_at,
                        sent_at=datetime.utcnow(),
                        entity_type="invoice",
                        entity_id=str(inv["id"]),
                    )
                    db.add(rec)
                    db.flush()
                    sent += 1
                    details.append(rec)
                except IntegrityError:
                    db.rollback()
                    skipped += 1

        # Overdue
        if days_to_due < 0:
            reminder_cycle = (-days_to_due) % settings.overdue_repeat_days
            if reminder_cycle == 0:
                scheduled_at = datetime.utcnow()
                try:
                    rec = ReminderRecord(
                        id=str(uuid.uuid4()),
                        kind="invoice_overdue",
                        recipient_email=inv["email"],
                        subject=f"OVERDUE: Invoice #{inv['id']} — {abs(days_to_due)} days past due",
                        status="sent",
                        scheduled_at=scheduled_at,
                        sent_at=datetime.utcnow(),
                        entity_type="invoice",
                        entity_id=str(inv["id"]),
                    )
                    db.add(rec)
                    db.flush()
                    sent += 1
                    details.append(rec)
                except IntegrityError:
                    db.rollback()
                    skipped += 1

    # Subscription expiry reminders
    for sub in _get_expiring_subscriptions():
        if not sub.get("email"):
            continue
        try:
            exp = date.fromisoformat(str(sub["end_date"])[:10])
        except Exception:
            continue
        days_to_expiry = (exp - today).days
        for d in settings.expiry_days_before:
            if days_to_expiry == d:
                scheduled_at = datetime.utcnow()
                try:
                    rec = ReminderRecord(
                        id=str(uuid.uuid4()),
                        kind="subscription_expiry",
                        recipient_email=sub["email"],
                        subject=f"Subscription expiring in {d} days — {sub['plan_name']}",
                        status="sent",
                        scheduled_at=scheduled_at,
                        sent_at=datetime.utcnow(),
                        entity_type="subscription",
                        entity_id=str(sub["id"]),
                    )
                    db.add(rec)
                    db.flush()
                    sent += 1
                    details.append(rec)
                except IntegrityError:
                    db.rollback()
                    skipped += 1

    try:
        db.commit()
    except Exception:
        db.rollback()
        failed += sent
        sent = 0

    return {
        "run_at": datetime.utcnow(),
        "sent": sent,
        "skipped": skipped,
        "failed": failed,
        "details": details,
    }


def get_history(db: Session, skip: int = 0, limit: int = 50) -> dict:
    q = db.query(ReminderRecord).order_by(ReminderRecord.created_at.desc())
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return {"items": items, "total": total}


def get_upcoming(db: Session) -> List[Dict[str, Any]]:
    settings = get_settings(db)
    today = date.today()
    result = []

    for inv in _get_upcoming_invoice_dues():
        if not inv.get("email"):
            continue
        try:
            due = date.fromisoformat(str(inv["due_date"])[:10])
        except Exception:
            continue
        days = (due - today).days
        for d in settings.invoice_due_days_before:
            if 0 <= days <= d:
                result.append({
                    "kind": "invoice_due",
                    "entity_type": "invoice",
                    "entity_id": str(inv["id"]),
                    "recipient_email": inv["email"],
                    "scheduled_at": datetime.combine(due - timedelta(days=d), datetime.min.time()),
                    "days_until": days,
                })

    for sub in _get_expiring_subscriptions():
        if not sub.get("email"):
            continue
        try:
            exp = date.fromisoformat(str(sub["end_date"])[:10])
        except Exception:
            continue
        days = (exp - today).days
        for d in settings.expiry_days_before:
            if 0 <= days <= d:
                result.append({
                    "kind": "subscription_expiry",
                    "entity_type": "subscription",
                    "entity_id": str(sub["id"]),
                    "recipient_email": sub["email"],
                    "scheduled_at": datetime.combine(exp - timedelta(days=d), datetime.min.time()),
                    "days_until": days,
                })

    result.sort(key=lambda x: x["days_until"])
    return result
