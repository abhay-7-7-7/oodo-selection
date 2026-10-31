import sys, os
sys.path.insert(0, r"D:\oodo slection\oodo-selection\backend")

from app.database import SessionLocal
from app.models.user import User
from app.models.product import Product, Variant
from app.models.plan import Plan
from app.models.tax import Tax
from app.models.discount import Discount
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice, InvoiceLine
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.outbox import Outbox
from datetime import date, datetime, timedelta, timezone

db = SessionLocal()

print("Seeding rich dataset...")

# Fetch products, plans, taxes
products = db.query(Product).all()
plans = db.query(Plan).all()
taxes = db.query(Tax).all()
monthly_plan = next((p for p in plans if p.period == "monthly"), plans[0])
yearly_plan = next((p for p in plans if p.period == "yearly"), plans[-1])
tax_18 = next((t for t in taxes if "18" in t.name or t.rate_percent == "18.00"), taxes[0])

# Get target demo customers
rahul = db.query(User).filter(User.email == "rahul@example.com").first()
ravi = db.query(User).filter(User.email == "ravi@techcorp.in").first()
admin_usr = db.query(User).filter(User.email == "admin@brightloop.com").first()
staff_usr = db.query(User).filter(User.email == "anjali@brightloop.com").first()

all_customers = db.query(User).filter(User.role == "customer").all()

today = date.today()

