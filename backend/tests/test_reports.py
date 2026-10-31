from datetime import date, timedelta
from app.models.product import Product
from app.models.plan import Plan
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.services.report_service import ReportService


def test_reports_revenue_outstanding_overdue_and_mrr(db):
    today = date.today()

    # Create plans
    plan_monthly = Plan(name="Monthly", price=200000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    plan_yearly = Plan(name="Yearly", price=1200000, period="yearly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    prod = Product(name="App", sales_price=100000, cost_price=50000, is_active=True)
    db.add_all([plan_monthly, plan_yearly, prod])
    db.flush()

    # Active Monthly Sub: recurring amount 200,000 paise
    sub_m = Subscription(number="SUB-REP-01", customer_id=1, plan_id=plan_monthly.id, start_date=today, status="active", is_paused=False)
    db.add(sub_m)
    db.flush()
    db.add(SubscriptionLine(subscription_id=sub_m.id, product_id=prod.id, quantity=2, unit_price=100000, amount=200000))

    # Active Yearly Sub: recurring amount 1,200,000 paise -> Monthly equivalent = 100,000 paise
    sub_y = Subscription(number="SUB-REP-02", customer_id=1, plan_id=plan_yearly.id, start_date=today, status="active", is_paused=False)
    db.add(sub_y)
    db.flush()
    db.add(SubscriptionLine(subscription_id=sub_y.id, product_id=prod.id, quantity=12, unit_price=100000, amount=1200000))

    # Invoices:
    # 1. Settled invoice: total 50000, paid 50000
    inv1 = Invoice(
        number="INV-REP-01", subscription_id=sub_m.id, customer_id=1,
        period_start=today - timedelta(days=60), period_end=today - timedelta(days=31),
        issue_date=today - timedelta(days=60), due_date=today - timedelta(days=45),
        status="paid", subtotal=50000, total=50000, paid_total=50000
    )
    # 2. Overdue invoice: total 100000, paid 20000, due 10 days ago
    inv2 = Invoice(
        number="INV-REP-02", subscription_id=sub_m.id, customer_id=1,
        period_start=today - timedelta(days=30), period_end=today - timedelta(days=1),
        issue_date=today - timedelta(days=30), due_date=today - timedelta(days=10),
        status="confirmed", subtotal=100000, total=100000, paid_total=20000
    )
    db.add_all([inv1, inv2])
    db.flush()

    # Actual Payments
    pay1 = Payment(invoice_id=inv1.id, method="UPI", amount=50000, paid_on=today - timedelta(days=50), source="manual")
    pay2 = Payment(invoice_id=inv2.id, method="card", amount=20000, paid_on=today - timedelta(days=25), source="manual")
    db.add_all([pay1, pay2])
    db.commit()

    summary = ReportService.get_financial_summary(db)

    # 1. Active subs = 2
    assert summary["active_subscriptions"] == 2

    # 2. Revenue received = 50,000 + 20,000 = 70,000 paise (from actual payment records!)
    assert summary["revenue_received"] == 70000

    # 3. Outstanding = 100,000 - 20,000 = 80,000 paise
    assert summary["outstanding"] == 80000

    # 4. Overdue count = 1
    assert summary["overdue_count"] == 1

    # 5. MRR = 200,000 (monthly) + 1,200,000 / 12 (yearly) = 200,000 + 100,000 = 300,000 paise
    assert summary["mrr"] == 300000

    # 6. Query ms is returned
    assert summary["query_ms"] >= 0
