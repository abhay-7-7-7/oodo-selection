"""N5 — Renewal Radar Pydantic schemas."""
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class RenewalSubscriptionOut(BaseModel):
    subscription_id: str
    customer_name: str
    plan_name: str
    expires_at: str
    days_until_expiry: int
    bucket: str  # "7d"|"30d"|"60d"|"expired"
    renewable: bool
    has_open_renewal_quotation: bool
    last_payment_date: Optional[str]
    outstanding_paise: int


class RenewalSubscriptionListResponse(BaseModel):
    items: List[RenewalSubscriptionOut]
    total: int


class RenewalQuotationDraftRequest(BaseModel):
    subscription_id: str
    customer_id: str
    plan_id: str
    quantity: int = 1
    notes: Optional[str] = None


class RenewalQuotationOut(BaseModel):
    id: str
    subscription_id: str
    customer_id: str
    plan_id: str
    quantity: int
    notes: Optional[str]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
