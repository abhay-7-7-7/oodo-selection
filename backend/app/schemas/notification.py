from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    message: str
    category: str
    priority: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None
    action_url: Optional[str] = None
    event_key: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    page: int
    page_size: int
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class NotificationPreferenceItem(BaseModel):
    category: str
    enabled: bool


class NotificationPreferencesResponse(BaseModel):
    preferences: List[NotificationPreferenceItem]


class NotificationPreferencesUpdate(BaseModel):
    preferences: List[NotificationPreferenceItem]


class ScheduledRunRequest(BaseModel):
    as_of_date: Optional[date] = None


class ScheduledRunResponse(BaseModel):
    notifications_created: int
    as_of_date: date
    details: List[str] = []
