import os
import sys

# Ensure UTF-8 console output on Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine


def run_e2e_acceptance_demo():
    print("=" * 80)
    print("BRIGHTLOOP SOFTWARE - PART M COMPLETE END-TO-END BUSINESS ACCEPTANCE TEST")
    print("=" * 80)

    # Re-initialize clean test schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    client = TestClient(app)

    # -------------------------------------------------------------
    # Step 1: Admin and Staff Setup
    # -------------------------------------------------------------
    print("\n[Step 1] Setting up initial Admin and Staff accounts...")
    # Register admin via database helper or direct signup
    from app.models.user import User
    from app.database import SessionLocal
    from app.core.security import get_password_hash

    db = SessionLocal()
    admin_u = User(
        name="Admin Boss",
        email="admin@brightloop.com",
        password_hash=get_password_hash("AdminPassword@2026"),
        role="admin",
        is_active=True
    )
    db.add(admin_u)
    db.commit()
    db.close()

    # Admin Login
    res_admin_login = client.post("/api/auth/login", json={
        "email": "admin@brightloop.com",
        "password": "AdminPassword@2026"
    })
    assert res_admin_login.status_code == 200, res_admin_login.text
    admin_token = res_admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("   Admin logged in successfully.")

    # Admin creates Staff
    res_staff_create = client.post("/api/staff", json={
        "name": "Anjali Staff",
        "email": "anjali@brightloop.com",
        "password": "StaffPassword@2026"
    }, headers=admin_headers)
    assert res_staff_create.status_code == 201, res_staff_create.text
    print("   Staff account created for Anjali (anjali@brightloop.com).")

    # Staff Login
    res_staff_login = client.post("/api/auth/login", json={
        "email": "anjali@brightloop.com",
        "password": "StaffPassword@2026"
    })
    assert res_staff_login.status_code == 200, res_staff_login.text
    staff_token = res_staff_login.json()["token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    print("   Staff logged in successfully.")

    # -------------------------------------------------------------
    # Step 2: Admin configures Catalog (Product, Variant, Plan, Tax, Discount)
    # -------------------------------------------------------------
    print("\n[Step 2] Admin creates Catalog entities...")
    # Product: Cloud Business Suite (Base: ₹1,000 = 100000 paise, Cost: ₹600 = 60000 paise)
    res_prod = client.post("/api/products", json={
        "name": "Cloud Business Suite",
        "type": "software",
        "sales_price": 100000,
        "cost_price": 60000,
        "notes": "Flagship ERP suite"
    }, headers=admin_headers)
    assert res_prod.status_code == 201, res_prod.text
    product_id = res_prod.json()["id"]
    print(f"   Created Product: Cloud Business Suite (ID: {product_id}, Base: ₹1,000 / 100000 paise)")

    # Variant: Odoo (+₹560 = 56000 paise)
    res_var = client.post(f"/api/products/{product_id}/variants", json={
        "attribute": "brand",
        "value": "Odoo",
        "price_extra": 56000
    }, headers=admin_headers)
    assert res_var.status_code == 201, res_var.text
    variant_id = res_var.json()["id"]
    print(f"   Created Variant: brand = Odoo (+₹560 / 56000 paise, ID: {variant_id})")

    # Plan: Business Monthly (Price: ₹2,000, Period: Monthly, Min Qty: 2, Pausable, Closable, Renewable)
    res_plan = client.post("/api/plans", json={
        "name": "Business Monthly",
        "price": 200000,
        "period": "monthly",
        "min_qty": 2,
        "valid_from": "2026-10-01",
        "valid_to": "2027-03-31",
        "auto_close": True,
        "closable": True,
        "pausable": True,
        "renewable": True
    }, headers=admin_headers)
    assert res_plan.status_code == 201, res_plan.text
    plan_id = res_plan.json()["id"]
    print(f"   Created Plan: Business Monthly (ID: {plan_id}, Min Qty: 2, Period: monthly)")

    # Tax: GST 18%
    res_tax = client.post("/api/taxes", json={
        "name": "GST 18%",
        "rate_percent": "18.00",
        "applies_to": "all"
    }, headers=admin_headers)
    assert res_tax.status_code == 201, res_tax.text
    tax_id = res_tax.json()["id"]
    print(f"   Created Tax: GST 18% (ID: {tax_id})")

    # Discount: SUMMER10 (10% percent, min_qty: 2, min_amount: 500000, valid for Oct-Nov, limit: 10)
    res_disc = client.post("/api/discounts", json={
        "name": "SUMMER10",
        "kind": "percent",
        "value": 10,
        "min_amount": 200000,  # 200000 paise = 2,000 min
        "min_qty": 2,
        "start_date": "2026-10-01",
        "end_date": "2026-11-30",
        "usage_limit": 10,
        "scope": "subscription",
        "product_id": None
    }, headers=admin_headers)
    assert res_disc.status_code == 201, res_disc.text
    discount_id = res_disc.json()["id"]
    print(f"   Created Discount: SUMMER10 (10% off, Min Qty: 2, ID: {discount_id})")

    # Quotation Template: Enterprise Starter
    res_tpl = client.post("/api/quotation-templates", json={
        "name": "Enterprise Starter Template",
        "plan_id": plan_id,
        "validity_days": 15,
        "lines": [{
            "product_id": product_id,
            "variant_id": variant_id,
            "quantity": 2
        }]
    }, headers=staff_headers)
    assert res_tpl.status_code == 201, res_tpl.text
    template_id = res_tpl.json()["id"]
    print(f"   Created Quotation Template: Enterprise Starter (ID: {template_id})")

    # -------------------------------------------------------------
    # Step 3: Customer Registration (Rahul Menon)
    # -------------------------------------------------------------
    print("\n[Step 3] Customer Rahul Menon registers independently...")
    res_signup = client.post("/api/auth/signup", json={
        "name": "Rahul Menon",
        "email": "rahul@example.com",
        "password": "Brightloop@2026"
    })
    assert res_signup.status_code == 201, res_signup.text
    rahul_id = res_signup.json()["id"]
    print(f"   Rahul Menon registered (Customer ID: {rahul_id}, Email: rahul@example.com)")

    # Rahul logs in
    res_rahul_login = client.post("/api/auth/login", json={
        "email": "rahul@example.com",
        "password": "Brightloop@2026"
    })
    assert res_rahul_login.status_code == 200, res_rahul_login.text
    rahul_token = res_rahul_login.json()["token"]
    rahul_headers = {"Authorization": f"Bearer {rahul_token}"}
    print("   Rahul Menon logged into Customer Portal.")

    # -------------------------------------------------------------
    # Step 4: Staff creates Subscription from Template & Advances Status
    # -------------------------------------------------------------
    print("\n[Step 4] Staff creates Subscription from Template and moves lifecycle...")
    res_sub = client.post("/api/subscriptions", json={
        "customer_id": rahul_id,
        "plan_id": plan_id,
        "template_id": template_id,
        "start_date": "2026-11-01",
        "payment_terms": "net_15"
    }, headers=staff_headers)
    assert res_sub.status_code == 201, res_sub.text
    sub_data = res_sub.json()
    sub_id = sub_data["id"]
    sub_number = sub_data["number"]
    print(f"   Created Subscription: {sub_number} (ID: {sub_id}, Initial Status: {sub_data['status']})")
    assert sub_data["status"] == "quotation"

    # Status transitions: Quotation -> Confirmed -> Active
    res_t1 = client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "confirmed"}, headers=staff_headers)
    assert res_t1.status_code == 200
    print("   Transitioned Subscription -> Confirmed")

    res_t2 = client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "active"}, headers=staff_headers)
    assert res_t2.status_code == 200
    print("   Transitioned Subscription -> Active")

    # -------------------------------------------------------------
    # Step 5: Billing Engine Run on Due Date (2026-11-01)
    # -------------------------------------------------------------
    print("\n[Step 5] Running Billing Engine on 2026-11-01...")
    res_billing1 = client.post("/api/billing/run", json={
        "as_of_date": "2026-11-01",
        "dry_run": False
    }, headers=staff_headers)
    assert res_billing1.status_code == 200, res_billing1.text
    billing_data1 = res_billing1.json()
    print(f"   Billing run 1 output: Created={billing_data1['created']}, Skipped={billing_data1['skipped']}")
    assert billing_data1["created"] >= 1

    # Fetch generated invoice
    res_invoices = client.get(f"/api/invoices?customer_id={rahul_id}", headers=staff_headers)
    assert res_invoices.status_code == 200, res_invoices.text
    inv_list = res_invoices.json()["items"]
    assert len(inv_list) == 1, "Expected exactly 1 invoice for Rahul Menon"
    invoice = inv_list[0]
    inv_id = invoice["id"]
    inv_number = invoice["number"]

    print("\n   [VERIFICATION OF INVOICE CALCULATIONS]")
    print(f"   Base Price:        ₹1,000 (100000 paise)")
    print(f"   Variant Extra:     ₹560   (56000 paise)")
    print(f"   Unit Price:        ₹1,560 (156000 paise)")
    print(f"   Quantity:          2")
    print(f"   Subtotal:          {invoice['subtotal']} paise (₹{invoice['subtotal']/100:.2f}) [Expected: 312000 paise]")
    print(f"   SUMMER10 Discount: {invoice['discount_total']} paise (₹{invoice['discount_total']/100:.2f}) [Expected: 31200 paise]")
    print(f"   Taxable Amount:    {invoice['subtotal'] - invoice['discount_total']} paise (₹{(invoice['subtotal'] - invoice['discount_total'])/100:.2f}) [Expected: 280800 paise]")
    print(f"   GST 18% Tax:       {invoice['tax_total']} paise (₹{invoice['tax_total']/100:.2f}) [Expected: 50544 paise]")
    print(f"   Final Total:       {invoice['total']} paise (₹{invoice['total']/100:.2f}) [Expected: 331344 paise]")

    assert invoice["subtotal"] == 312000, f"Expected subtotal 312000, got {invoice['subtotal']}"
    assert invoice["discount_total"] == 31200, f"Expected discount 31200, got {invoice['discount_total']}"
    assert invoice["tax_total"] == 50544, f"Expected tax 50544, got {invoice['tax_total']}"
    assert invoice["total"] == 331344, f"Expected total 331344, got {invoice['total']}"
    assert invoice["subtotal"] - invoice["discount_total"] + invoice["tax_total"] == invoice["total"]
    print("   ✓ All financial figures reconcile down to the exact single paise!")

    # -------------------------------------------------------------
    # Step 6: Idempotency Check - Run Billing Again
    # -------------------------------------------------------------
    print("\n[Step 6] Running Billing Engine again for 2026-11-01 (Idempotency test)...")
    res_billing2 = client.post("/api/billing/run", json={
        "as_of_date": "2026-11-01",
        "dry_run": False
    }, headers=staff_headers)
    assert res_billing2.status_code == 200
    billing_data2 = res_billing2.json()
    print(f"   Billing run 2 output: Created={billing_data2['created']}, Skipped={billing_data2['skipped']}")
    assert billing_data2["created"] == 0, f"Expected 0 created invoices, got {billing_data2['created']}"

    # Verify database still has exactly 1 invoice for Rahul
    invs_after = client.get(f"/api/invoices?customer_id={rahul_id}", headers=staff_headers).json()["items"]
    assert len(invs_after) == 1, "Expected still exactly 1 invoice"
    print("   ✓ Exactly 0 duplicate invoices created on repeat run!")

    # -------------------------------------------------------------
    # Step 7: Record Partial Payment (₹1,000 = 100000 paise)
    # -------------------------------------------------------------
    print("\n[Step 7] Recording first partial payment of ₹1,000 (100000 paise)...")
    res_pay1 = client.post(f"/api/invoices/{inv_id}/payments", json={
        "method": "UPI",
        "amount": 100000,
        "paid_on": "2026-11-05",
        "note": "Partial payment via UPI"
    }, headers=staff_headers)
    assert res_pay1.status_code == 201, res_pay1.text
    pay1_data = res_pay1.json()
    print(f"   Payment 1 recorded: Paid Total = {pay1_data['paid_total']} paise (₹{pay1_data['paid_total']/100:.2f})")
    print(f"   Outstanding Balance = {pay1_data['outstanding']} paise (₹{pay1_data['outstanding']/100:.2f}) [Expected: 231344 paise]")
    assert pay1_data["paid_total"] == 100000
    assert pay1_data["outstanding"] == 231344
    print("   ✓ Partial payment leaves exact balance of ₹2,313.44!")

    # -------------------------------------------------------------
    # Step 8: Record Remaining Payment (231344 paise)
    # -------------------------------------------------------------
    print("\n[Step 8] Recording remaining payment of ₹2,313.44 (231344 paise)...")
    res_pay2 = client.post(f"/api/invoices/{inv_id}/payments", json={
        "method": "card",
        "amount": 231344,
        "paid_on": "2026-11-06",
        "note": "Settlement of remaining balance"
    }, headers=staff_headers)
    assert res_pay2.status_code == 201, res_pay2.text
    pay2_data = res_pay2.json()
    print(f"   Payment 2 recorded: Paid Total = {pay2_data['paid_total']} paise")
    print(f"   Outstanding Balance = {pay2_data['outstanding']} paise")
    print(f"   Invoice Status = '{pay2_data['invoice_status']}'")
    assert pay2_data["outstanding"] == 0
    assert pay2_data["invoice_status"] == "paid"
    print("   ✓ Invoice is fully settled and status updated to 'paid'!")

    # -------------------------------------------------------------
    # Step 9: Customer Portal & Data Isolation Verification
    # -------------------------------------------------------------
    print("\n[Step 9] Customer Portal & Cross-Tenant Data Isolation...")
    # Rahul retrieves his subscriptions
    res_portal_subs = client.get("/api/portal/subscriptions", headers=rahul_headers)
    assert res_portal_subs.status_code == 200
    portal_subs = res_portal_subs.json()
    assert len(portal_subs) == 1
    assert portal_subs[0]["number"] == sub_number
    print(f"   ✓ Rahul sees his subscription: {portal_subs[0]['number']}")

    # Rahul retrieves his invoices
    res_portal_invs = client.get("/api/portal/invoices", headers=rahul_headers)
    assert res_portal_invs.status_code == 200
    portal_invs = res_portal_invs.json()
    assert len(portal_invs) == 1
    assert portal_invs[0]["number"] == inv_number
    print(f"   ✓ Rahul sees his invoice: {portal_invs[0]['number']}")

    # Another customer registration
    res_other = client.post("/api/auth/signup", json={
        "name": "Other Person",
        "email": "other@example.com",
        "password": "OtherPassword@2026"
    })
    other_token = client.post("/api/auth/login", json={"email": "other@example.com", "password": "OtherPassword@2026"}).json()["token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Other customer tries to access Rahul's invoice directly
    res_unauth_inv = client.get(f"/api/invoices/{inv_id}", headers=other_headers)
    print(f"   Other customer attempting GET /api/invoices/{inv_id}: HTTP {res_unauth_inv.status_code}")
    assert res_unauth_inv.status_code == 403
    print("   ✓ Cross-tenant access successfully blocked with HTTP 403 Forbidden!")

    # -------------------------------------------------------------
    # Step 10: Financial Summary Verification
    # -------------------------------------------------------------
    print("\n[Step 10] Verifying Finance Summary Reporting...")
    res_report = client.get("/api/reports/summary", headers=staff_headers)
    assert res_report.status_code == 200
    rep_data = res_report.json()
    print(f"   Active Subscriptions: {rep_data['active_subscriptions']}")
    print(f"   Revenue Received:     {rep_data['revenue_received']} paise (₹{rep_data['revenue_received']/100:.2f})")
    print(f"   Outstanding Revenue:  {rep_data['outstanding']} paise")
    print(f"   MRR:                  {rep_data['mrr']} paise (₹{rep_data['mrr']/100:.2f})")
    print(f"   Query Time:           {rep_data['query_ms']} ms")
    assert rep_data["active_subscriptions"] == 1
    assert rep_data["revenue_received"] == 331344
    assert rep_data["outstanding"] == 0
    print("   ✓ Financial metrics match actual database records!")

    print("\n" + "=" * 80)
    print("PART M END-TO-END DEMONSTRATION COMPLETED WITH 100% SUCCESS!")
    print("=" * 80)


if __name__ == "__main__":
    run_e2e_acceptance_demo()
