from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, PasswordResetToken
from app.models.outbox import Outbox
from app.schemas.auth import UserSignupRequest, UserLoginRequest, StaffCreateRequest
from app.core.security import (
    validate_password_strength,
    get_password_hash,
    verify_password,
    create_access_token,
    generate_reset_token,
    hash_token,
)
from app.config import settings
from app.services.notification_service import NotificationService


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
        hashed_pw = get_password_hash(request.password)
        
        user = User(
            name=request.name.strip(),
            email=email_clean,
            password_hash=hashed_pw,
            role="customer",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        NotificationService.notify_user(
            db=db,
            user_id=user.id,
            title="Welcome to Brightloop Software",
            message=f"Welcome {user.name}! Your account has been registered successfully.",
            category="account",
            priority="normal",
            related_entity_type="user",
            related_entity_id=user.id,
            action_url="/portal/account",
            event_key=f"user:{user.id}:welcome"
        )

        NotificationService.notify_roles(
            db=db,
            roles=["admin", "staff"],
            title="New Customer Registration",
            message=f"New customer {user.name} ({user.email}) has registered.",
            category="account",
            priority="normal",
            related_entity_type="user",
            related_entity_id=user.id,
            action_url=f"/customers/{user.id}",
            event_key_prefix=f"user:{user.id}:admin_registered"
        )
        db.commit()
        return user

    @staticmethod
    def login(db: Session, request: UserLoginRequest) -> dict:
        email_clean = request.email.lower().strip()
        user = db.query(User).filter(User.email == email_clean).first()
        if not user or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account has been disabled.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "name": user.name
        })
        return {
            "token": token,
            "token_type": "bearer",
            "role": user.role,
            "name": user.name,
            "user": user
        }

    @staticmethod
    def forgot_password(db: Session, email: str) -> dict:
        email_clean = email.lower().strip()
        user = db.query(User).filter(User.email == email_clean).first()
        if user and user.is_active:
            raw_token = generate_reset_token()
            t_hash = hash_token(raw_token)
            expires = utcnow() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
            
            # Invalidate previous tokens so only the newest link is valid
            db.query(PasswordResetToken).filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at.is_(None)
            ).update({"used_at": utcnow()})
            
            reset_record = PasswordResetToken(
                user_id=user.id,
                token_hash=t_hash,
                expires_at=expires
            )
            db.add(reset_record)
            db.flush()

            NotificationService.notify_user(
                db=db,
                user_id=user.id,
                title="Password Reset Requested",
                message="A password reset link was requested for your account. If this was not you, please secure your account immediately.",
                category="account",
                priority="high",
                related_entity_type="user",
                related_entity_id=user.id,
                action_url="/portal/account",
                event_key=f"user:{user.id}:pw_reset:{reset_record.id}"
            )
            
            reset_url = f"http://localhost:8000/reset-password?token={raw_token}"
            outbox_entry = Outbox(
                to_email=user.email,
                subject="Reset your Brightloop password",
                body=f"Click this link to reset your password: {reset_url}",
                kind="password_reset",
                related_id=user.id
            )
            db.add(outbox_entry)
            db.commit()
            
        return {"detail": "If the account exists, a password reset link has been sent."}

    @staticmethod
    def reset_password(db: Session, raw_token: str, new_password: str) -> dict:
        t_hash = hash_token(raw_token.strip())
        record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == t_hash).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token."
            )
        
        now = utcnow()
        # Ensure record.expires_at is timezone-aware for comparison
        record_exp = record.expires_at
        if record_exp.tzinfo is None:
            record_exp = record_exp.replace(tzinfo=timezone.utc)
            
        if record.used_at is not None or record_exp < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token is invalid, expired or already used."
            )
        
        validate_password_strength(new_password)
        
        user = db.query(User).filter(User.id == record.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        
        user.password_hash = get_password_hash(new_password)
        record.used_at = now
        db.commit()
        return {"detail": "Password has been successfully reset."}

    @staticmethod
    def create_staff(db: Session, request: StaffCreateRequest) -> User:
        email_clean = request.email.lower().strip()
        existing = db.query(User).filter(User.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )
        
        validate_password_strength(request.password)
        hashed_pw = get_password_hash(request.password)
        
        staff_user = User(
            name=request.name.strip(),
            email=email_clean,
            password_hash=hashed_pw,
            role="staff",
            is_active=True
        )
        db.add(staff_user)
        db.commit()
        db.refresh(staff_user)

        NotificationService.notify_roles(
            db=db,
            roles=["admin"],
            title="New Staff Account Created",
            message=f"Staff account created for {staff_user.name} ({staff_user.email}).",
            category="account",
            priority="normal",
            related_entity_type="user",
            related_entity_id=staff_user.id,
            action_url=f"/team/{staff_user.id}",
            event_key_prefix=f"staff:{staff_user.id}:created"
        )

        NotificationService.notify_user(
            db=db,
            user_id=staff_user.id,
            title="Welcome to Brightloop Staff Portal",
            message=f"Welcome {staff_user.name}! Your staff account is active.",
            category="account",
            priority="normal",
            related_entity_type="user",
            related_entity_id=staff_user.id,
            action_url="/staff/dashboard",
            event_key=f"user:{staff_user.id}:welcome_staff"
        )
        db.commit()
        return staff_user
