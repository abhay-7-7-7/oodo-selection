"""N6 — Reminder Centre ORM models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON, UniqueConstraint

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class ReminderSettings(Base):
    __tablename__ = "reminder_settings"

    id = Column(Integer, primary_key=True, default=1)
    invoice_due_days_before = Column(JSON, nullable=False, default=lambda: [7, 3, 1])
    overdue_repeat_days = Column(Integer, nullable=False, default=3)
    expiry_days_before = Column(JSON, nullable=False, default=lambda: [30, 7])
    enabled = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReminderRecord(Base):
    __tablename__ = "reminder_records"

    id = Column(String, primary_key=True, default=_uuid)
    kind = Column(String, nullable=False)
    recipient_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    scheduled_at = Column(DateTime, nullable=False)
    sent_at = Column(DateTime, nullable=True)
    error_message = Column(String, nullable=True)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("kind", "entity_id", "scheduled_at", name="uq_reminder_dedup"),
    )
