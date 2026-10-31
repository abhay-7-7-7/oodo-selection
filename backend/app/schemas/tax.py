from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class TaxCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    rate_percent: Decimal = Field(..., ge=Decimal("0.00"), le=Decimal("100.00"))
    applies_to: str = Field(default="all", max_length=100)


class TaxResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rate_percent: Decimal
    applies_to: str
    is_active: bool
    created_at: datetime
