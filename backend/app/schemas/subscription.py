from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class SubscriptionLineCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    tax_id: Optional[int] = None


class SubscriptionLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: Optional[str] = None
    variant_id: Optional[int] = None
    variant_value: Optional[str] = None
    quantity: int
    unit_price: int  # in paise
    tax_id: Optional[int] = None
    tax_rate: Optional[Decimal] = None
    amount: int      # in paise


class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    template_id: Optional[int] = None
    start_date: date
    payment_terms: str = Field(default="due_on_receipt")  # due_on_receipt, net_15, net_30
    lines: Optional[List[SubscriptionLineCreate]] = None


class SubscriptionUpdate(BaseModel):
    payment_terms: Optional[str] = None
    lines: Optional[List[SubscriptionLineCreate]] = None


class SubscriptionTransitionRequest(BaseModel):
    to: str


class SubscriptionCloseRequest(BaseModel):
    reason: Optional[str] = "Customer requested cancellation"


class SubscriptionAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subscription_id: int
    from_status: str
    to_status: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    at: datetime


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    plan_id: int
    plan_name: Optional[str] = None
    plan_period: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    payment_terms: str
    status: str
    next_billing_date: Optional[date] = None
    is_paused: bool
    paused_at: Optional[datetime] = None
    recurring_amount: int = 0  # in paise
    created_at: datetime
    updated_at: datetime
    lines: List[SubscriptionLineResponse] = []
    audits: List[SubscriptionAuditResponse] = []


class SubscriptionListResponse(BaseModel):
    items: List[SubscriptionResponse]
    page: int
    page_size: int
    total: int
