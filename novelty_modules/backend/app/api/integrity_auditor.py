"""N2 — Billing Integrity Auditor API Router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auditor import AuditRunOut, AuditRunListResponse
from app.services import auditor_service

router = APIRouter()


@router.post("/run", response_model=AuditRunOut)
def trigger_audit_endpoint(
    db: Session = Depends(get_db),
):
    """Trigger a new integrity audit scan across subscriptions, invoices, and payments."""
    run = auditor_service.run_audit(db=db)
    # Refresh to ensure findings are loaded
    return auditor_service.get_run_with_findings(db=db, run_id=run.id) or run


@router.get("/runs", response_model=AuditRunListResponse)
def list_audit_runs_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve historical audit runs and their findings."""
    return auditor_service.list_runs(db=db, skip=skip, limit=limit)


@router.get("/runs/{run_id}", response_model=AuditRunOut)
def get_audit_run_endpoint(
    run_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve details and findings of a specific audit run."""
    run = auditor_service.get_run_with_findings(db=db, run_id=run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Audit run '{run_id}' not found")
    return run
