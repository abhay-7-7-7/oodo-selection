from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.user import User
from app.schemas.subscription import SubscriptionResponse
from app.schemas.invoice import InvoiceResponse
from app.schemas.payment import PaymentResponse
from app.schemas.auth import UserResponse, CustomerResponse, CustomerProfileUpdate
from app.schemas.common import PaginatedResponse
from app.api.subscriptions import serialize_subscription
from app.api.invoices import serialize_invoice
from app.core.dependencies import get_current_user
from app.core.permissions import require_customer, require_staff_or_admin

portal_router = APIRouter(prefix="/portal", tags=["Customer Portal"])
customers_router = APIRouter(tags=["Customers Directory"])


@portal_router.get("/subscriptions", response_model=List[SubscriptionResponse])
def get_customer_subscriptions(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    """Returns only the authenticated customer's subscriptions."""
    subs = db.query(Subscription).filter(
        Subscription.customer_id == customer_user.id
    ).order_by(desc(Subscription.created_at)).all()

    return [serialize_subscription(s) for s in subs]


@portal_router.get("/subscriptions/{id}", response_model=SubscriptionResponse)
def get_customer_subscription_detail(
    id: int,
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    """Returns only the authenticated customer's specific subscription."""
    sub = db.query(Subscription).filter(
        Subscription.id == id,
        Subscription.customer_id == customer_user.id
    ).first()
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found for this customer."
        )
    return serialize_subscription(sub)


@portal_router.get("/invoices", response_model=List[InvoiceResponse])
def get_customer_invoices(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    """Returns only the authenticated customer's invoices."""
    invoices = db.query(Invoice).filter(
        Invoice.customer_id == customer_user.id
    ).order_by(desc(Invoice.created_at)).all()

    return [serialize_invoice(inv) for inv in invoices]


@portal_router.get("/invoices/{id}", response_model=InvoiceResponse)
def get_customer_invoice_detail(
    id: int,
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    """Returns only the authenticated customer's specific invoice."""
    inv = db.query(Invoice).filter(
        Invoice.id == id,
        Invoice.customer_id == customer_user.id
    ).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found for this customer."
        )
    return serialize_invoice(inv)


@portal_router.get("/payments", response_model=List[PaymentResponse])
def get_customer_payments(
    db: Session = Depends(get_db),
    customer_user: User = Depends(require_customer)
):
    """Returns only the authenticated customer's payment receipts."""
    query = db.query(Payment).join(Invoice, Payment.invoice_id == Invoice.id).filter(
        Invoice.customer_id == customer_user.id
    )
    payments = query.order_by(desc(Payment.paid_on), desc(Payment.created_at)).all()
    return [
        PaymentResponse(
            id=p.id,
            invoice_id=p.invoice_id,
            invoice_number=p.invoice.number if p.invoice else None,
            customer_id=p.invoice.customer_id if p.invoice else None,
            customer_name=p.invoice.customer.name if (p.invoice and p.invoice.customer) else None,
            method=p.method,
            amount=p.amount,
            paid_on=p.paid_on,
            note=p.note,
            recorded_by=p.recorded_by,
            source=p.source,
            created_at=p.created_at
        )
        for p in payments
    ]


@customers_router.get("/customers", response_model=PaginatedResponse[CustomerResponse])
def list_customers(
    q: Optional[str] = Query(None, description="Search by customer name or email"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_staff_or_admin)
):
    """Lists customers with calculated financial & subscription metrics."""
    query = db.query(User).filter(User.role == "customer")
    if q:
        pat = f"%{q.strip()}%"
        query = query.filter(or_(User.name.ilike(pat), User.email.ilike(pat)))

    total = query.count()
    items = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    resp_items = []
    for u in items:
        active_subs = db.query(Subscription).filter(
            Subscription.customer_id == u.id,
            Subscription.status == "active"
        ).count()
        invoices = db.query(Invoice).filter(Invoice.customer_id == u.id).all()
        total_billed = sum(inv.total for inv in invoices if inv.status != "cancelled")
        outstanding = sum(inv.total - inv.paid_total for inv in invoices if inv.status not in ["paid", "cancelled"])
        
        resp_items.append(CustomerResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            phone=getattr(u, "phone", "") or "",
            company=getattr(u, "company", "") or f"{u.name}'s Enterprise",
            active_subscriptions=active_subs,
            total_billed=total_billed,
            outstanding_balance=outstanding,
            status="active" if u.is_active else "inactive",
            is_active=u.is_active,
            created_at=u.created_at
        ))

    return {
        "items": resp_items,
        "page": page,
        "page_size": page_size,
        "total": total
    }


@customers_router.put("/customers/{id}", response_model=CustomerResponse)
def update_customer_profile(
    id: int,
    data: CustomerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates customer profile with strict IDOR ownership checks."""
    if current_user.role == "customer" and current_user.id != id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: cannot modify another customer's profile."
        )

    target_user = db.query(User).filter(User.id == id, User.role == "customer").first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found."
        )

    if data.name is not None:
        target_user.name = data.name.strip()
    if data.phone is not None:
        target_user.phone = data.phone.strip()
    if data.company is not None:
        target_user.company = data.company.strip()
    if data.status is not None:
        # Only staff or admin can change account status
        if current_user.role in ["admin", "staff"]:
            target_user.is_active = (data.status.lower() == "active")

    db.commit()
    db.refresh(target_user)

    active_subs = db.query(Subscription).filter(
        Subscription.customer_id == target_user.id,
        Subscription.status == "active"
    ).count()
    invoices = db.query(Invoice).filter(Invoice.customer_id == target_user.id).all()
    total_billed = sum(inv.total for inv in invoices if inv.status != "cancelled")
    outstanding = sum(inv.total - inv.paid_total for inv in invoices if inv.status not in ["paid", "cancelled"])

    return CustomerResponse(
        id=target_user.id,
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        phone=getattr(target_user, "phone", "") or "",
        company=getattr(target_user, "company", "") or f"{target_user.name}'s Enterprise",
        active_subscriptions=active_subs,
        total_billed=total_billed,
        outstanding_balance=outstanding,
        status="active" if target_user.is_active else "inactive",
        is_active=target_user.is_active,
        created_at=target_user.created_at
    )
