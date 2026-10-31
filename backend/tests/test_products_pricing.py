from datetime import date
from app.models.product import Product, Variant
from app.models.tax import Tax
from app.models.discount import Discount
from app.services.pricing_service import PricingService, PricingLineItem


def test_product_creation_works(client, admin_headers):
    res = client.post("/api/products", json={
        "name": "Cloud Business Suite",
        "type": "software",
        "sales_price": 100000,
        "cost_price": 60000,
        "notes": "Business management software"
    }, headers=admin_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Cloud Business Suite"
    assert data["sales_price"] == 100000


def test_variant_must_belong_to_selected_product(client, db, admin_headers, staff_headers, customer_user):
    # Create two products
    p1 = Product(name="Prod 1", sales_price=100000, cost_price=60000, is_active=True)
    p2 = Product(name="Prod 2", sales_price=200000, cost_price=120000, is_active=True)
    db.add_all([p1, p2])
    db.flush()

    # Variant for p2
    v2 = Variant(product_id=p2.id, attribute="edition", value="Enterprise", price_extra=50000)
    db.add(v2)
    db.commit()

    # Create plan
    res_plan = client.post("/api/plans", json={
        "name": "Standard Plan",
        "price": 10000,
        "period": "monthly",
        "min_qty": 1,
        "valid_from": "2026-01-01"
    }, headers=admin_headers)
    plan_id = res_plan.json()["id"]

    # Try to create subscription with product p1 and variant v2 (which belongs to p2)
    res = client.post("/api/subscriptions", json={
        "customer_id": customer_user.id,
        "plan_id": plan_id,
        "start_date": "2026-11-01",
        "lines": [{
            "product_id": p1.id,
            "variant_id": v2.id,
            "quantity": 1
        }]
    }, headers=staff_headers)
    assert res.status_code == 422
    assert "variant does not belong to the selected product" in res.json()["detail"].lower()


def test_pricing_variant_extra_and_tax_calculation(db):
    p = Product(name="Cloud Business Suite", sales_price=100000, cost_price=60000, is_active=True)
    db.add(p)
    db.flush()
    v = Variant(product_id=p.id, attribute="brand", value="Odoo", price_extra=56000)
    db.add(v)
    tax = Tax(name="GST 18%", rate_percent="18.00", applies_to="all", is_active=True)
    db.add(tax)
    disc = Discount(
        name="SUMMER10",
        kind="percent",
        value=10,
        min_amount=200000,
        min_qty=2,
        start_date=date(2026, 10, 1),
        end_date=date(2026, 11, 30),
        usage_limit=100,
        times_used=0,
        scope="subscription",
        is_active=True
    )
    db.add(disc)
    db.commit()

    # Scenario: 2 units of Cloud Business Suite (Odoo variant = 156000 unit price)
    item = PricingLineItem(product=p, variant=v, quantity=2, tax=tax)
    result = PricingService.calculate_pricing(db, [item], as_of_date=date(2026, 11, 1), applied_discount=disc)

    assert result["base_amount"] == 200000
    assert result["variant_extra"] == 112000
    assert result["subtotal"] == 312000
    assert result["discount_total"] == 31200
    assert result["taxable_amount"] == 280800
    assert result["tax_total"] == 50544
    assert result["total"] == 331344


def test_discount_minimum_quantity_and_amount_rules(db):
    p = Product(name="Item A", sales_price=50000, cost_price=20000, is_active=True)
    db.add(p)
    tax = Tax(name="GST 0%", rate_percent="0.00", applies_to="all", is_active=True)
    db.add(tax)
    disc = Discount(
        name="BULK5",
        kind="fixed",
        value=20000,
        min_amount=200000,  # ₹2,000
        min_qty=5,
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        usage_limit=10,
        times_used=0,
        scope="subscription",
        is_active=True
    )
    db.add(disc)
    db.commit()

    # Quantity 3 -> Subtotal 150000 (< min_qty 5 and < min_amount 200000) -> Not eligible
    item_low = PricingLineItem(product=p, variant=None, quantity=3, tax=tax)
    res_low = PricingService.calculate_pricing(db, [item_low], as_of_date=date(2026, 6, 1), applied_discount=disc)
    assert res_low["discount_total"] == 0

    # Quantity 5 -> Subtotal 250000 (>= min_qty 5 and >= min_amount 200000) -> Eligible
    item_ok = PricingLineItem(product=p, variant=None, quantity=5, tax=tax)
    res_ok = PricingService.calculate_pricing(db, [item_ok], as_of_date=date(2026, 6, 1), applied_discount=disc)
    assert res_ok["discount_total"] == 20000


def test_expired_discounts_are_rejected(db):
    p = Product(name="Item B", sales_price=100000, cost_price=50000, is_active=True)
    db.add(p)
    tax = Tax(name="GST 0%", rate_percent="0.00", applies_to="all", is_active=True)
    db.add(tax)
    disc = Discount(
        name="EXPIRED",
        kind="percent",
        value=15,
        min_amount=0,
        min_qty=1,
        start_date=date(2025, 1, 1),
        end_date=date(2025, 12, 31),
        usage_limit=100,
        times_used=0,
        scope="subscription",
        is_active=True
    )
    db.add(disc)
    db.commit()

    item = PricingLineItem(product=p, variant=None, quantity=1, tax=tax)
    # as_of_date in 2026 (after expiry)
    res = PricingService.calculate_pricing(db, [item], as_of_date=date(2026, 6, 1), applied_discount=None)
    assert res["discount_total"] == 0
