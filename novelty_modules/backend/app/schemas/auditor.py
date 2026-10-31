"""N2 — Integrity Auditor Pydantic schemas."""
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class AuditFindingOut(BaseModel):
    id: str
    category: str
    severity: str
    description: str
    entity_type: str
    entity_id: str
    detail: Optional[Dict[str, Any]]

    model_config = ConfigDict(from_attributes=True)


class AuditRunOut(BaseModel):
    id: str
    started_at: datetime
    completed_at: Optional[datetime]
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    info: int
    findings: List[AuditFindingOut] = []

    model_config = ConfigDict(from_attributes=True)


class AuditRunListResponse(BaseModel):
    items: List[AuditRunOut]
    total: int
