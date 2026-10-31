"""N3 — Bank Matcher Pydantic schemas."""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class BankTransactionIn(BaseModel):
    date: str
    description: str
    amount_paise: int = Field(..., gt=0)
    reference: Optional[str] = None
    payer: Optional[str] = None


class BankTransactionOut(BaseModel):
    id: str
    date: str
    description: str
    amount_paise: int
    reference: Optional[str]
    payer: Optional[str]
    status: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceMatchSuggestion(BaseModel):
    invoice_id: str
    invoice_number: str
    customer_name: str
    invoice_amount_paise: int
    outstanding_paise: int
    confidence: float
    match_reason: str


class MatchProposal(BaseModel):
    transaction_id: str
    transaction_amount_paise: int
    transaction_description: str
    suggestions: List[InvoiceMatchSuggestion]
    multi_invoice_subsets: List[List[InvoiceMatchSuggestion]] = []
    match_type: str  # "exact" | "subset_sum" | "unmatched"


class UploadCSVResponse(BaseModel):
    uploaded: int
    transactions: List[BankTransactionOut]
    proposals: List[MatchProposal]


class ApproveMatchRequest(BaseModel):
    matches: List[dict]  # [{transaction_id, invoice_ids, amount_paise}]


class ReconciliationOut(BaseModel):
    id: str
    transaction_id: str
    invoice_ids: List[str]
    amount_paise: int
    confidence: float
    match_type: str
    reconciled_at: datetime

    model_config = ConfigDict(from_attributes=True)
