from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate


def utcnow():
    return datetime.now(timezone.utc)


class PaymentService:
    @staticmethod
    def record_payment(
        db: Session,
        invoice_id: int,
        data: PaymentCreate,
        current_user_id: Optional[int] = None
    ) -> dict:
        invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found."
            )

        if invoice.status == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot record payment against a cancelled invoice."
            )

        if data.amount <= 0:
            raise HTTPException(
                status_code=422,
                detail="Payment amount must be greater than zero."
            )

        outstanding = invoice.total - invoice.paid_total
        if data.amount > outstanding:
            raise HTTPException(
                status_code=422,
                detail=f"Payment amount ({data.amount} paise) exceeds the outstanding invoice balance ({outstanding} paise)."
            )

        payment = Payment(
            invoice_id=invoice.id,
            method=data.method.strip(),
            amount=data.amount,
            paid_on=data.paid_on,
            note=data.note,
            recorded_by=current_user_id,
            source="manual"
        )
        db.add(payment)

        # Update paid_total and status
        invoice.paid_total += data.amount
        if invoice.paid_total >= invoice.total:
            invoice.status = "paid"
        elif invoice.status == "draft":
            invoice.status = "confirmed"

        db.commit()
        db.refresh(payment)
        db.refresh(invoice)

        new_outstanding = invoice.total - invoice.paid_total

        return {
            "payment": payment,
            "invoice_status": invoice.status,
            "paid_total": invoice.paid_total,
            "outstanding": new_outstanding
        }