# Function to seed subscriptions, invoices and payments for a customer
def seed_customer_portfolio(cust, prefix="CUST"):
    if not cust:
        return
    print(f"Enriching portfolio for {cust.name} ({cust.email})...")
    
    # 1. Active Subscription: Cloud Business Suite (Odoo)
    p1 = products[0]
    v1 = next((v for v in p1.variants if "Odoo" in v.value), p1.variants[0] if p1.variants else None)
    unit1 = p1.sales_price + (v1.price_extra if v1 else 0)
    
    sub1_num = f"SUB-{prefix}-01"
    sub1 = db.query(Subscription).filter(Subscription.number == sub1_num).first()
    if not sub1:
        sub1 = Subscription(
            number=sub1_num,
            customer_id=cust.id,
            plan_id=monthly_plan.id,
            start_date=today - timedelta(days=90),
            expiry_date=today + timedelta(days=275),
            payment_terms="net_15",
            status="active",
            next_billing_date=today + timedelta(days=15),
            is_paused=False
        )
        db.add(sub1)
        db.flush()
        db.add(SubscriptionLine(
            subscription_id=sub1.id,
            product_id=p1.id,
            variant_id=v1.id if v1 else None,
            quantity=2,
            unit_price=unit1,
            tax_id=tax_18.id,
            amount=unit1 * 2
        ))
    
    # 2. Active Subscription: ERP Core Server
    p2 = products[1] if len(products) > 1 else products[0]
    v2 = p2.variants[-1] if p2.variants else None
    unit2 = p2.sales_price + (v2.price_extra if v2 else 0)
    
    sub2_num = f"SUB-{prefix}-02"
    sub2 = db.query(Subscription).filter(Subscription.number == sub2_num).first()
    if not sub2:
        sub2 = Subscription(
            number=sub2_num,
            customer_id=cust.id,
            plan_id=monthly_plan.id,
            start_date=today - timedelta(days=60),
            expiry_date=today + timedelta(days=305),
            payment_terms="due_on_receipt",
            status="active",
            next_billing_date=today + timedelta(days=25),
            is_paused=False
        )
        db.add(sub2)
        db.flush()
        db.add(SubscriptionLine(
            subscription_id=sub2.id,
            product_id=p2.id,
            variant_id=v2.id if v2 else None,
            quantity=1,
            unit_price=unit2,
            tax_id=tax_18.id,
            amount=unit2
        ))

    # 3. Active Subscription: Warehouse Logistics
    p3 = products[3] if len(products) > 3 else products[0]
    unit3 = p3.sales_price
    sub3_num = f"SUB-{prefix}-03"
    sub3 = db.query(Subscription).filter(Subscription.number == sub3_num).first()
    if not sub3:
        sub3 = Subscription(
            number=sub3_num,
            customer_id=cust.id,
            plan_id=yearly_plan.id,
            start_date=today - timedelta(days=120),
            expiry_date=today + timedelta(days=245),
            payment_terms="net_30",
            status="active",
            next_billing_date=today + timedelta(days=245),
            is_paused=False
        )
        db.add(sub3)
        db.flush()
        db.add(SubscriptionLine(
            subscription_id=sub3.id,
            product_id=p3.id,
            variant_id=None,
            quantity=1,
            unit_price=unit3,
            tax_id=tax_18.id,
            amount=unit3
        ))

    db.commit()

    # Seed Invoices for sub1
    invoice_specs = [
        # (num_suffix, days_ago, period_days, status, is_paid, method)
        ("01", 75, 45, "paid", True, "bank_transfer"),
        ("02", 45, 15, "paid", True, "upi"),
        ("03", 15, -15, "paid", True, "card"),
        ("04", 5, -25, "confirmed", False, None),  # Pending / Due soon
        ("05", 25, -5, "confirmed", False, None),  # Overdue
    ]

    for suffix, start_offset, end_offset, inv_status, is_paid, p_method in invoice_specs:
        inv_num = f"INV-{prefix}-{suffix}"
        existing_inv = db.query(Invoice).filter(Invoice.number == inv_num).first()
        if existing_inv:
            continue
        
        p_start = today - timedelta(days=start_offset)
        p_end = today - timedelta(days=end_offset)
        iss_date = p_start
        due_d = p_start + timedelta(days=15)
        
        base_amt = unit1 * 2  # in paise
        tax_amt = int(base_amt * 0.18)
        tot_amt = base_amt + tax_amt
        paid_amt = tot_amt if is_paid else 0

        inv = Invoice(
            number=inv_num,
            subscription_id=sub1.id,
            customer_id=cust.id,
            period_start=p_start,
            period_end=p_end,
            issue_date=iss_date,
            due_date=due_d,
            status=inv_status,
            subtotal=base_amt,
            discount_total=0,
            tax_total=tax_amt,
            total=tot_amt,
            paid_total=paid_amt
        )
        db.add(inv)
        db.flush()

        db.add(InvoiceLine(
            invoice_id=inv.id,
            description=f"{p1.name} - Billing Cycle {p_start.strftime('%b %Y')}",
            quantity=2,
            unit_price=unit1,
            base=base_amt,
            variant_extra=v1.price_extra * 2 if v1 else 0,
            discount=0,
            tax=tax_amt,
            amount=tot_amt
        ))

        if is_paid and p_method:
            db.add(Payment(
                invoice_id=inv.id,
                method=p_method,
                amount=tot_amt,
                paid_on=due_d - timedelta(days=2),
                note=f"Automatic payment receipt for {inv_num}",
                recorded_by=staff_usr.id if staff_usr else None,
                source="auto_portal"
            ))

    db.commit()

    # Seed Notifications for Customer
    notif_specs = [
        ("Invoice INV-" + prefix + "-04 Generated", f"Your new recurring bill for {p1.name} (?{tot_amt/100:,.2f}) is ready for review.", "invoice", "normal", "invoice", "notif-" + prefix + "-1"),
        ("Payment Received: ?" + f"{tot_amt/100:,.2f}", f"Thank you! Payment for invoice INV-{prefix}-03 was settled via {p_method}.", "payment", "normal", "payment", "notif-" + prefix + "-2"),
        ("Subscription SUB-" + prefix + "-01 Renewed", "Your monthly subscription has successfully advanced to the next active cycle.", "subscription", "normal", "subscription", "notif-" + prefix + "-3"),
        ("Action Required: Invoice INV-" + prefix + "-05 Overdue", "Invoice INV-" + prefix + "-05 is overdue. Please settle to avoid disruption.", "invoice", "high", "invoice", "notif-" + prefix + "-4"),
        ("Security Notice", "Your account was accessed from a recognized browser session.", "account", "low", "user", "notif-" + prefix + "-5")
    ]

    for title, msg, cat, prio, entity, key in notif_specs:
        existing_n = db.query(Notification).filter(Notification.user_id == cust.id, Notification.event_key == key).first()
        if not existing_n:
            db.add(Notification(
                user_id=cust.id,
                title=title,
                message=msg,
                category=cat,
                priority=prio,
                related_entity_type=entity,
                event_key=key,
                is_read=False
            ))

    db.commit()

# Seed both key demo personas
seed_customer_portfolio(rahul, prefix="RAHUL")
seed_customer_portfolio(ravi, prefix="RAVI")

