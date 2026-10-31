from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.user import User
from app.schemas.subscription import SubscriptionResponse
from app.schemas.invoice import InvoiceResponse
from app.schemas.auth import UserResponse
from app.schemas.common import PaginatedResponse
from app.api.subscriptions import serialize_subscription
from app.api.invoices import serialize_invoice
from app.core.permissions import require_customer, require_staff_or_admin

portal_router = APIRouter(prefix="/portal", tags=["Customer Portal"])
customers_router = APIRouter(tags=["Customers Directory"])


@portal_router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_customer_subscriptions(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    """
    Returns only the authenticated customer's subscriptions.
    Customer identity is strictly derived from the validated JWT token.
    """
    subs = db.query(Subscription).filter(
        Subscription.customer_id == customer_user.id
    ).order_by(desc(Subscription.created_at)).all()

    return [serialize_subscription(s) for s in subs]


@portal_router.get("/invoices", response_model=List[InvoiceResponse])
def get_customer_invoices(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    """
    Returns only the authenticated customer's invoices.
    Customer identity is strictly derived from the validated JWT token.
    """
    invoices = db.query(Invoice).filter(
        Invoice.customer_id == customer_user.id
    ).order_by(desc(Invoice.created_at)).all()

    return [serialize_invoice(inv) for inv in invoices]


@customers_router.get("/customers", response_model=PaginatedResponse[UserResponse])
def list_customers(
    q: Optional[str] = Query(None, description="Search by customer name or email"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    """
    Lists users with role 'customer' for staff/admin selection dropdowns.
    Excludes password_hash and internal credentials.
    """
    query = db.query(User).filter(User.role == "customer")
    if q:
        pat = f"%{q.strip()}%"
        query = query.filter(or_(User.name.ilike(pat), User.email.ilike(pat)))

    total = query.count()
    items = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total
    }
