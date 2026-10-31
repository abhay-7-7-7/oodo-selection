from datetime import date
from typing import List
from pydantic import BaseModel


class FinancialSummaryResponse(BaseModel):
    active_subscriptions: int
    revenue_received: int  # in paise
    outstanding: int       # in paise
    overdue_count: int
    mrr: int               # in paise
    query_ms: int


class OverdueInvoiceItem(BaseModel):
    invoice_number: str
    customer_name: str
    total: int        # in paise
    paid_total: int   # in paise
    outstanding: int  # in paise
    due_date: date
    days_late: int


class OverdueInvoicesResponse(BaseModel):
    items: List[OverdueInvoiceItem]
    page: int
    page_size: int
    total: int
