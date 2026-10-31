from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status, HTTPException
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
    ProfileUpdateRequest,
    ChangePasswordRequest,
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


@auth_router.put("/profile", response_model=UserResponse)
def update_profile(
    request: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if request.name is not None and request.name.strip():
        current_user.name = request.name.strip()
    if request.phone is not None:
        current_user.phone = request.phone.strip()
    if request.company is not None:
        current_user.company = request.company.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@auth_router.post("/change-password", response_model=MessageResponse)
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.security import verify_password, validate_password_strength, get_password_hash
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match."
        )
    validate_password_strength(request.new_password)
    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@staff_router.get("/staff", response_model=List[UserResponse])
def list_staff(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    return db.query(User).filter(User.role.in_(["admin", "staff"])).order_by(User.id).all()


@staff_router.put("/staff/{user_id}/status", response_model=UserResponse)
def toggle_staff_status(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Staff user not found.")
    if user.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot modify status of your own admin account.")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user
