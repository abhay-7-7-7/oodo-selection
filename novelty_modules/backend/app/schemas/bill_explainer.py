"""N4 — Bill Explainer Pydantic schemas (stateless — no DB model)."""
from typing import Optional, List, Union
from pydantic import BaseModel


class BillLineChangeOut(BaseModel):
    field: str
    label: str
    previous: Optional[Union[int, float, str]]
    current: Optional[Union[int, float, str]]
    delta_paise: int
    explanation: str


class BillExplainRequest(BaseModel):
    prev_invoice_id: str
    curr_invoice_id: str


class BillExplainResponse(BaseModel):
    previous_invoice_id: str
    current_invoice_id: str
    previous_total_paise: int
    current_total_paise: int
    total_delta_paise: int
    changes: List[BillLineChangeOut]
    human_summary: str
