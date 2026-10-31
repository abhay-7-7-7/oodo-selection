"""N5 — Renewal Radar service."""
import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text

from app.models.renewal_radar import RenewalQuotation

MAIN_DB_URL = "sqlite:///./brightloop.db"


def _get_subscriptions() -> List[Dict[str, Any]]:
    try:
        eng = create_engine(MAIN_DB_URL, connect_args={"check_same_thread": False, "timeout": 5})
        with eng.connect() as conn:
            result = conn.execute(text("""
                SELECT s.id, s.status, s.end_date, s.customer_id,
                       COALESCE(u.name, u.email, 'Unknown') as customer_name,
                       COALESCE(pl.name, 'Unknown Plan') as plan_name,
                       COALESCE(
                           (SELECT SUM(i.total_amount_paise - i.amount_paid_paise)
                            FROM invoices i
                            WHERE i.subscription_id = s.id
                              AND i.total_amount_paise > i.amount_paid_paise), 0
                       ) as outstanding_paise,
                       (SELECT MAX(p.created_at) FROM payments p
                        JOIN invoices i ON i.id = p.invoice_id
                        WHERE i.subscription_id = s.id AND p.status = 'success') as last_payment_date
                FROM subscriptions s
                LEFT JOIN users u ON u.id = s.customer_id
                LEFT JOIN plans pl ON pl.id = s.plan_id
                WHERE s.status IN ('active', 'expired', 'cancelled')
                  AND s.end_date IS NOT NULL
            """))
            rows = [dict(zip(result.keys(), r)) for r in result.fetchall()]
        eng.dispose()
        return rows
    except Exception:
        # Demo data
        today = date.today()
        return [
            {"id": "sub-001", "status": "active", "end_date": str(today + timedelta(days=5)),
             "customer_id": "1", "customer_name": "TechCorp India", "plan_name": "Professional",
             "outstanding_paise": 0, "last_payment_date": str(today - timedelta(days=30))},
            {"id": "sub-002", "status": "active", "end_date": str(today + timedelta(days=22)),
             "customer_id": "2", "customer_name": "Ravi Patel", "plan_name": "Starter",
             "outstanding_paise": 5000, "last_payment_date": str(today - timedelta(days=60))},
            {"id": "sub-003", "status": "active", "end_date": str(today + timedelta(days=45)),
             "customer_id": "3", "customer_name": "Global Corp", "plan_name": "Enterprise",
             "outstanding_paise": 0, "last_payment_date": str(today - timedelta(days=15))},
            {"id": "sub-004", "status": "expired", "end_date": str(today - timedelta(days=10)),
             "customer_id": "4", "customer_name": "Startup Labs", "plan_name": "Starter",
             "outstanding_paise": 23600, "last_payment_date": None},
        ]


def _bucket(days: int) -> str:
    if days < 0:
        return "expired"
    if days <= 7:
        return "7d"
    if days <= 30:
        return "30d"
    return "60d"


def get_renewal_subscriptions(db: Session, bucket: Optional[str] = None) -> dict:
    subs = _get_subscriptions()
    today = date.today()

    # Get open quotations from novelty DB
    open_quotation_sub_ids = set(
        r[0] for r in db.query(RenewalQuotation.subscription_id).filter(
            RenewalQuotation.status.in_(["draft", "sent"])
        ).all()
    )

    result = []
    for s in subs:
        try:
            end = date.fromisoformat(str(s["end_date"])[:10])
        except Exception:
            continue
        days = (end - today).days
        b = _bucket(days)
        if bucket and b != bucket:
            continue
        result.append({
            "subscription_id": s["id"],
            "customer_name": s["customer_name"],
            "plan_name": s["plan_name"],
            "expires_at": str(end),
            "days_until_expiry": days,
            "bucket": b,
            "renewable": days >= -30,
            "has_open_renewal_quotation": s["id"] in open_quotation_sub_ids,
            "last_payment_date": s.get("last_payment_date"),
            "outstanding_paise": int(s.get("outstanding_paise") or 0),
        })

    # Sort: expired last, then by days ascending
    result.sort(key=lambda x: (x["bucket"] == "expired", x["days_until_expiry"]))
    return {"items": result, "total": len(result)}


def create_quotation(db: Session, data: dict, user_id: Optional[int] = None) -> RenewalQuotation:
    q = RenewalQuotation(
        id=str(uuid.uuid4()),
        subscription_id=data["subscription_id"],
        customer_id=data["customer_id"],
        plan_id=data["plan_id"],
        quantity=data.get("quantity", 1),
        notes=data.get("notes"),
        created_by_user_id=user_id,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def list_quotations(db: Session) -> dict:
    items = db.query(RenewalQuotation).order_by(RenewalQuotation.created_at.desc()).all()
    return {"items": items, "total": len(items)}
