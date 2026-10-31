from datetime import date
from app.models.invoice import Invoice
from app.models.subscription import Subscription
from app.models.plan import Plan


def test_payment_workflow(client, db, staff_headers, customer_user):
    plan = Plan(name="P", price=1000000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add(plan)
    db.flush()

    sub = Subscription(number="SUB-PAY-01", customer_id=customer_user.id, plan_id=plan.id, start_date=date(2026, 11, 1), status="active")
    db.add(sub)
    db.flush()

    # Invoice of ₹10,000 = 1,000,000 paise
    inv = Invoice(
        number="INV-PAY-01",
        subscription_id=sub.id,
        customer_id=customer_user.id,
        period_start=date(2026, 11, 1),
        period_end=date(2026, 11, 30),
        issue_date=date(2026, 11, 1),
        due_date=date(2026, 11, 16),
        status="confirmed",
        subtotal=1000000,
        discount_total=0,
        tax_total=0,
        total=1000000,
        paid_total=0
    )
    db.add(inv)
    db.commit()

    # 1. Partial payment 1: ₹4,000 = 400000 paise
    res1 = client.post(f"/api/invoices/{inv.id}/payments", json={
        "method": "UPI",
        "amount": 400000,
        "paid_on": "2026-11-05",
        "note": "First partial payment"
    }, headers=staff_headers)
    assert res1.status_code == 201
    assert res1.json()["paid_total"] == 400000
    assert res1.json()["outstanding"] == 600000
    assert res1.json()["invoice_status"] == "confirmed"

    # 2. Overpayment test: Outstanding is 600000, attempting to pay 700000 -> 422
    res_over = client.post(f"/api/invoices/{inv.id}/payments", json={
        "method": "card",
        "amount": 700000,
        "paid_on": "2026-11-06"
    }, headers=staff_headers)
    assert res_over.status_code == 422
    assert "exceeds" in res_over.json()["detail"].lower()

    # 3. Partial payment 2: ₹3,000 = 300000 paise
    res2 = client.post(f"/api/invoices/{inv.id}/payments", json={
        "method": "card",
        "amount": 300000,
        "paid_on": "2026-11-06"
    }, headers=staff_headers)
    assert res2.status_code == 201
    assert res2.json()["paid_total"] == 700000
    assert res2.json()["outstanding"] == 300000

    # 4. Final payment 3: ₹3,000 = 300000 paise -> Marks Paid!
    res3 = client.post(f"/api/invoices/{inv.id}/payments", json={
        "method": "bank_transfer",
        "amount": 300000,
        "paid_on": "2026-11-07"
    }, headers=staff_headers)
    assert res3.status_code == 201
    assert res3.json()["paid_total"] == 1000000
    assert res3.json()["outstanding"] == 0
    assert res3.json()["invoice_status"] == "paid"


def test_cancelled_invoice_cannot_receive_payment(client, db, staff_headers, customer_user):
    plan = Plan(name="P2", price=50000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add(plan)
    db.flush()

    sub = Subscription(number="SUB-PAY-02", customer_id=customer_user.id, plan_id=plan.id, start_date=date(2026, 11, 1), status="active")
    db.add(sub)
    db.flush()

    inv = Invoice(
        number="INV-PAY-02",
        subscription_id=sub.id,
        customer_id=customer_user.id,
        period_start=date(2026, 11, 1),
        period_end=date(2026, 11, 30),
        issue_date=date(2026, 11, 1),
        due_date=date(2026, 11, 16),
        status="cancelled",
        subtotal=50000,
        total=50000,
        paid_total=0
    )
    db.add(inv)
    db.commit()

    res = client.post(f"/api/invoices/{inv.id}/payments", json={
        "method": "UPI",
        "amount": 50000,
        "paid_on": "2026-11-05"
    }, headers=staff_headers)
    assert res.status_code == 409
