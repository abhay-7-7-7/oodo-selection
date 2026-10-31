from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Discount(Base):
    __tablename__ = "discounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    kind = Column(String(50), nullable=False)  # 'fixed' or 'percent'
    value = Column(Integer, nullable=False)    # paise for fixed, percentage (e.g. 10) for percent
    min_amount = Column(Integer, nullable=False, default=0)  # in paise
    min_qty = Column(Integer, nullable=False, default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    usage_limit = Column(Integer, nullable=False)
    times_used = Column(Integer, nullable=False, default=0)
    scope = Column(String(50), nullable=False)  # 'product' or 'subscription'
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="discounts")
