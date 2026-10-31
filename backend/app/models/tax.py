from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Tax(Base):
    __tablename__ = "taxes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rate_percent = Column(Numeric(5, 2), nullable=False)  # 0.00 to 100.00
    applies_to = Column(String(100), nullable=False, default="all")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    subscription_lines = relationship("SubscriptionLine", back_populates="tax")
