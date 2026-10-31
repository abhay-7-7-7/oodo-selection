from datetime import date, timedelta
from app.models.product import Product
from app.models.plan import Plan
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice


def test_first_billing_run_creates_invoice_and_second_run_is_idempotent(client, db, staff_headers, customer_user):
    prod = Product(name="Cloud ERP", sales_price=100000, cost_price=50000, is_active=True)
    plan = Plan(name="Monthly Plan", price=100000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add_all([prod, plan])
    db.flush()

    sub = Subscription(
        number="SUB-BILL-01",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=date(2026, 11, 1),
        status="active",
        next_billing_date=date(2026, 11, 1),
        is_paused=False
    )
    db.add(sub)
    db.flush()

    sub_line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=prod.id,
        quantity=1,
        unit_price=100000,
        amount=100000
    )
    db.add(sub_line)
    db.commit()

    # First run: should create 1 invoice
    res1 = client.post("/api/billing/run", json={"as_of_date": "2026-11-01", "dry_run": False}, headers=staff_headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["created"] >= 1

    invoices = db.query(Invoice).filter(Invoice.subscription_id == sub.id).all()
    assert len(invoices) == 1
    inv = invoices[0]
    assert inv.subtotal == 100000
    assert inv.total == 100000

    # Line reconciliation: subtotal - discount + tax == total
    assert inv.subtotal - inv.discount_total + inv.tax_total == inv.total

    # Second run for same date: should create 0 new invoices
    res2 = client.post("/api/billing/run", json={"as_of_date": "2026-11-01", "dry_run": False}, headers=staff_headers)
    assert res2.status_code == 200
    data2 = res2.json()
    # Check this specific subscription did not create duplicates
    sub_items = [it for it in data2["items"] if it.get("subscription_number") == "SUB-BILL-01"]
    if sub_items:
        assert sub_items[0]["status"] == "skipped"

    invoices_after = db.query(Invoice).filter(Invoice.subscription_id == sub.id).all()
    assert len(invoices_after) == 1


def test_missed_billing_periods_are_recovered(client, db, staff_headers, customer_user):
    prod = Product(name="Backup Storage", sales_price=50000, cost_price=20000, is_active=True)
    plan = Plan(name="Monthly Plan 2", price=50000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add_all([prod, plan])
    db.flush()

    # Subscription started on Sep 1, 2026 but billing was missed
    sub = Subscription(
        number="SUB-CATCHUP-01",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=date(2026, 9, 1),
        status="active",
        next_billing_date=date(2026, 9, 1),
        is_paused=False
    )
    db.add(sub)
    db.flush()

    sub_line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=prod.id,
        quantity=1,
        unit_price=50000,
        amount=50000
    )
    db.add(sub_line)
    db.commit()

    # Run billing on Nov 1, 2026 -> Should catch up Sep, Oct, and Nov (3 periods)
    res = client.post("/api/billing/run", json={"as_of_date": "2026-11-01", "dry_run": False}, headers=staff_headers)
    assert res.status_code == 200

    invoices = db.query(Invoice).filter(Invoice.subscription_id == sub.id).order_by(Invoice.period_start.asc()).all()
    assert len(invoices) == 3
    assert invoices[0].period_start == date(2026, 9, 1)
    assert invoices[1].period_start == date(2026, 10, 1)
    assert invoices[2].period_start == date(2026, 11, 1)


def test_paused_and_closed_subscriptions_are_skipped(client, db, staff_headers, customer_user):
    prod = Product(name="App Service", sales_price=30000, cost_price=10000, is_active=True)
    plan = Plan(name="Monthly Plan 3", price=30000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add_all([prod, plan])
    db.flush()

    # Paused sub
    sub_paused = Subscription(
        number="SUB-PAUSED-01",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=date(2026, 11, 1),
        status="active",
        next_billing_date=date(2026, 11, 1),
        is_paused=True
    )
    # Closed sub
    sub_closed = Subscription(
        number="SUB-CLOSED-01",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=date(2026, 11, 1),
        status="closed",
        next_billing_date=date(2026, 11, 1),
        is_paused=False
    )
    db.add_all([sub_paused, sub_closed])
    db.commit()

    res = client.post("/api/billing/run", json={"as_of_date": "2026-11-01", "dry_run": False}, headers=staff_headers)
    assert res.status_code == 200

    assert db.query(Invoice).filter(Invoice.subscription_id == sub_paused.id).count() == 0
    assert db.query(Invoice).filter(Invoice.subscription_id == sub_closed.id).count() == 0


def test_dry_run_makes_no_persistent_changes(client, db, staff_headers, customer_user):
    prod = Product(name="DryRun Product", sales_price=40000, cost_price=15000, is_active=True)
    plan = Plan(name="Monthly DryRun", price=40000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add_all([prod, plan])
    db.flush()

    sub = Subscription(
        number="SUB-DRY-01",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=date(2026, 11, 1),
        status="active",
        next_billing_date=date(2026, 11, 1),
        is_paused=False
    )
    db.add(sub)
    db.flush()

    sub_line = SubscriptionLine(
        subscription_id=sub.id,
        product_id=prod.id,
        quantity=1,
        unit_price=40000,
        amount=40000
    )
    db.add(sub_line)
    db.commit()

    # Dry run
    res = client.post("/api/billing/run", json={"as_of_date": "2026-11-01", "dry_run": True}, headers=staff_headers)
    assert res.status_code == 200

    # No invoice created in DB
    assert db.query(Invoice).filter(Invoice.subscription_id == sub.id).count() == 0

    # next_billing_date not advanced
    db.refresh(sub)
    assert sub.next_billing_date == date(2026, 11, 1)
