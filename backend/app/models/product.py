from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(100), nullable=False, default="software")
    sales_price = Column(Integer, nullable=False)  # in paise
    cost_price = Column(Integer, nullable=False)   # in paise
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    variants = relationship("Variant", back_populates="product", cascade="all, delete-orphan")
    discounts = relationship("Discount", back_populates="product")


class Variant(Base):
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute = Column(String(100), nullable=False)
    value = Column(String(100), nullable=False)
    price_extra = Column(Integer, nullable=False, default=0)  # in paise

    product = relationship("Product", back_populates="variants")
