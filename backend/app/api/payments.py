from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.payment import Payment
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentListResponse,
    PaymentRecordResult
)
from app.services.payment_service import PaymentService
from app.core.permissions import require_staff_or_admin

payments_router = APIRouter(prefix="/payments", tags=["Payment Management"])
invoice_payments_router = APIRouter(prefix="/invoices", tags=["Invoice Payments"])


@invoice_payments_router.post("/{id}/payments", response_model=PaymentRecordResult, status_code=status.HTTP_201_CREATED)
def record_payment(
    id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    result = PaymentService.record_payment(
        db=db,
        invoice_id=id,
        data=data,
        current_user_id=user.id
    )

    p = result["payment"]
    payment_resp = PaymentResponse(
        id=p.id,
        invoice_id=p.invoice_id,
        invoice_number=p.invoice.number if p.invoice else None,
        customer_id=p.invoice.customer_id if p.invoice else None,
        customer_name=p.invoice.customer.name if (p.invoice and p.invoice.customer) else None,
        method=p.method,
        amount=p.amount,
        paid_on=p.paid_on,
        note=p.note,
        recorded_by=p.recorded_by,
        source=p.source,
        created_at=p.created_at
    )

    return PaymentRecordResult(
        payment=payment_resp,
        invoice_status=result["invoice_status"],
        paid_total=result["paid_total"],
        outstanding=result["outstanding"]
    )


@payments_router.get("", response_model=PaymentListResponse)
def list_payments(
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    method: Optional[str] = Query(None),
    invoice_id: Optional[int] = Query(None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    query = db.query(Payment).join(Invoice, Payment.invoice_id == Invoice.id)

    if from_date:
        query = query.filter(Payment.paid_on >= from_date)
    if to_date:
        query = query.filter(Payment.paid_on <= to_date)
    if method:
        query = query.filter(Payment.method.ilike(method.strip()))
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)

    total = query.count()
    items = query.order_by(desc(Payment.paid_on), desc(Payment.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    resp_items = [
        PaymentResponse(
            id=p.id,
            invoice_id=p.invoice_id,
            invoice_number=p.invoice.number if p.invoice else None,
            customer_id=p.invoice.customer_id if p.invoice else None,
            customer_name=p.invoice.customer.name if (p.invoice and p.invoice.customer) else None,
            method=p.method,
            amount=p.amount,
            paid_on=p.paid_on,
            note=p.note,
            recorded_by=p.recorded_by,
            source=p.source,
            created_at=p.created_at
        )
        for p in items
    ]

    return {
        "items": resp_items,
        "page": page,
        "page_size": page_size,
        "total": total
    }
