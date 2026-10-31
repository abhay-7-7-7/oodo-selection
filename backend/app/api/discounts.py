from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.discount import Discount
from app.models.product import Product
from app.models.user import User
from app.schemas.discount import DiscountCreate, DiscountResponse
from app.core.permissions import require_admin, require_staff_or_admin

router = APIRouter(prefix="/discounts", tags=["Discount Management"])


@router.get("", response_model=List[DiscountResponse])
def list_discounts(
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    discounts = db.query(Discount).order_by(desc(Discount.created_at)).all()
    today = date.today()
    results = []
    for d in discounts:
        remaining = max(0, d.usage_limit - d.times_used)
        is_expired = d.end_date < today
        results.append(DiscountResponse(
            id=d.id,
            name=d.name,
            kind=d.kind,
            value=d.value,
            min_amount=d.min_amount,
            min_qty=d.min_qty,
            start_date=d.start_date,
            end_date=d.end_date,
            usage_limit=d.usage_limit,
            times_used=d.times_used,
            remaining_usage=remaining,
            scope=d.scope,
            product_id=d.product_id,
            is_active=d.is_active,
            is_expired=is_expired,
            created_at=d.created_at
        ))
    return results


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_discount(
    data: DiscountCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    if data.scope == "product":
        if not data.product_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="product_id is required when discount scope is 'product'."
            )
        prod = db.query(Product).filter(Product.id == data.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product ID {data.product_id} not found."
            )

    discount = Discount(
        name=data.name.strip(),
        kind=data.kind,
        value=data.value,
        min_amount=data.min_amount,
        min_qty=data.min_qty,
        start_date=data.start_date,
        end_date=data.end_date,
        usage_limit=data.usage_limit,
        times_used=0,
        scope=data.scope,
        product_id=data.product_id if data.scope == "product" else None,
        is_active=True
    )
    db.add(discount)
    db.commit()
    db.refresh(discount)

    today = date.today()
    return DiscountResponse(
        id=discount.id,
        name=discount.name,
        kind=discount.kind,
        value=discount.value,
        min_amount=discount.min_amount,
        min_qty=discount.min_qty,
        start_date=discount.start_date,
        end_date=discount.end_date,
        usage_limit=discount.usage_limit,
        times_used=discount.times_used,
        remaining_usage=discount.usage_limit,
        scope=discount.scope,
        product_id=discount.product_id,
        is_active=discount.is_active,
        is_expired=discount.end_date < today,
        created_at=discount.created_at
    )
