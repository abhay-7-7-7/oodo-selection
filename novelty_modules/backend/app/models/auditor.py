"""N2 — Integrity Auditor ORM models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class AuditRun(Base):
    __tablename__ = "audit_runs"

    id = Column(String, primary_key=True, default=_uuid)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    total_findings = Column(Integer, default=0)
    critical = Column(Integer, default=0)
    high = Column(Integer, default=0)
    medium = Column(Integer, default=0)
    low = Column(Integer, default=0)
    info = Column(Integer, default=0)
    triggered_by_user_id = Column(Integer, nullable=True)


class AuditFinding(Base):
    __tablename__ = "audit_findings"

    id = Column(String, primary_key=True, default=_uuid)
    run_id = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    description = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    detail = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
