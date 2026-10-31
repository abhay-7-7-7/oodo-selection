from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    price = Column(Integer, nullable=False)  # in paise
    period = Column(String(50), nullable=False)  # daily, weekly, monthly, yearly
    min_qty = Column(Integer, nullable=False, default=1)
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)
    auto_close = Column(Boolean, nullable=False, default=False)
    closable = Column(Boolean, nullable=False, default=True)
    pausable = Column(Boolean, nullable=False, default=True)
    renewable = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
    quotation_templates = relationship("QuotationTemplate", back_populates="plan")
