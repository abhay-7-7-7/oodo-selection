from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.plan import Plan
from app.models.user import User
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse
from app.core.permissions import require_admin, require_any_authenticated

router = APIRouter(prefix="/plans", tags=["Subscription Plans"])


@router.get("", response_model=List[PlanResponse])
def list_plans(
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    user: User = Depends(require_any_authenticated)
):
    query = db.query(Plan)
    if active_only:
        query = query.filter(Plan.is_active.is_(True))
    return query.order_by(desc(Plan.created_at)).all()


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    plan = Plan(
        name=data.name.strip(),
        price=data.price,
        period=data.period,
        min_qty=data.min_qty,
        valid_from=data.valid_from,
        valid_to=data.valid_to,
        auto_close=data.auto_close,
        closable=data.closable,
        pausable=data.pausable,
        renewable=data.renewable,
        is_active=True
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/{id}", response_model=PlanResponse)
def update_plan(
    id: int,
    data: PlanUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    plan = db.query(Plan).filter(Plan.id == id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found."
        )

    if data.name is not None:
        plan.name = data.name.strip()
    if data.price is not None:
        plan.price = data.price
    if data.period is not None:
        plan.period = data.period
    if data.min_qty is not None:
        plan.min_qty = data.min_qty
    if data.valid_from is not None:
        plan.valid_from = data.valid_from
    if data.valid_to is not None:
        plan.valid_to = data.valid_to
    if data.auto_close is not None:
        plan.auto_close = data.auto_close
    if data.closable is not None:
        plan.closable = data.closable
    if data.pausable is not None:
        plan.pausable = data.pausable
    if data.renewable is not None:
        plan.renewable = data.renewable
    if data.is_active is not None:
        plan.is_active = data.is_active

    db.commit()
    db.refresh(plan)
    return plan
