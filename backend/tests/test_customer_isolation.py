import pytest
from datetime import date
from app.models.user import User
from app.models.product import Product
from app.models.plan import Plan
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice, InvoiceLine
from app.models.payment import Payment
from app.core.security import get_password_hash, create_access_token


@pytest.fixture
def isolation_data(db):
    """
    Sets up two isolated customers (Customer A and Customer B)
    each with a subscription, invoice, and payment.
    """
    # Create Customer A
    user_a = User(
        name="Customer Alpha",
        email="customer_alpha@example.com",
        password_hash=get_password_hash("Brightloop@2026"),
        role="customer",
        phone="+91 9876543210",
        company="Alpha Corp Ltd",
        is_active=True
    )
    # Create Customer B
    user_b = User(
        name="Customer Beta",
        email="customer_beta@example.com",
        password_hash=get_password_hash("Brightloop@2026"),
        role="customer",
        phone="+91 9123456780",
        company="Beta Solutions Inc",
        is_active=True
    )
    db.add_all([user_a, user_b])
    db.flush()

    # Product and Plan
    product = Product(name="Cloud ERP Node", type="software", sales_price=100000, cost_price=50000, is_active=True)
    plan = Plan(name="Monthly Standard", price=100000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add_all([product, plan])
    db.flush()

    # Subscription A
    sub_a = Subscription(
        number="SUB-ALPHA-001",
        customer_id=user_a.id,
        plan_id=plan.id,
        status="active",
        start_date=date(2026, 1, 1),
        payment_terms="due_on_receipt"
    )
    # Subscription B
    sub_b = Subscription(
        number="SUB-BETA-001",
        customer_id=user_b.id,
        plan_id=plan.id,
        status="active",
        start_date=date(2026, 1, 1),
        payment_terms="due_on_receipt"
    )
    db.add_all([sub_a, sub_b])
    db.flush()

    # Subscription lines
    line_a = SubscriptionLine(subscription_id=sub_a.id, product_id=product.id, quantity=1, unit_price=100000, amount=100000)
    line_b = SubscriptionLine(subscription_id=sub_b.id, product_id=product.id, quantity=1, unit_price=100000, amount=100000)
    db.add_all([line_a, line_b])
    db.flush()

    # Invoice A
    inv_a = Invoice(
        number="INV-ALPHA-001",
        subscription_id=sub_a.id,
        customer_id=user_a.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        issue_date=date(2026, 1, 1),
        due_date=date(2026, 1, 15),
        status="confirmed",
        subtotal=100000,
        discount_total=0,
        tax_total=0,
        total=100000,
        paid_total=50000
    )
    # Invoice B
    inv_b = Invoice(
        number="INV-BETA-001",
        subscription_id=sub_b.id,
        customer_id=user_b.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        issue_date=date(2026, 1, 1),
        due_date=date(2026, 1, 15),
        status="confirmed",
        subtotal=100000,
        discount_total=0,
        tax_total=0,
        total=100000,
        paid_total=50000
    )
    db.add_all([inv_a, inv_b])
    db.flush()

    # Payment A
    pay_a = Payment(
        invoice_id=inv_a.id,
        amount=50000,
        method="bank_transfer",
        paid_on=date(2026, 1, 5),
        recorded_by=user_a.id
    )
    # Payment B
    pay_b = Payment(
        invoice_id=inv_b.id,
        amount=50000,
        method="card",
        paid_on=date(2026, 1, 5),
        recorded_by=user_b.id
    )
    db.add_all([pay_a, pay_b])
    db.commit()

    token_a = create_access_token({"sub": str(user_a.id), "email": user_a.email, "role": user_a.role, "name": user_a.name})
    token_b = create_access_token({"sub": str(user_b.id), "email": user_b.email, "role": user_b.role, "name": user_b.name})

    return {
        "user_a": user_a,
        "user_b": user_b,
        "sub_a": sub_a,
        "sub_b": sub_b,
        "inv_a": inv_a,
        "inv_b": inv_b,
        "pay_a": pay_a,
        "pay_b": pay_b,
        "headers_a": {"Authorization": f"Bearer {token_a}"},
        "headers_b": {"Authorization": f"Bearer {token_b}"}
    }


def test_customer_cannot_view_another_customers_subscription(client, isolation_data):
    """Customer A must be rejected (403/404) when attempting to view Subscription B."""
    headers_a = isolation_data["headers_a"]
    sub_b_id = isolation_data["sub_b"].id

    # Direct subscriptions/{id} route
    res = client.get(f"/api/subscriptions/{sub_b_id}", headers=headers_a)
    assert res.status_code in [403, 404]

    # Portal subscriptions/{id} route
    res_portal = client.get(f"/api/portal/subscriptions/{sub_b_id}", headers=headers_a)
    assert res_portal.status_code in [403, 404]


def test_customer_cannot_view_or_print_another_customers_invoice(client, isolation_data):
    """Customer A must be rejected (403/404) when attempting to view or print Invoice B."""
    headers_a = isolation_data["headers_a"]
    inv_b_id = isolation_data["inv_b"].id

    # View invoice detail
    res_view = client.get(f"/api/invoices/{inv_b_id}", headers=headers_a)
    assert res_view.status_code == 403

    # Print invoice
    res_print = client.get(f"/api/invoices/{inv_b_id}/print", headers=headers_a)
    assert res_print.status_code == 403

    # Portal invoice detail
    res_portal = client.get(f"/api/portal/invoices/{inv_b_id}", headers=headers_a)
    assert res_portal.status_code == 404


def test_customer_cannot_view_another_customers_payments(client, isolation_data):
    """Customer A's payment queries must never reveal Payment B."""
    headers_a = isolation_data["headers_a"]
    inv_b_id = isolation_data["inv_b"].id
    pay_b_id = isolation_data["pay_b"].id

    # GET /api/payments with filter on inv_b
    res_payments = client.get(f"/api/payments?invoice_id={inv_b_id}", headers=headers_a)
    assert res_payments.status_code == 200
    items = res_payments.json()["items"]
    assert len(items) == 0  # Filtered out by customer isolation

    # GET /api/portal/payments only returns payments for own invoices
    res_portal_payments = client.get("/api/portal/payments", headers=headers_a)
    assert res_portal_payments.status_code == 200
    portal_items = res_portal_payments.json()
    returned_payment_ids = [p["id"] for p in portal_items]
    assert pay_b_id not in returned_payment_ids


def test_customer_cannot_modify_another_customers_profile(client, isolation_data):
    """Customer A must be rejected with 403 when trying to update Customer B's profile."""
    headers_a = isolation_data["headers_a"]
    user_b_id = isolation_data["user_b"].id

    res = client.put(
        f"/api/customers/{user_b_id}",
        json={"name": "Hacked Name", "company": "Compromised Corp"},
        headers=headers_a
    )
    assert res.status_code == 403
    assert "cannot modify another customer" in res.json()["detail"].lower()


def test_customer_cannot_modify_subscription_or_record_payment(client, isolation_data):
    """Customer A must not be allowed to execute staff actions (pause, close, record payment)."""
    headers_a = isolation_data["headers_a"]
    sub_b_id = isolation_data["sub_b"].id
    inv_b_id = isolation_data["inv_b"].id

    # Cannot pause subscription
    res_pause = client.post(f"/api/subscriptions/{sub_b_id}/pause", headers=headers_a)
    assert res_pause.status_code == 403

    # Cannot close subscription
    res_close = client.post(f"/api/subscriptions/{sub_b_id}/close", json={"reason": "Attacker"}, headers=headers_a)
    assert res_close.status_code == 403

    # Cannot record unauthorized payment
    res_pay = client.post(
        f"/api/invoices/{inv_b_id}/payments",
        json={"method": "cash", "amount": 10000, "paid_on": "2026-01-05"},
        headers=headers_a
    )
    assert res_pay.status_code == 403
