from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models.subscription import Subscription, SubscriptionLine
from app.models.user import User
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    SubscriptionResponse,
    SubscriptionListResponse,
    SubscriptionLineResponse,
    SubscriptionAuditResponse,
    SubscriptionTransitionRequest,
    SubscriptionCloseRequest
)
from app.services.subscription_service import SubscriptionService
from app.core.dependencies import get_current_user
from app.core.permissions import require_staff_or_admin

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def serialize_subscription(sub: Subscription) -> SubscriptionResponse:
    lines = []
    recurring_amount = 0
    for l in sub.lines:
        tax_rate = l.tax.rate_percent if l.tax else None
        lines.append(SubscriptionLineResponse(
            id=l.id,
            product_id=l.product_id,
            product_name=l.product.name if l.product else None,
            variant_id=l.variant_id,
            variant_value=l.variant.value if l.variant else None,
            quantity=l.quantity,
            unit_price=l.unit_price,
            tax_id=l.tax_id,
            tax_rate=tax_rate,
            amount=l.amount
        ))
        recurring_amount += l.amount

    audits = []
    for a in sub.audits:
        audits.append(SubscriptionAuditResponse(
            id=a.id,
            subscription_id=a.subscription_id,
            from_status=a.from_status,
            to_status=a.to_status,
            user_id=a.user_id,
            user_name=a.user.name if a.user else None,
            at=a.at
        ))

    return SubscriptionResponse(
        id=sub.id,
        number=sub.number,
        customer_id=sub.customer_id,
        customer_name=sub.customer.name if sub.customer else None,
        customer_email=sub.customer.email if sub.customer else None,
        plan_id=sub.plan_id,
        plan_name=sub.plan.name if sub.plan else None,
        plan_period=sub.plan.period if sub.plan else None,
        start_date=sub.start_date,
        expiry_date=sub.expiry_date,
        payment_terms=sub.payment_terms,
        status=sub.status,
        next_billing_date=sub.next_billing_date,
        is_paused=sub.is_paused,
        paused_at=sub.paused_at,
        recurring_amount=recurring_amount,
        created_at=sub.created_at,
        updated_at=sub.updated_at,
        lines=lines,
        audits=audits
    )


@router.get("", response_model=SubscriptionListResponse)
def list_subscriptions(
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    q: Optional[str] = Query(None, description="Search subscription number or customer name"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    query = db.query(Subscription).join(User, Subscription.customer_id == User.id)
    if status:
        query = query.filter(Subscription.status == status.lower().strip())
    if customer_id:
        query = query.filter(Subscription.customer_id == customer_id)
    if q:
        pat = f"%{q.strip()}%"
        query = query.filter(or_(Subscription.number.ilike(pat), User.name.ilike(pat), User.email.ilike(pat)))

    total = query.count()
    items = query.order_by(desc(Subscription.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [serialize_subscription(s) for s in items],
        "page": page,
        "page_size": page_size,
        "total": total
    }


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    sub = SubscriptionService.create_subscription(db, data, current_user_id=user.id)
    return serialize_subscription(sub)


@router.get("/{id}", response_model=SubscriptionResponse)
def get_subscription_detail(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Subscription).filter(Subscription.id == id).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found."
        )
    # IDOR Check: Customers can only view their own subscriptions
    if current_user.role == "customer" and sub.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this subscription."
        )
    return serialize_subscription(sub)


@router.put("/{id}", response_model=SubscriptionResponse)
def update_subscription(
    id: int,
    data: SubscriptionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    sub = SubscriptionService.update_subscription(db, id, data)
    return serialize_subscription(sub)


@router.post("/{id}/transition", response_model=SubscriptionResponse)
def transition_subscription_status(
    id: int,
    data: SubscriptionTransitionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    sub = SubscriptionService.transition_status(db, id, data.to, current_user_id=user.id)
    return serialize_subscription(sub)


@router.post("/{id}/pause", response_model=SubscriptionResponse)
def pause_subscription(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    sub = SubscriptionService.pause_subscription(db, id, current_user_id=user.id)
    return serialize_subscription(sub)


@router.post("/{id}/close", response_model=SubscriptionResponse)
def close_subscription(
    id: int,
    data: SubscriptionCloseRequest = SubscriptionCloseRequest(),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    sub = SubscriptionService.close_subscription(db, id, reason=data.reason, current_user_id=user.id)
    return serialize_subscription(sub)


@router.post("/{id}/renew", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def renew_subscription(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    new_sub = SubscriptionService.renew_subscription(db, id, current_user_id=user.id)
    return serialize_subscription(new_sub)
