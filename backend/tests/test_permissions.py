from datetime import date
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.plan import Plan


def test_staff_cannot_create_staff(client, staff_headers):
    res = client.post("/api/staff", json={
        "name": "Subordinate",
        "email": "subordinate@brightloop.com",
        "password": "StaffPassword@2026"
    }, headers=staff_headers)
    assert res.status_code == 403


def test_staff_cannot_create_discounts(client, staff_headers):
    res = client.post("/api/discounts", json={
        "name": "STAFFDISC",
        "kind": "percent",
        "value": 10,
        "min_amount": 0,
        "min_qty": 1,
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "usage_limit": 50,
        "scope": "subscription"
    }, headers=staff_headers)
    assert res.status_code == 403


def test_customer_cannot_access_admin_endpoints(client, customer_headers):
    res = client.post("/api/products", json={
        "name": "Hacked Product",
        "type": "software",
        "sales_price": 100,
        "cost_price": 50
    }, headers=customer_headers)
    assert res.status_code == 403


def test_customer_cannot_access_another_customers_invoice(
    client,
    db,
    customer_user,
    other_customer_user,
    customer_headers,
    other_customer_headers
):
    # Create plan and subscription for other_customer
    plan = Plan(
        name="Test Plan",
        price=100000,
        period="monthly",
        min_qty=1,
        valid_from=date(2026, 1, 1),
        valid_to=date(2027, 1, 1),
        is_active=True
    )
    db.add(plan)
    db.flush()

    sub = Subscription(
        number="SUB-OTHER-01",
        customer_id=other_customer_user.id,
        plan_id=plan.id,
        start_date=date(2026, 1, 1),
        status="active"
    )
    db.add(sub)
    db.flush()

    inv = Invoice(
        number="INV-OTHER-01",
        subscription_id=sub.id,
        customer_id=other_customer_user.id,
        period_start=date(2026, 1, 1),
        period_end=date(2026, 1, 31),
        issue_date=date(2026, 1, 1),
        due_date=date(2026, 1, 15),
        status="confirmed",
        subtotal=100000,
        discount_total=0,
        tax_total=18000,
        total=118000,
        paid_total=0
    )
    db.add(inv)
    db.commit()

    # other_customer can access their own invoice
    res_own = client.get(f"/api/invoices/{inv.id}", headers=other_customer_headers)
    assert res_own.status_code == 200

    # customer_user attempting to access other_customer's invoice receives 403
    res_forbidden = client.get(f"/api/invoices/{inv.id}", headers=customer_headers)
    assert res_forbidden.status_code == 403

    # Print endpoint also forbidden
    res_print_forbidden = client.get(f"/api/invoices/{inv.id}/print", headers=customer_headers)
    assert res_print_forbidden.status_code == 403
