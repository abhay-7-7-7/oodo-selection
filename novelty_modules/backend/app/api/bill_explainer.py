"""N4 — Bill-Change Explainer API Router."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.bill_explainer import BillExplainRequest, BillExplainResponse
from app.services import bill_explainer_service

router = APIRouter()


@router.post("/explain", response_model=BillExplainResponse)
def explain_bill_changes_post(payload: BillExplainRequest):
    """Compare two invoices and generate a plain-English delta breakdown."""
    return bill_explainer_service.explain_invoices(
        prev_invoice_id=payload.prev_invoice_id,
        curr_invoice_id=payload.curr_invoice_id,
    )


@router.get("/explain", response_model=BillExplainResponse)
def explain_bill_changes_get(
    prev_invoice_id: str = Query(...),
    curr_invoice_id: str = Query(...),
):
    """Compare two invoices via query parameters."""
    return bill_explainer_service.explain_invoices(
        prev_invoice_id=prev_invoice_id,
        curr_invoice_id=curr_invoice_id,
    )
