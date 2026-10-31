"""N3 — Bank Matcher ORM models."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(String, primary_key=True, default=_uuid)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    amount_paise = Column(Integer, nullable=False)
    reference = Column(String, nullable=True)
    payer = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending|matched|unmatched
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by_user_id = Column(Integer, nullable=True)


class ReconciliationRecord(Base):
    __tablename__ = "reconciliation_records"

    id = Column(String, primary_key=True, default=_uuid)
    transaction_id = Column(String, nullable=False, index=True)
    invoice_ids = Column(JSON, nullable=False)  # list of invoice IDs
    amount_paise = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    match_type = Column(String, nullable=False)  # "exact" | "subset_sum" | "manual"
    reconciled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reconciled_by_user_id = Column(Integer, nullable=True)