# Seed multiple subscriptions and invoices for other customers to pump Admin counts
print("Generating additional subscriptions across all customers...")
sub_counter = 500
inv_counter = 500
for i, c in enumerate(all_customers[:35]):
    sub_num = f"SUB-{sub_counter:05d}"
    sub_counter += 1
    existing = db.query(Subscription).filter(Subscription.number == sub_num).first()
    if not existing:
        p = products[i % len(products)]
        pl = plans[i % len(plans)]
        unit_p = p.sales_price
        sub = Subscription(
            number=sub_num,
            customer_id=c.id,
            plan_id=pl.id,
            start_date=today - timedelta(days=(i * 7) % 180),
            expiry_date=today + timedelta(days=180),
            payment_terms="net_15",
            status="active" if i % 6 != 0 else ("paused" if i % 3 == 0 else "confirmed"),
            next_billing_date=today + timedelta(days=(i * 3) % 28),
            is_paused=(i % 10 == 0)
        )
        db.add(sub)
        db.flush()
        db.add(SubscriptionLine(
            subscription_id=sub.id,
            product_id=p.id,
            quantity=1 + (i % 4),
            unit_price=unit_p,
            tax_id=tax_18.id,
            amount=unit_p * (1 + (i % 4))
        ))
        
        # Add invoice
        inv_num = f"INV-{inv_counter:05d}"
        inv_counter += 1
        base_a = unit_p * (1 + (i % 4))
        tax_a = int(base_a * 0.18)
        tot_a = base_a + tax_a
        is_p = (i % 2 == 0)
        
        inv = Invoice(
            number=inv_num,
            subscription_id=sub.id,
            customer_id=c.id,
            period_start=today - timedelta(days=30),
            period_end=today,
            issue_date=today - timedelta(days=30),
            due_date=today - timedelta(days=15) if is_p else today + timedelta(days=5),
            status="paid" if is_p else "confirmed",
            subtotal=base_a,
            discount_total=0,
            tax_total=tax_a,
            total=tot_a,
            paid_total=tot_a if is_p else 0
        )
        db.add(inv)
        db.flush()
        db.add(InvoiceLine(
            invoice_id=inv.id,
            description=f"{p.name} recurring charge",
            quantity=1 + (i % 4),
            unit_price=unit_p,
            base=base_a,
            variant_extra=0,
            discount=0,
            tax=tax_a,
            amount=tot_a
        ))
        if is_p:
            db.add(Payment(
                invoice_id=inv.id,
                method="bank_transfer" if i % 2 == 0 else "upi",
                amount=tot_a,
                paid_on=today - timedelta(days=14),
                note=f"Payment for {inv_num}",
                source="auto_batch"
            ))

db.commit()

# Seed notifications for Admin & Staff
admin_notifs = [
    ("Batch Billing Run Completed", "38 recurring subscriptions processed: ?14,20,500 invoiced with 0 errors.", "subscription", "normal", "admin-batch-run"),
    ("Integrity Audit Succeeded", "Ledger integrity check: 0 duplicate periods, invariant tests passed 100%.", "system", "low", "admin-audit-ok"),
    ("New Quotation Approved", "Quotation QT-8891 for Customer 14 Corporate was approved and converted.", "quotation", "normal", "admin-qt-8891"),
    ("Margin Floor Alert", "Discount SUMMER10 overridden for Enterprise Server by sales staff.", "pricing", "high", "admin-margin-alert"),
    ("Large Bank Match Identified", "Bank deposit of ?23,600 matched with 98% confidence across 3 invoices.", "payment", "normal", "admin-bank-match")
]

for title, msg, cat, prio, key in admin_notifs:
    if admin_usr:
        ex = db.query(Notification).filter(Notification.user_id == admin_usr.id, Notification.event_key == key).first()
        if not ex:
            db.add(Notification(user_id=admin_usr.id, title=title, message=msg, category=cat, priority=prio, event_key=key, is_read=False))
    if staff_usr:
        ex = db.query(Notification).filter(Notification.user_id == staff_usr.id, Notification.event_key == key).first()
        if not ex:
            db.add(Notification(user_id=staff_usr.id, title=title, message=msg, category=cat, priority=prio, event_key=key, is_read=False))

db.commit()

# Seed Outbox
outbox_entries = [
    ("rahul@example.com", "Invoice INV-RAHUL-04 from Brightloop Software", "Dear Rahul,\nYour invoice for Cloud Business Suite is ready.", "invoice", 1),
    ("ravi@techcorp.in", "Payment Receipt: ?4,34,428.00 Received", "Dear Ravi,\nWe have confirmed your payment via Bank Transfer.", "payment", 2),
    ("finance@techcorp.in", "Urgent: Overdue Notice for INV-RAVI-05", "Dear Finance Team,\nPlease note that invoice INV-RAVI-05 is now 10 days overdue.", "reminder", 3),
    ("customer12@example.com", "Subscription SUB-00512 Renewed", "Dear Customer,\nYour ERP Core server has been successfully renewed.", "subscription", 4),
]

for to_e, subj, body, kind, rel in outbox_entries:
    db.add(Outbox(to_email=to_e, subject=subj, body=body, kind=kind, related_id=rel))

db.commit()
print("LARGE ENRICHED DATASET SUCCESSFULLY COMMITTED!")
db.close()
