from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from app.database import get_db
from app.models.invoice import Invoice, InvoiceLine
from app.models.outbox import Outbox
from app.models.user import User
from app.schemas.invoice import (
    InvoiceResponse,
    InvoiceListResponse,
    InvoiceLineResponse,
    InvoicePaymentResponse,
    InvoicePrintResponse,
    InvoicePrintCustomer
)
from app.schemas.common import MessageResponse
from app.core.dependencies import get_current_user
from app.core.permissions import require_staff_or_admin

router = APIRouter(prefix="/invoices", tags=["Invoice Management"])


def serialize_invoice(inv: Invoice) -> InvoiceResponse:
    today = date.today()
    outstanding = inv.total - inv.paid_total
    is_overdue = (inv.due_date < today) and (outstanding > 0) and (inv.status != "cancelled")

    lines = [
        InvoiceLineResponse(
            id=line.id,
            invoice_id=line.invoice_id,
            description=line.description,
            quantity=line.quantity,
            unit_price=line.unit_price,
            base=line.base,
            variant_extra=line.variant_extra,
            discount=line.discount,
            tax=line.tax,
            amount=line.amount,
            snapshot=line.snapshot
        )
        for line in inv.lines
    ]

    payments = [
        InvoicePaymentResponse(
            id=p.id,
            method=p.method,
            amount=p.amount,
            paid_on=p.paid_on,
            note=p.note
        )
        for p in inv.payments
    ]

    return InvoiceResponse(
        id=inv.id,
        number=inv.number,
        subscription_id=inv.subscription_id,
        subscription_number=inv.subscription.number if inv.subscription else None,
        customer_id=inv.customer_id,
        customer_name=inv.customer.name if inv.customer else None,
        customer_email=inv.customer.email if inv.customer else None,
        period_start=inv.period_start,
        period_end=inv.period_end,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        status=inv.status,
        subtotal=inv.subtotal,
        discount_total=inv.discount_total,
        tax_total=inv.tax_total,
        total=inv.total,
        paid_total=inv.paid_total,
        outstanding=outstanding,
        is_overdue=is_overdue,
        created_at=inv.created_at,
        lines=lines,
        payments=payments
    )


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    status_filter: Optional[str] = Query(None, alias="status"),
    overdue: Optional[bool] = Query(None),
    customer_id: Optional[int] = Query(None),
    from_date: Optional[date] = Query(None, alias="from"),
    to_date: Optional[date] = Query(None, alias="to"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    query = db.query(Invoice)

    if status_filter:
        query = query.filter(Invoice.status == status_filter.lower().strip())
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    if from_date:
        query = query.filter(Invoice.issue_date >= from_date)
    if to_date:
        query = query.filter(Invoice.issue_date <= to_date)
    if overdue is True:
        today = date.today()
        query = query.filter(
            Invoice.status != "cancelled",
            Invoice.due_date < today,
            (Invoice.total - Invoice.paid_total) > 0
        )

    total = query.count()
    items = query.order_by(desc(Invoice.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [serialize_invoice(inv) for inv in items],
        "page": page,
        "page_size": page_size,
        "total": total
    }


@router.get("/{id}", response_model=InvoiceResponse)
def get_invoice_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    # Ownership check: Customer can only view their own invoices
    if current_user.role == "customer" and inv.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this invoice."
        )

    return serialize_invoice(inv)


@router.post("/{id}/confirm", response_model=InvoiceResponse)
def confirm_invoice(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    if inv.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only draft invoices can be confirmed. Current status: '{inv.status}'."
        )

    inv.status = "confirmed"
    db.commit()
    db.refresh(inv)
    return serialize_invoice(inv)


@router.post("/{id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    if inv.status == "paid":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot cancel an invoice that has already been paid."
        )
    if inv.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invoice is already cancelled."
        )

    inv.status = "cancelled"
    db.commit()
    db.refresh(inv)
    return serialize_invoice(inv)


@router.post("/{id}/send", response_model=MessageResponse)
def send_invoice(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    if inv.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Only confirmed invoices can be sent. Current status: '{inv.status}'."
        )

    # Format email body with details
    body_text = (
        f"Dear {inv.customer.name},\n\n"
        f"Please find your invoice details below:\n"
        f"Invoice Number: {inv.number}\n"
        f"Subscription: {inv.subscription.number}\n"
        f"Billing Period: {inv.period_start} to {inv.period_end}\n"
        f"Due Date: {inv.due_date}\n"
        f"Total Amount Due: {inv.total} paise (₹{inv.total / 100:.2f})\n\n"
        f"Thank you for choosing Brightloop Software."
    )

    outbox_entry = Outbox(
        to_email=inv.customer.email,
        subject=f"Your Brightloop Software Invoice {inv.number}",
        body=body_text,
        kind="invoice",
        related_id=inv.id
    )
    db.add(outbox_entry)
    db.commit()

    return {"detail": f"Invoice {inv.number} has been queued to Outbox for {inv.customer.email}."}


@router.get("/{id}/print", response_model=InvoicePrintResponse)
def print_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )

    # Ownership check
    if current_user.role == "customer" and inv.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to print this invoice."
        )

    lines = [
        InvoiceLineResponse(
            id=line.id,
            invoice_id=line.invoice_id,
            description=line.description,
            quantity=line.quantity,
            unit_price=line.unit_price,
            base=line.base,
            variant_extra=line.variant_extra,
            discount=line.discount,
            tax=line.tax,
            amount=line.amount,
            snapshot=line.snapshot
        )
        for line in inv.lines
    ]

    return InvoicePrintResponse(
        invoice_number=inv.number,
        customer=InvoicePrintCustomer(
            name=inv.customer.name,
            email=inv.customer.email
        ),
        subscription_number=inv.subscription.number,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        status=inv.status,
        subtotal=inv.subtotal,
        discount_total=inv.discount_total,
        tax_total=inv.tax_total,
        total=inv.total,
        paid_total=inv.paid_total,
        outstanding=inv.total - inv.paid_total,
        lines=lines
    )
