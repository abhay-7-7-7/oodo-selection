from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, UniqueConstraint, Index, Text
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(64), unique=True, index=True, nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    status = Column(String(50), nullable=False, default="draft", index=True)  # draft, confirmed, paid, cancelled
    subtotal = Column(Integer, nullable=False)        # in paise
    discount_total = Column(Integer, nullable=False, default=0)  # in paise
    tax_total = Column(Integer, nullable=False, default=0)       # in paise
    total = Column(Integer, nullable=False)           # in paise
    paid_total = Column(Integer, nullable=False, default=0)      # in paise
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("subscription_id", "period_start", "period_end", name="uq_invoice_subscription_period"),
        Index("ix_invoices_status_due_date", "status", "due_date"),
        Index("ix_invoices_customer_status", "customer_id", "status"),
    )

    # Relationships
    subscription = relationship("Subscription", back_populates="invoices")
    customer = relationship("User", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan", order_by="Payment.paid_on.desc()")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Integer, nullable=False)      # in paise
    base = Column(Integer, nullable=False)            # in paise
    variant_extra = Column(Integer, nullable=False, default=0)  # in paise
    discount = Column(Integer, nullable=False, default=0)       # in paise
    tax = Column(Integer, nullable=False, default=0)            # in paise
    amount = Column(Integer, nullable=False)          # in paise (post-discount + tax)
    snapshot = Column(Text, nullable=True)            # JSON snapshot

    invoice = relationship("Invoice", back_populates="lines")
