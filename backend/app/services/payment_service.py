from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate
from app.services.notification_service import NotificationService


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

        invoice.paid_total += data.amount
        is_fully_paid = invoice.paid_total >= invoice.total
        if is_fully_paid:
            invoice.status = "paid"
        elif invoice.status == "draft":
            invoice.status = "confirmed"

        db.flush()
        new_outstanding = invoice.total - invoice.paid_total

        if is_fully_paid:
            NotificationService.notify_user(
                db=db,
                user_id=invoice.customer_id,
                title="Invoice Fully Paid",
                message=f"Thank you! Payment of ₹{payment.amount/100:.2f} received. Invoice {invoice.number} is now fully paid.",
                category="payment",
                priority="normal",
                related_entity_type="invoice",
                related_entity_id=invoice.id,
                action_url="/portal/invoices",
                event_key=f"payment:{payment.id}:invoice_paid"
            )
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="Invoice Fully Paid",
                message=f"Invoice {invoice.number} for customer {invoice.customer.name} is fully paid (₹{invoice.total/100:.2f}).",
                category="payment",
                priority="normal",
                related_entity_type="invoice",
                related_entity_id=invoice.id,
                action_url=f"/invoices/{invoice.id}",
                event_key_prefix=f"payment:{payment.id}:admin_invoice_paid"
            )
        else:
            NotificationService.notify_user(
                db=db,
                user_id=invoice.customer_id,
                title="Partial Payment Received",
                message=f"Payment of ₹{payment.amount/100:.2f} received for Invoice {invoice.number}. Remaining balance: ₹{new_outstanding/100:.2f}.",
                category="payment",
                priority="normal",
                related_entity_type="invoice",
                related_entity_id=invoice.id,
                action_url="/portal/invoices",
                event_key=f"payment:{payment.id}:partial"
            )
            NotificationService.notify_roles(
                db=db,
                roles=["admin", "staff"],
                title="Partial Payment Received",
                message=f"Partial payment of ₹{payment.amount/100:.2f} received for Invoice {invoice.number} ({invoice.customer.name}). Remaining: ₹{new_outstanding/100:.2f}.",
                category="payment",
                priority="normal",
                related_entity_type="invoice",
                related_entity_id=invoice.id,
                action_url=f"/invoices/{invoice.id}",
                event_key_prefix=f"payment:{payment.id}:admin_partial"
            )

        db.commit()
        db.refresh(payment)
        db.refresh(invoice)

        return {
            "payment": payment,
            "invoice_status": invoice.status,
            "paid_total": invoice.paid_total,
            "outstanding": new_outstanding
        }
