"""N1 — Discount Guardrail Pydantic schemas."""
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class GuardrailSimulateRequest(BaseModel):
    product_id: Optional[str] = None
    sales_price_paise: int = Field(..., gt=0, description="Base selling price in paise")
    cost_price_paise: int = Field(..., gt=0, description="Cost/COGS in paise")
    discount_kind: str = Field(..., pattern="^(fixed|percent)$")
    discount_value: float = Field(..., ge=0)
    quantity: int = Field(1, ge=1)
    requester_role: str = Field(..., pattern="^(admin|staff|customer)$")


class GuardrailSimulateResponse(BaseModel):
    simulation_id: str
    original_price_paise: int
    discount_amount_paise: int
    final_price_paise: int
    cost_price_paise: int
    profit_paise: int
    margin_percent: float
    min_margin_percent: float
    guardrail_breached: bool
    requires_override: bool
    override_level: str   # "none" | "manager" | "director"
    warning_message: Optional[str]


class OverrideRequest(BaseModel):
    simulation_id: str
    justification: str = Field(..., min_length=10)
    requested_by_user_id: int


class OverrideResponse(BaseModel):
    simulation_id: str
    override_level: str
    approved: bool
    message: str


class AuditLogEntry(BaseModel):
    id: str
    simulation_id: str
    product_id: Optional[str]
    original_price_paise: int
    final_price_paise: int
    margin_percent: float
    guardrail_breached: bool
    override_level: str
    justification: Optional[str]
    override_approved: Optional[bool]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    items: List[AuditLogEntry]
    total: int
