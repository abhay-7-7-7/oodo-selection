from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.outbox import Outbox
from app.schemas.auth import (
    UserSignupRequest,
    UserLoginRequest,
    UserLoginResponse,
    UserResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    StaffCreateRequest,
    OutboxListResponse,
    OutboxItemResponse
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user
from app.core.permissions import require_admin, require_staff_or_admin

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
staff_router = APIRouter(tags=["Staff Management"])
outbox_router = APIRouter(tags=["Outbox Simulation"])


@auth_router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(request: UserSignupRequest, db: Session = Depends(get_db)):
    return AuthService.signup_customer(db, request)


@auth_router.post("/login", response_model=UserLoginResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    return AuthService.login(db, request)


@auth_router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return AuthService.forgot_password(db, request.email)


@auth_router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    return AuthService.reset_password(db, request.token, request.new_password)


@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@staff_router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    request: StaffCreateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return AuthService.create_staff(db, request)


@outbox_router.get("/outbox", response_model=OutboxListResponse)
def list_outbox(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    query = db.query(Outbox).order_by(desc(Outbox.created_at))
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            OutboxItemResponse(
                id=item.id,
                to=item.to_email,
                subject=item.subject,
                body=item.body,
                kind=item.kind,
                related_id=item.related_id,
                created_at=item.created_at
            )
            for item in items
        ],
        "page": page,
        "page_size": page_size,
        "total": total
    }
