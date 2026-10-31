"""N6 — Automatic Reminder Centre API Router."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.reminder_centre import (
    ReminderSettingsOut,
    ReminderSettingsUpdate,
    ReminderRunSummary,
    UpcomingReminder,
    ReminderRecordOut,
)
from app.services import reminder_centre_service

router = APIRouter()


@router.get("/settings", response_model=ReminderSettingsOut)
def get_reminder_settings_endpoint(
    db: Session = Depends(get_db),
):
    """Retrieve cadence and automation settings for reminders."""
    return reminder_centre_service.get_settings(db=db)


@router.put("/settings", response_model=ReminderSettingsOut)
def update_reminder_settings_endpoint(
    payload: ReminderSettingsUpdate,
    db: Session = Depends(get_db),
):
    """Update cadence and automation settings for reminders."""
    return reminder_centre_service.update_settings(
        db=db,
        updates=payload.model_dump(exclude_unset=True),
    )


@router.post("/run", response_model=ReminderRunSummary)
def trigger_reminders_run_endpoint(
    db: Session = Depends(get_db),
):
    """Trigger an on-demand reminder dispatch run."""
    return reminder_centre_service.run_reminders(db=db)


@router.get("/history")
def get_reminder_history_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve history of dispatched reminders."""
    return reminder_centre_service.get_history(db=db, skip=skip, limit=limit)


@router.get("/upcoming", response_model=List[UpcomingReminder])
def get_upcoming_reminders_endpoint(
    db: Session = Depends(get_db),
):
    """Retrieve scheduled upcoming reminders based on active cadence rules."""
    return reminder_centre_service.get_upcoming(db=db)
