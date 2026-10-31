from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class InvoiceLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: int
    description: str
    quantity: int
    unit_price: int      # in paise
    base: int            # in paise
    variant_extra: int   # in paise
    discount: int        # in paise
    tax: int             # in paise
    amount: int          # in paise
    snapshot: Optional[str] = None


class InvoicePaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    method: str
    amount: int
    paid_on: date
    note: Optional[str] = None


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: str
    subscription_id: int
    subscription_number: Optional[str] = None
    customer_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    period_start: date
    period_end: date
    issue_date: date
    due_date: date
    status: str
    subtotal: int
    discount_total: int
    tax_total: int
    total: int
    paid_total: int
    outstanding: int
    is_overdue: bool
    created_at: datetime
    lines: List[InvoiceLineResponse] = []
    payments: List[InvoicePaymentResponse] = []


class InvoicePrintCustomer(BaseModel):
    name: str
    email: str


class InvoicePrintResponse(BaseModel):
    invoice_number: str
    customer: InvoicePrintCustomer
    subscription_number: str
    issue_date: date
    due_date: date
    status: str
    subtotal: int
    discount_total: int
    tax_total: int
    total: int
    paid_total: int
    outstanding: int
    lines: List[InvoiceLineResponse] = []


class InvoiceListResponse(BaseModel):
    items: List[InvoiceResponse]
    page: int
    page_size: int
    total: int
