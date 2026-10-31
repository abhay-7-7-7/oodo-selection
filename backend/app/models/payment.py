from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False, index=True)
    method = Column(String(50), nullable=False)  # UPI, card, bank_transfer, net_banking, cash
    amount = Column(Integer, nullable=False)     # in paise
    paid_on = Column(Date, nullable=False, index=True)
    note = Column(Text, nullable=True)
    recorded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source = Column(String(50), nullable=False, default="manual")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_payments_invoice_paid_on", "invoice_id", "paid_on"),
    )

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    recorder = relationship("User")
