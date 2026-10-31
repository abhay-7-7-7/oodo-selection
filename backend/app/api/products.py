from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models.product import Product, Variant
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    VariantCreate,
    VariantResponse
)
from app.core.permissions import require_admin, require_staff_or_admin

router = APIRouter(prefix="/products", tags=["Product Catalog"])


@router.get("", response_model=ProductListResponse)
def list_products(
    q: Optional[str] = Query(None, description="Search term across product name or notes"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    query = db.query(Product)
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(or_(Product.name.ilike(search_pattern), Product.notes.ilike(search_pattern)))
    
    total = query.count()
    items = query.order_by(desc(Product.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total
    }


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = Product(
        name=data.name.strip(),
        type=data.type.strip(),
        sales_price=data.sales_price,
        cost_price=data.cost_price,
        notes=data.notes,
        is_active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    if data.name is not None:
        product.name = data.name.strip()
    if data.type is not None:
        product.type = data.type.strip()
    if data.sales_price is not None:
        product.sales_price = data.sales_price
    if data.cost_price is not None:
        product.cost_price = data.cost_price
    if data.notes is not None:
        product.notes = data.notes
    if data.is_active is not None:
        product.is_active = data.is_active

    db.commit()
    db.refresh(product)
    return product


@router.post("/{id}/variants", response_model=VariantResponse, status_code=status.HTTP_201_CREATED)
def create_variant(
    id: int,
    data: VariantCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    variant = Variant(
        product_id=product.id,
        attribute=data.attribute.strip(),
        value=data.value.strip(),
        price_extra=data.price_extra
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant
