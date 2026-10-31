from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class PaymentCreate(BaseModel):
    method: str = Field(..., min_length=1, max_length=50)
    amount: int = Field(..., gt=0)  # in paise, must be > 0
    paid_on: date
    note: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: int
    invoice_number: Optional[str] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    method: str
    amount: int  # in paise
    paid_on: date
    note: Optional[str] = None
    recorded_by: Optional[int] = None
    source: str
    created_at: datetime


class PaymentRecordResult(BaseModel):
    payment: PaymentResponse
    invoice_status: str
    paid_total: int
    outstanding: int


class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    page: int
    page_size: int
    total: int
