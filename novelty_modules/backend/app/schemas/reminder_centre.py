"""N6 — Reminder Centre Pydantic schemas."""
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class ReminderSettingsOut(BaseModel):
    id: int
    invoice_due_days_before: List[int]
    overdue_repeat_days: int
    expiry_days_before: List[int]
    enabled: bool
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ReminderSettingsUpdate(BaseModel):
    invoice_due_days_before: Optional[List[int]] = None
    overdue_repeat_days: Optional[int] = None
    expiry_days_before: Optional[List[int]] = None
    enabled: Optional[bool] = None


class ReminderRecordOut(BaseModel):
    id: str
    kind: str
    recipient_email: str
    subject: str
    status: str
    scheduled_at: datetime
    sent_at: Optional[datetime]
    error_message: Optional[str]
    entity_type: str
    entity_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReminderRunSummary(BaseModel):
    run_at: datetime
    sent: int
    skipped: int
    failed: int
    details: List[ReminderRecordOut]


class UpcomingReminder(BaseModel):
    kind: str
    entity_type: str
    entity_id: str
    recipient_email: str
    scheduled_at: datetime
    days_until: int
