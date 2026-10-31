"""N5 — Renewal Radar API Router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.renewal_radar import (
    RenewalSubscriptionListResponse,
    RenewalQuotationDraftRequest,
    RenewalQuotationOut,
)
from app.services import renewal_radar_service

router = APIRouter()


@router.get("/subscriptions", response_model=RenewalSubscriptionListResponse)
def get_renewal_subscriptions_endpoint(
    bucket: Optional[str] = Query(None, description="7d, 30d, 60d, or expired"),
    db: Session = Depends(get_db),
):
    """Retrieve subscriptions categorised into renewal radar buckets (7d, 30d, 60d, expired)."""
    return renewal_radar_service.get_renewal_subscriptions(db=db, bucket=bucket)


@router.post("/quotation", response_model=RenewalQuotationOut)
def create_renewal_quotation_endpoint(
    payload: RenewalQuotationDraftRequest,
    db: Session = Depends(get_db),
):
    """Generate a 1-click renewal quotation draft for an expiring subscription."""
    return renewal_radar_service.create_quotation(
        db=db,
        data=payload.model_dump(),
    )


@router.get("/quotations")
def list_quotations_endpoint(
    db: Session = Depends(get_db),
):
    """List generated renewal quotations."""
    return renewal_radar_service.list_quotations(db=db)
