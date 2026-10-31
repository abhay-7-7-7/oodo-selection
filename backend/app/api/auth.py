from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import UserSignupRequest, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(data: UserSignupRequest, db: Session = Depends(get_db)):
    """Registers a new customer account with password validation and case-insensitive email uniqueness."""
    return AuthService.signup_customer(db, data)
