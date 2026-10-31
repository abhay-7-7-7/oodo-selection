from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.tax import Tax
from app.models.user import User
from app.schemas.tax import TaxCreate, TaxResponse
from app.core.permissions import require_admin, require_staff_or_admin

router = APIRouter(prefix="/taxes", tags=["Tax Configuration"])


@router.get("", response_model=List[TaxResponse])
def list_taxes(
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    return db.query(Tax).order_by(desc(Tax.created_at)).all()


@router.post("", response_model=TaxResponse, status_code=status.HTTP_201_CREATED)
def create_tax(
    data: TaxCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    tax = Tax(
        name=data.name.strip(),
        rate_percent=data.rate_percent,
        applies_to=data.applies_to.strip(),
        is_active=True
    )
    db.add(tax)
    db.commit()
    db.refresh(tax)
    return tax
