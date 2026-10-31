from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # invoice, payment, subscription, quotation, account, system
    priority = Column(String(20), nullable=False, default="normal")  # low, normal, high, critical
    related_entity_type = Column(String(50), nullable=True)  # invoice, subscription, payment, quotation, user
    related_entity_id = Column(Integer, nullable=True)
    action_url = Column(String(255), nullable=True)
    event_key = Column(String(255), nullable=False, index=True)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "event_key", name="uq_notification_user_event_key"),
        Index("ix_notifications_user_is_read_created", "user_id", "is_read", "created_at"),
    )

    user = relationship("User", back_populates="notifications")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False)  # invoice, payment, subscription, quotation, account, system
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "category", name="uq_user_notification_category"),
    )

    user = relationship("User", back_populates="notification_preferences")
