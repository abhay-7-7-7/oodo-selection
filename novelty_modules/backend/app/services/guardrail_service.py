"""N1 — Discount Guardrail service logic."""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.guardrail import GuardrailAuditLog
from app.config import settings


def simulate_discount(
    db: Session,
    sales_price_paise: int,
    cost_price_paise: int,
    discount_kind: str,
    discount_value: float,
    quantity: int,
    requester_role: str,
    product_id: str | None = None,
) -> dict:
    # Calculate discount amount
    if discount_kind == "percent":
        discount_amount = int(sales_price_paise * discount_value / 100)
    else:
        discount_amount = int(discount_value)

    discount_amount = max(0, min(discount_amount, sales_price_paise))
    final_price = sales_price_paise - discount_amount
    profit = final_price - cost_price_paise
    margin_percent = (profit / final_price * 100) if final_price > 0 else 0.0
    min_margin = settings.MIN_MARGIN_PERCENT

    guardrail_breached = margin_percent < min_margin
    # Determine override level
    if not guardrail_breached:
        override_level = "none"
    elif margin_percent < (min_margin - 10):
        override_level = "director"
    else:
        override_level = "manager"

    simulation_id = str(uuid.uuid4())

    # Persist audit log
    log = GuardrailAuditLog(
        id=str(uuid.uuid4()),
        simulation_id=simulation_id,
        product_id=product_id,
        sales_price_paise=sales_price_paise,
        cost_price_paise=cost_price_paise,
        discount_amount_paise=discount_amount,
        final_price_paise=final_price,
        margin_percent=round(margin_percent, 2),
        min_margin_percent=min_margin,
        discount_kind=discount_kind,
        discount_value=discount_value,
        quantity=quantity,
        requester_role=requester_role,
        guardrail_breached=guardrail_breached,
        override_level=override_level,
    )
    db.add(log)
    db.commit()

    warning = None
    if guardrail_breached:
        warning = (
            f"Margin {margin_percent:.1f}% is below minimum {min_margin:.1f}%. "
            f"Requires {override_level} approval."
        )

    return {
        "simulation_id": simulation_id,
        "original_price_paise": sales_price_paise,
        "discount_amount_paise": discount_amount,
        "final_price_paise": final_price,
        "cost_price_paise": cost_price_paise,
        "profit_paise": profit,
        "margin_percent": round(margin_percent, 2),
        "min_margin_percent": min_margin,
        "guardrail_breached": guardrail_breached,
        "requires_override": guardrail_breached,
        "override_level": override_level,
        "warning_message": warning,
    }


def approve_override(
    db: Session,
    simulation_id: str,
    justification: str,
    approver_user_id: int,
) -> dict:
    log = db.query(GuardrailAuditLog).filter(
        GuardrailAuditLog.simulation_id == simulation_id
    ).first()

    if not log:
        raise ValueError(f"Simulation {simulation_id} not found")

    log.justification = justification
    log.override_approved = True
    log.override_approved_by_user_id = approver_user_id
    db.commit()
    db.refresh(log)

    return {
        "simulation_id": simulation_id,
        "override_level": log.override_level,
        "approved": True,
        "message": f"Override approved for simulation {simulation_id}",
    }


def get_audit_log(db: Session, skip: int = 0, limit: int = 50) -> dict:
    q = db.query(GuardrailAuditLog).order_by(GuardrailAuditLog.created_at.desc())
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return {"items": items, "total": total}
