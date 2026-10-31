"""N3 — Split-Payment Bank Matcher API Router."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.bank_matcher import (
    UploadCSVResponse,
    ApproveMatchRequest,
    ReconciliationOut,
    BankTransactionOut,
)
from app.services import bank_matcher_service

router = APIRouter()


@router.post("/upload-csv", response_model=UploadCSVResponse)
async def upload_csv_file(
    file: UploadFile = File(None),
    content: Optional[str] = Body(None),
    db: Session = Depends(get_db),
):
    """Upload a bank statement CSV and run subset-sum matching algorithms against open invoices."""
    csv_text = ""
    if file:
        file_bytes = await file.read()
        csv_text = file_bytes.decode("utf-8", errors="ignore")
    elif content:
        csv_text = content
    else:
        raise HTTPException(status_code=400, detail="No CSV file or content provided")

    result = bank_matcher_service.parse_and_upload(
        db=db,
        csv_content=csv_text,
    )
    return result


@router.get("/transactions")
def list_transactions_endpoint(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List uploaded bank transactions with optional status filter."""
    return bank_matcher_service.list_transactions(db=db, status=status)


@router.post("/reconcile", response_model=List[ReconciliationOut])
def reconcile_matches_endpoint(
    payload: ApproveMatchRequest,
    db: Session = Depends(get_db),
):
    """Approve suggested matches and record reconciliations."""
    return bank_matcher_service.approve_matches(db=db, matches=payload.matches)


@router.get("/history")
def list_history_endpoint(
    db: Session = Depends(get_db),
):
    """Retrieve history of reconciled bank transactions."""
    return bank_matcher_service.list_reconciliation_history(db=db)
