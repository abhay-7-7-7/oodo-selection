"""N5 — Renewal Radar ORM model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class RenewalQuotation(Base):
    __tablename__ = "renewal_quotations"

    id = Column(String, primary_key=True, default=_uuid)
    subscription_id = Column(String, nullable=False, index=True)
    customer_id = Column(String, nullable=False)
    plan_id = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    notes = Column(String, nullable=True)
    status = Column(String, nullable=False, default="draft")  # draft|sent|accepted|rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by_user_id = Column(Integer, nullable=True)
