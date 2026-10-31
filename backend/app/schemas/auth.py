from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserSignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=9)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = ""
    company: Optional[str] = ""
    is_active: bool = True
    created_at: Optional[datetime] = None


class UserLoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    role: str
    name: str
    user: Optional[UserResponse] = None


class CustomerProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str = "customer"
    phone: Optional[str] = ""
    company: Optional[str] = ""
    active_subscriptions: int = 0
    total_billed: int = 0
    outstanding_balance: int = 0
    status: str = "active"
    is_active: bool = True
    created_at: Optional[datetime] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=9)


class StaffCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=9)


class OutboxItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    to: str
    subject: str
    body: str
    kind: str
    related_id: Optional[int] = None
    created_at: datetime


class OutboxListResponse(BaseModel):
    items: List[OutboxItemResponse]
    page: int
    page_size: int
    total: int


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=9)
