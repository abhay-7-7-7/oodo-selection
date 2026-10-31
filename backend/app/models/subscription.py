from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String(64), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True, index=True)
    payment_terms = Column(String(50), nullable=False, default="due_on_receipt")  # due_on_receipt, net_15, net_30
    status = Column(String(50), nullable=False, default="draft", index=True)  # draft, quotation, confirmed, active, closed
    next_billing_date = Column(Date, nullable=True, index=True)
    is_paused = Column(Boolean, nullable=False, default=False)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Indexes
    __table_args__ = (
        Index("ix_subscriptions_status_next_billing", "status", "next_billing_date"),
        Index("ix_subscriptions_customer_status", "customer_id", "status"),
    )

    # Relationships
    customer = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan")
    audits = relationship("SubscriptionAudit", back_populates="subscription", cascade="all, delete-orphan", order_by="SubscriptionAudit.at.asc()")
    invoices = relationship("Invoice", back_populates="subscription")


class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    variant_id = Column(Integer, ForeignKey("variants.id", ondelete="RESTRICT"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Integer, nullable=False)  # in paise
    tax_id = Column(Integer, ForeignKey("taxes.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Integer, nullable=False)      # in paise (subtotal before discounts/taxes or base amount)

    # Relationships
    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product")
    variant = relationship("Variant")
    tax = relationship("Tax", back_populates="subscription_lines")
