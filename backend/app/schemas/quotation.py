from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class QuotationTemplateLineCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    unit_price_override: Optional[int] = Field(None, ge=0)


class QuotationTemplateLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    template_id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price_override: Optional[int] = None
    product_name: Optional[str] = None
    variant_value: Optional[str] = None


class QuotationTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    plan_id: int
    validity_days: int = Field(default=15, ge=1)
    lines: List[QuotationTemplateLineCreate] = Field(..., min_length=1)


class QuotationTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    plan_id: int
    plan_name: Optional[str] = None
    validity_days: int
    created_by: Optional[int] = None
    created_at: datetime
    lines: List[QuotationTemplateLineResponse] = []
