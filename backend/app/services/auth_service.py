from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserSignupRequest
from app.core.security import validate_password_strength, get_password_hash


def utcnow():
    return datetime.now(timezone.utc)


class AuthService:
    @staticmethod
    def signup_customer(db: Session, request: UserSignupRequest) -> User:
        email_clean = request.email.lower().strip()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )

        validate_password_strength(request.password)
        hashed_password = get_password_hash(request.password)

        user = User(
            name=request.name.strip(),
            email=email_clean,
            password_hash=hashed_password,
            role="customer",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
