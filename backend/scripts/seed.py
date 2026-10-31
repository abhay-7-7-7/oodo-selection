import os
import sys
import random
import time
import json
from datetime import date, datetime, timedelta, timezone

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.product import Product, Variant
from app.models.plan import Plan
from app.models.tax import Tax
from app.models.discount import Discount
from app.models.quotation import QuotationTemplate, QuotationTemplateLine
from app.models.subscription import Subscription, SubscriptionLine
from app.models.audit import SubscriptionAudit
from app.models.invoice import Invoice, InvoiceLine
from app.models.payment import Payment
from app.core.security import get_password_hash


def utcnow():
    return datetime.now(timezone.utc)


def seed_database(reset: bool = False, count: int = 10000):
    start_total = time.perf_counter()
    print("=" * 60)
    print(f"Brightloop Software - High-Performance Database Seeder")
    print(f"Target Subscriptions: {count} | Reset: {reset}")
    print("=" * 60)

    if reset:
        print("Resetting database tables...")
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check idempotency
        existing_subs = db.query(Subscription).count()
        if existing_subs >= count and not reset:
            print(f"Database already contains {existing_subs} subscriptions. Skipping seeder (use --reset to rebuild).")
            return

        print("1. Seeding Users (Admin, 3 Staff, 100 Customers)...")
        # Pre-hash common passwords once for rapid seeding
        admin_hash = get_password_hash("AdminPassword@2026")
        staff_hash = get_password_hash("StaffPassword@2026")
        cust_hash = get_password_hash("CustomerPassword@2026")
        rahul_hash = get_password_hash("Brightloop@2026")

        users_to_add = [
            User(name="Admin User", email="admin@brightloop.com", password_hash=admin_hash, role="admin", is_active=True),
            User(name="Alex Vance", email="admin@brightloop.io", password_hash=admin_hash, role="admin", is_active=True),
            User(name="Anjali Staff", email="anjali@brightloop.com", password_hash=staff_hash, role="staff", is_active=True),
            User(name="Sarah Jenkins", email="sarah@brightloop.io", password_hash=staff_hash, role="staff", is_active=True),
            User(name="Rohan Staff", email="rohan@brightloop.com", password_hash=staff_hash, role="staff", is_active=True),
            User(name="Priya Staff", email="priya@brightloop.com", password_hash=staff_hash, role="staff", is_active=True),
            # Key demo customers
            User(name="Rahul Menon", email="rahul@example.com", password_hash=rahul_hash, role="customer", is_active=True),
            User(name="Ravi Patel", email="ravi@techcorp.in", password_hash=rahul_hash, role="customer", is_active=True)
        ]

        # 99 additional customers
        for i in range(2, 101):
            users_to_add.append(
                User(
                    name=f"Customer {i} Corporate",
                    email=f"customer{i}@example.com",
                    password_hash=cust_hash,
                    role="customer",
                    is_active=True
                )
            )

        db.add_all(users_to_add)
        db.commit()

        # Fetch customer IDs
        customers = db.query(User).filter(User.role == "customer").all()
        customer_ids = [c.id for c in customers]
        print(f"   Created {len(users_to_add)} users.")

        print("2. Seeding Catalog (Products, Variants, Plans, Taxes, Discounts)...")
        # Products & Variants
        products_data = [
            ("Cloud Business Suite", "software", 100000, 60000, "Enterprise ERP Suite", [("brand", "Standard", 0), ("brand", "Odoo", 56000), ("brand", "Enterprise", 120000)]),
            ("ERP Core Server", "software", 250000, 150000, "Dedicated compute node", [("cpu", "4-Core", 0), ("cpu", "8-Core", 80000), ("cpu", "16-Core", 180000)]),
            ("CRM Pro Module", "software", 80000, 40000, "Customer Relationship Management", [("tier", "Standard", 0), ("tier", "Advanced", 30000)]),
            ("Inventory & Warehouse", "software", 120000, 70000, "Stock & Warehouse logistics", [("locations", "Single", 0), ("locations", "Multi", 60000)]),
            ("Accounting & Invoicing Pack", "software", 90000, 50000, "Statutory compliance", [("audit", "Standard", 0), ("audit", "Pro", 40000)]),
            ("E-Commerce Storefront", "software", 150000, 90000, "Online retail gateway", [("type", "B2C", 0), ("type", "B2B Enterprise", 90000)]),
            ("Helpdesk & Customer Support", "software", 60000, 30000, "Ticketing & SLA", [("sla", "Standard", 0), ("sla", "Priority", 50000)]),
            ("HR & Payroll System", "software", 110000, 60000, "Staff attendance & payroll", [("seats", "Up to 50", 0), ("seats", "Unlimited", 100000)]),
            ("Manufacturing Execution Suite", "software", 300000, 180000, "BOM & Work Orders", [("edition", "Standard", 0), ("edition", "Smart Factory", 200000)]),
            ("Project Management & Time Tracking", "software", 70000, 35000, "Timesheets & Sprints", [("views", "Standard", 0), ("views", "Agile & Gantt", 25000)])
        ]

        created_products = []
        for p_name, p_type, s_price, c_price, notes, variants in products_data:
            prod = Product(name=p_name, type=p_type, sales_price=s_price, cost_price=c_price, notes=notes, is_active=True)
            db.add(prod)
            db.flush()
            for attr, val, extra in variants:
                v = Variant(product_id=prod.id, attribute=attr, value=val, price_extra=extra)
                db.add(v)
            created_products.append(prod)
        db.commit()

        # Plans
        plans_data = [
            Plan(name="Business Daily", price=10000, period="daily", min_qty=1, valid_from=date(2026, 1, 1), valid_to=date(2027, 12, 31), pausable=True, closable=True, renewable=True, is_active=True),
            Plan(name="Starter Weekly", price=50000, period="weekly", min_qty=1, valid_from=date(2026, 1, 1), valid_to=date(2027, 12, 31), pausable=True, closable=True, renewable=True, is_active=True),
            Plan(name="Business Monthly", price=200000, period="monthly", min_qty=2, valid_from=date(2026, 1, 1), valid_to=date(2027, 12, 31), pausable=True, closable=True, renewable=True, is_active=True),
            Plan(name="Enterprise Yearly", price=2000000, period="yearly", min_qty=5, valid_from=date(2026, 1, 1), valid_to=date(2027, 12, 31), pausable=True, closable=True, renewable=True, is_active=True)
        ]
        db.add_all(plans_data)
        db.commit()

        # Taxes
        taxes_data = [
            Tax(name="GST 0%", rate_percent="0.00", applies_to="all", is_active=True),
            Tax(name="GST 5%", rate_percent="5.00", applies_to="all", is_active=True),
            Tax(name="GST 12%", rate_percent="12.00", applies_to="all", is_active=True),
            Tax(name="GST 18%", rate_percent="18.00", applies_to="all", is_active=True),
            Tax(name="GST 28%", rate_percent="28.00", applies_to="all", is_active=True)
        ]
        db.add_all(taxes_data)
        db.commit()

        # Discounts
        discounts_data = [
            Discount(name="SUMMER10", kind="percent", value=10, min_amount=500000, min_qty=2, start_date=date(2026, 5, 1), end_date=date(2026, 11, 30), usage_limit=1000, times_used=15, scope="subscription", is_active=True),
            Discount(name="SAVE500", kind="fixed", value=50000, min_amount=200000, min_qty=2, start_date=date(2026, 1, 1), end_date=date(2026, 12, 31), usage_limit=500, times_used=8, scope="product", product_id=created_products[0].id, is_active=True),
            Discount(name="EXPIRED20", kind="percent", value=20, min_amount=100000, min_qty=1, start_date=date(2025, 1, 1), end_date=date(2025, 12, 31), usage_limit=50, times_used=50, scope="subscription", is_active=True),
            Discount(name="EXHAUSTED100", kind="fixed", value=10000, min_amount=10000, min_qty=1, start_date=date(2026, 1, 1), end_date=date(2026, 12, 31), usage_limit=10, times_used=10, scope="subscription", is_active=True)
        ]
        db.add_all(discounts_data)
        db.commit()

        # Quotation Templates
        odoo_var = db.query(Variant).filter(Variant.value == "Odoo").first()
        t1 = QuotationTemplate(name="Enterprise Starter", plan_id=plans_data[2].id, validity_days=15)
        db.add(t1)
        db.flush()
        db.add(QuotationTemplateLine(template_id=t1.id, product_id=created_products[0].id, variant_id=odoo_var.id, quantity=2))
        db.add(QuotationTemplateLine(template_id=t1.id, product_id=created_products[2].id, variant_id=None, quantity=1))

        t2 = QuotationTemplate(name="Retail Core", plan_id=plans_data[2].id, validity_days=30)
        db.add(t2)
        db.flush()
        db.add(QuotationTemplateLine(template_id=t2.id, product_id=created_products[3].id, variant_id=None, quantity=2))
        db.add(QuotationTemplateLine(template_id=t2.id, product_id=created_products[4].id, variant_id=None, quantity=2))
        db.commit()
        print("   Catalog seeded successfully.")

        print(f"3. Fast Bulk-Seeding {count} Subscriptions, Lines, Invoices & Payments...")
        # Prepare lookup maps
        prod_list = db.query(Product).all()
        tax_gst18 = db.query(Tax).filter(Tax.rate_percent == "18.00").first()
        monthly_plan = plans_data[2]
        yearly_plan = plans_data[3]
        weekly_plan = plans_data[1]

        # Pre-seed Rahul Menon's subscription SUB-00001 (Template-based: Cloud Business Suite + Odoo x 2)
        rahul = db.query(User).filter(User.email == "rahul@example.com").first()
        rahul_sub = Subscription(
            number="SUB-00001",
            customer_id=rahul.id,
            plan_id=monthly_plan.id,
            start_date=date(2026, 11, 1),
            expiry_date=date(2026, 11, 1) + timedelta(days=15),
            payment_terms="net_15",
            status="active",
            next_billing_date=date(2026, 11, 1),
            is_paused=False
        )
        db.add(rahul_sub)
        db.flush()

        unit_p = created_products[0].sales_price + odoo_var.price_extra  # 156000
        rahul_line = SubscriptionLine(
            subscription_id=rahul_sub.id,
            product_id=created_products[0].id,
            variant_id=odoo_var.id,
            quantity=2,
            unit_price=unit_p,
            tax_id=tax_gst18.id,
            amount=unit_p * 2
        )
        db.add(rahul_line)
        db.add(SubscriptionAudit(subscription_id=rahul_sub.id, from_status="none", to_status="draft", at=utcnow()))
        db.add(SubscriptionAudit(subscription_id=rahul_sub.id, from_status="draft", to_status="quotation", at=utcnow()))
        db.add(SubscriptionAudit(subscription_id=rahul_sub.id, from_status="quotation", to_status="confirmed", at=utcnow()))
        db.add(SubscriptionAudit(subscription_id=rahul_sub.id, from_status="confirmed", to_status="active", at=utcnow()))
        db.commit()

        # Generate bulk data in batches of 2000
        batch_size = 2000
        total_remaining = count - 1

        all_products_with_variants = []
        for p in prod_list:
            vars_list = p.variants
            if vars_list:
                for v in vars_list:
                    all_products_with_variants.append((p, v))
            else:
                all_products_with_variants.append((p, None))

        today = date.today()
        base_start = date(2026, 1, 1)

        sub_index = 2
        inv_index = 1

        for batch_num in range(0, total_remaining, batch_size):
            current_batch_count = min(batch_size, total_remaining - batch_num)
            subs_batch = []
            lines_batch = []
            audits_batch = []
            invoices_batch = []
            inv_lines_batch = []
            payments_batch = []

            for _ in range(current_batch_count):
                sub_num = f"SUB-{sub_index:05d}"
                c_id = random.choice(customer_ids)

                # Distribution: 80% active, 10% paused, 8% closed, 2% draft/quotation
                rand_val = random.random()
                if rand_val < 0.80:
                    status_choice = "active"
                    is_paused = False
                elif rand_val < 0.90:
                    status_choice = "active"
                    is_paused = True
                elif rand_val < 0.98:
                    status_choice = "closed"
                    is_paused = False
                else:
                    status_choice = random.choice(["draft", "quotation", "confirmed"])
                    is_paused = False

                plan_choice = random.choice([monthly_plan, monthly_plan, monthly_plan, yearly_plan, weekly_plan])
                start_d = base_start + timedelta(days=random.randint(0, 200))
                expiry_d = start_d + timedelta(days=365) if plan_choice.period == "yearly" else None
                next_bill_d = today + timedelta(days=random.randint(-30, 30)) if status_choice == "active" else start_d
                pay_terms = random.choice(["due_on_receipt", "net_15", "net_30"])

                sub = Subscription(
                    number=sub_num,
                    customer_id=c_id,
                    plan_id=plan_choice.id,
                    start_date=start_d,
                    expiry_date=expiry_d,
                    payment_terms=pay_terms,
                    status=status_choice,
                    next_billing_date=next_bill_d,
                    is_paused=is_paused,
                    paused_at=utcnow() if is_paused else None
                )
                db.add(sub)
                subs_batch.append(sub)
                sub_index += 1

            db.flush()  # assign IDs to subs

            # Now attach lines, audits, invoices, payments
            for sub in subs_batch:
                # Add audit
                audits_batch.append(
                    SubscriptionAudit(
                        subscription_id=sub.id,
                        from_status="none",
                        to_status=sub.status,
                        at=utcnow()
                    )
                )

                # Add 1 to 3 lines
                num_lines = random.randint(1, 3)
                chosen_pairs = random.sample(all_products_with_variants, num_lines)
                sub_total_paise = 0

                for prod, var in chosen_pairs:
                    qty = random.randint(1, 4)
                    base_p = prod.sales_price
                    var_p = var.price_extra if var else 0
                    u_price = base_p + var_p
                    l_amount = u_price * qty
                    sub_total_paise += l_amount

                    lines_batch.append(
                        SubscriptionLine(
                            subscription_id=sub.id,
                            product_id=prod.id,
                            variant_id=var.id if var else None,
                            quantity=qty,
                            unit_price=u_price,
                            tax_id=tax_gst18.id,
                            amount=l_amount
                        )
                    )

                # Seed invoices for active/closed subscriptions
                if sub.status in ("active", "closed") and random.random() < 0.70:
                    inv_num = f"INV-{inv_index:05d}"
                    inv_index += 1

                    p_start = sub.start_date
                    p_end = p_start + timedelta(days=30)
                    issue_d = p_start
                    due_d = issue_d + timedelta(days=15 if sub.payment_terms == "net_15" else 30)

                    # Tax 18%
                    tax_amt = int(sub_total_paise * 18 / 100)
                    tot_amt = sub_total_paise + tax_amt

                    # Invoice status distribution
                    inv_rand = random.random()
                    if inv_rand < 0.40:
                        inv_status = "paid"
                        paid_amt = tot_amt
                    elif inv_rand < 0.70:
                        inv_status = "confirmed"
                        paid_amt = tot_amt // 2  # partially paid
                    elif inv_rand < 0.90:
                        inv_status = "confirmed"
                        paid_amt = 0  # unpaid / overdue
                    else:
                        inv_status = "draft"
                        paid_amt = 0

                    inv = Invoice(
                        number=inv_num,
                        subscription_id=sub.id,
                        customer_id=sub.customer_id,
                        period_start=p_start,
                        period_end=p_end,
                        issue_date=issue_d,
                        due_date=due_d,
                        status=inv_status,
                        subtotal=sub_total_paise,
                        discount_total=0,
                        tax_total=tax_amt,
                        total=tot_amt,
                        paid_total=paid_amt
                    )
                    db.add(inv)
                    invoices_batch.append((inv, paid_amt))

            db.flush()

            # Process invoice lines and payments
            for inv, paid_amt in invoices_batch:
                # Add invoice line
                inv_lines_batch.append(
                    InvoiceLine(
                        invoice_id=inv.id,
                        description="Subscription Services",
                        quantity=1,
                        unit_price=inv.subtotal,
                        base=inv.subtotal,
                        variant_extra=0,
                        discount=0,
                        tax=inv.tax_total,
                        amount=inv.total,
                        snapshot=json.dumps({"seeded": True, "total": inv.total})
                    )
                )

                if paid_amt > 0:
                    payments_batch.append(
                        Payment(
                            invoice_id=inv.id,
                            method="UPI",
                            amount=paid_amt,
                            paid_on=inv.issue_date + timedelta(days=2),
                            note="Seeded payment",
                            source="manual"
                        )
                    )

            db.bulk_save_objects(lines_batch)
            db.bulk_save_objects(audits_batch)
            db.bulk_save_objects(inv_lines_batch)
            db.bulk_save_objects(payments_batch)
            db.commit()

            print(f"   Committed batch: {batch_num + current_batch_count}/{total_remaining} subscriptions.")

        total_elapsed = time.perf_counter() - start_total
        print("=" * 60)
        print(f"Database Seeding Completed in {total_elapsed:.2f} seconds!")
        print(f"Subscriptions: {db.query(Subscription).count()}")
        print(f"Invoices:      {db.query(Invoice).count()}")
        print(f"Payments:      {db.query(Payment).count()}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    should_reset = "--reset" in sys.argv
    count_arg = 10000
    for arg in sys.argv[1:]:
        if arg.isdigit():
            count_arg = int(arg)
    seed_database(reset=should_reset, count=count_arg)
