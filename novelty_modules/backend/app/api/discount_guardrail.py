"""N1 — Profit-Aware Discount Guardrail API Router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.guardrail import (
    GuardrailSimulateRequest,
    GuardrailSimulateResponse,
    OverrideRequest,
    OverrideResponse,
    AuditLogListResponse,
)
from app.services import guardrail_service

router = APIRouter()


@router.post("/simulate", response_model=GuardrailSimulateResponse)
def simulate_discount_endpoint(
    payload: GuardrailSimulateRequest,
    db: Session = Depends(get_db),
):
    """Simulate a discount proposal and check against profit margin guardrails."""
    result = guardrail_service.simulate_discount(
        db=db,
        sales_price_paise=payload.sales_price_paise,
        cost_price_paise=payload.cost_price_paise,
        discount_kind=payload.discount_kind,
        discount_value=payload.discount_value,
        quantity=payload.quantity,
        requester_role=payload.requester_role,
        product_id=payload.product_id,
    )
    return result


@router.post("/override", response_model=OverrideResponse)
def request_override_endpoint(
    payload: OverrideRequest,
    db: Session = Depends(get_db),
):
    """Submit an override request with justification for a breached discount."""
    try:
        result = guardrail_service.approve_override(
            db=db,
            simulation_id=payload.simulation_id,
            justification=payload.justification,
            approver_user_id=payload.requested_by_user_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/audit-log", response_model=AuditLogListResponse)
def get_audit_log_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve historical audit logs of simulated discounts and overrides."""
    return guardrail_service.get_audit_log(db=db, skip=skip, limit=limit)
