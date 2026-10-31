from datetime import date
from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.billing_service import BillingService
from app.core.permissions import require_staff_or_admin

router = APIRouter(prefix="/billing", tags=["Billing Engine"])


class BillingRunRequest(BaseModel):
    as_of_date: date
    dry_run: bool = False


class BillingRunItem(BaseModel):
    subscription_number: str
    status: str
    invoice_number: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    total: Optional[int] = None
    reason: Optional[str] = None
    dry_run: Optional[bool] = None


class BillingRunResponse(BaseModel):
    created: int
    skipped: int
    failed: int
    items: List[Dict[str, Any]]


@router.post("/run", response_model=BillingRunResponse)
def run_billing(
    data: BillingRunRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    result = BillingService.run_billing(
        db=db,
        as_of_date=data.as_of_date,
        dry_run=data.dry_run
    )
    return result
