import pytest
from datetime import date
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.product import Product, Variant
from app.models.plan import Plan
from app.models.tax import Tax
from app.models.discount import Discount
from app.models.quotation import QuotationTemplate, QuotationTemplateLine
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice, InvoiceLine
from app.models.payment import Payment
from app.models.outbox import Outbox
from app.models.audit import SubscriptionAudit
from app.models.settings import Setting


def test_all_models_instantiable():
    user = User(email="customer@example.com", name="Alice", password_hash="hash", role="customer")
    product = Product(name="BrightSuite", type="software", sales_price=100.0, cost_price=40.0)
    variant = Variant(product=product, attribute="Edition", value="Pro", price_extra=25.0)
    plan = Plan(name="Monthly Standard", price=99.0, period="monthly", min_qty=1)
    tax = Tax(name="Standard VAT", rate_percent=18.0)
    discount = Discount(name="Early Bird", kind="percent", value=10.0)
    template = QuotationTemplate(name="Standard Template", plan=plan, validity_days=30)
    
    assert user.role == "customer"
    assert product.sales_price == 100.0
    assert variant.price_extra == 25.0
    assert plan.period == "monthly"
    assert tax.rate_percent == 18.0
    assert discount.kind == "percent"
    assert template.validity_days == 30


def test_invoice_anti_double_billing_unique_constraint(db):
    """
    B1 requirement: Verify the database-level uniqueness rule:
    UNIQUE(subscription_id, period_start, period_end) on the invoices table.
    """
    # Create required parent customer and subscription
    customer = User(
        email="billing_test@example.com",
        name="Billing Test User",
        password_hash="hashed_pw_xyz",
        role="customer"
    )
    db.add(customer)
    db.flush()

    plan = Plan(name="Standard Monthly", price=5000, period="monthly", valid_from=date(2026, 1, 1))
    db.add(plan)
    db.flush()

    sub = Subscription(
        number="SUB-TEST-001",
        customer_id=customer.id,
        plan_id=plan.id,
        status="active",
        start_date=date(2026, 1, 1),
    )
    db.add(sub)
    db.flush()

    # Create first invoice for subscription and period
    inv1 = Invoice(
        number="INV-2026-0001",
        subscription_id=sub.id,
        customer_id=customer.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        issue_date=date(2026, 1, 1),
        due_date=date(2026, 1, 15),
        subtotal=5000,
        tax_total=0,
        discount_total=0,
        total=5000,
        paid_total=0,
        status="draft"
    )
    db.add(inv1)
    db.flush()

    # Attempt to create duplicate invoice for same subscription and period
    inv2 = Invoice(
        number="INV-2026-0002",
        subscription_id=sub.id,
        customer_id=customer.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        issue_date=date(2026, 1, 1),
        due_date=date(2026, 1, 15),
        subtotal=5000,
        tax_total=0,
        discount_total=0,
        total=5000,
        paid_total=0,
        status="draft"
    )
    db.add(inv2)

    with pytest.raises(IntegrityError):
        with db.begin_nested():
            db.flush()
