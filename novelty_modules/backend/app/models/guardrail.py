"""N1 — Discount Guardrail ORM model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class GuardrailAuditLog(Base):
    __tablename__ = "guardrail_audit_logs"

    id = Column(String, primary_key=True, default=_uuid)
    simulation_id = Column(String, nullable=False, index=True)
    product_id = Column(String, nullable=True)

    sales_price_paise = Column(Integer, nullable=False)
    cost_price_paise = Column(Integer, nullable=False)
    discount_amount_paise = Column(Integer, nullable=False)
    final_price_paise = Column(Integer, nullable=False)
    margin_percent = Column(Float, nullable=False)
    min_margin_percent = Column(Float, nullable=False)

    discount_kind = Column(String, nullable=False)   # "fixed" | "percent"
    discount_value = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    requester_role = Column(String, nullable=False)

    guardrail_breached = Column(Boolean, nullable=False, default=False)
    override_level = Column(String, nullable=False, default="none")  # "none"|"manager"|"director"
    justification = Column(String, nullable=True)
    override_approved = Column(Boolean, nullable=True)
    override_approved_by_user_id = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    @property
    def original_price_paise(self) -> int:
        return self.sales_price_paise
