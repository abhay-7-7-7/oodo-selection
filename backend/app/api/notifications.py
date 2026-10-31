from typing import Optional
from fastapi import APIRouter, Depends, Query, status, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.core.dependencies import get_current_user
from app.core.permissions import require_admin
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
    NotificationPreferencesResponse,
    NotificationPreferencesUpdate,
    ScheduledRunRequest,
    ScheduledRunResponse
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def get_notifications(
    category: Optional[str] = Query(None, description="Filter by category (e.g. invoice, payment, subscription, quotation, account, system)"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, normal, high, critical)"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns paginated notifications for the authenticated user.
    Customer isolation is enforced: users can only see notifications sent to their own user_id.
    """
    return NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        category=category,
        is_read=is_read,
        priority=priority,
        page=page,
        page_size=page_size
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns total unread notifications count for the authenticated user.
    """
    count = NotificationService.get_unread_count(db, current_user.id)
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks a single notification as read for the authenticated user.
    Returns 403 Forbidden if the notification belongs to another user.
    """
    return NotificationService.mark_as_read(db, current_user.id, notification_id)


@router.patch("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks all unread notifications for the authenticated user as read.
    """
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return {
        "message": f"{count} notifications marked as read.",
        "updated_count": count
    }


@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Dismisses / deletes a notification for the authenticated user.
    Returns 403 Forbidden if the notification belongs to another user.
    """
    NotificationService.delete_notification(db, current_user.id, notification_id)
    return {"detail": "Notification deleted successfully."}


@router.get("/preferences", response_model=NotificationPreferencesResponse)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns notification preferences across all available categories for the authenticated user.
    """
    prefs = NotificationService.get_user_preferences(db, current_user.id)
    return {"preferences": prefs}


@router.put("/preferences", response_model=NotificationPreferencesResponse)
def update_notification_preferences(
    data: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates notification category preferences for the authenticated user.
    Essential account security and system integrity categories cannot be disabled.
    """
    updated = NotificationService.update_user_preferences(
        db=db,
        user_id=current_user.id,
        preferences_list=[p.model_dump() for p in data.preferences]
    )
    return {"preferences": updated}


@router.post("/run-scheduled", response_model=ScheduledRunResponse)
def run_scheduled_notifications(
    data: Optional[ScheduledRunRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    ADMIN ONLY: Triggers scheduled date-based notification checks.
    Evaluates:
    - Invoices: 3 days before due date, 1 day overdue, 7 days overdue, 15 days overdue.
    - Subscriptions: 30 days, 7 days, 1 day before expiry.
    - Quotations: 3 days and 1 day before expiry, and expired quotations.
    Guaranteed idempotent through database unique event keys.
    """
    as_of = data.as_of_date if data else None
    result = NotificationService.run_scheduled_checks(db, as_of_date=as_of)
    return result
