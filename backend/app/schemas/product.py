from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class VariantCreate(BaseModel):
    attribute: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1, max_length=100)
    price_extra: int = Field(default=0, ge=0)  # in paise


class VariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    attribute: str
    value: str
    price_extra: int


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(default="software", max_length=100)
    sales_price: int = Field(..., ge=0)  # in paise
    cost_price: int = Field(..., ge=0)   # in paise
    notes: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, max_length=100)
    sales_price: Optional[int] = Field(None, ge=0)
    cost_price: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    sales_price: int
    cost_price: int
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    variants: List[VariantResponse] = []


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    page: int
    page_size: int
    total: int
