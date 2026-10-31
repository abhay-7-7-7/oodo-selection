from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator, ConfigDict


class DiscountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    kind: str = Field(...)  # fixed or percent
    value: int = Field(..., ge=0)  # paise for fixed, percent (e.g. 10) for percent
    min_amount: int = Field(default=0, ge=0)  # in paise
    min_qty: int = Field(default=0, ge=0)
    start_date: date
    end_date: date
    usage_limit: int = Field(..., ge=1)
    scope: str = Field(...)  # product or subscription
    product_id: Optional[int] = None

    @model_validator(mode="after")
    def validate_discount(self):
        if self.kind not in ("fixed", "percent"):
            raise ValueError("kind must be 'fixed' or 'percent'.")
        if self.scope not in ("product", "subscription"):
            raise ValueError("scope must be 'product' or 'subscription'.")
        if self.kind == "percent" and self.value > 100:
            raise ValueError("Percentage discount value cannot exceed 100.")
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be earlier than start_date.")
        if self.scope == "product" and not self.product_id:
            raise ValueError("product_id is required when scope is 'product'.")
        return self


class DiscountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    kind: str
    value: int
    min_amount: int
    min_qty: int
    start_date: date
    end_date: date
    usage_limit: int
    times_used: int
    remaining_usage: int
    scope: str
    product_id: Optional[int]
    is_active: bool
    is_expired: bool
    created_at: datetime
