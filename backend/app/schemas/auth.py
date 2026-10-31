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


class UserLoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    role: str
    name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
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
