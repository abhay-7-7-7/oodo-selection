from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, model_validator, ConfigDict


class PlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: int = Field(..., ge=0)  # in paise
    period: str = Field(...)       # daily, weekly, monthly, yearly
    min_qty: int = Field(default=1, ge=1)
    valid_from: date
    valid_to: Optional[date] = None
    auto_close: bool = False
    closable: bool = True
    pausable: bool = True
    renewable: bool = True

    @model_validator(mode="after")
    def validate_plan(self):
        if self.period not in ("daily", "weekly", "monthly", "yearly"):
            raise ValueError("Period must be one of: daily, weekly, monthly, yearly.")
        if self.valid_to and self.valid_to < self.valid_from:
            raise ValueError("valid_to cannot be earlier than valid_from.")
        return self


class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[int] = Field(None, ge=0)
    period: Optional[str] = None
    min_qty: Optional[int] = Field(None, ge=1)
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    auto_close: Optional[bool] = None
    closable: Optional[bool] = None
    pausable: Optional[bool] = None
    renewable: Optional[bool] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_plan(self):
        if self.period is not None and self.period not in ("daily", "weekly", "monthly", "yearly"):
            raise ValueError("Period must be one of: daily, weekly, monthly, yearly.")
        if self.valid_to and self.valid_from and self.valid_to < self.valid_from:
            raise ValueError("valid_to cannot be earlier than valid_from.")
        return self


class PlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    price: int
    period: str
    min_qty: int
    valid_from: date
    valid_to: Optional[date] = None
    auto_close: bool
    closable: bool
    pausable: bool
    renewable: bool
    is_active: bool
    created_at: datetime
