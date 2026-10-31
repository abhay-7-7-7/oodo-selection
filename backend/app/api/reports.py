from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.reports import FinancialSummaryResponse, OverdueInvoicesResponse
from app.services.report_service import ReportService
from app.core.permissions import require_staff_or_admin

router = APIRouter(prefix="/reports", tags=["Finance Reporting"])


@router.get("/summary", response_model=FinancialSummaryResponse)
def get_financial_summary(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    return ReportService.get_financial_summary(db, from_date=from_date, to_date=to_date)


@router.get("/overdue", response_model=OverdueInvoicesResponse)
def get_overdue_invoices(
    min_days_late: int = Query(default=0, ge=0),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    return ReportService.get_overdue_invoices(
        db,
        min_days_late=min_days_late,
        page=page,
        page_size=page_size
    )
