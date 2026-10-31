from datetime import date
from app.models.product import Product
from app.models.plan import Plan


def test_subscription_creation_and_plan_availability(client, db, staff_headers, customer_user):
    prod = Product(name="App Service", sales_price=50000, cost_price=20000, is_active=True)
    plan_future = Plan(
        name="Future Plan",
        price=100000,
        period="monthly",
        min_qty=1,
        valid_from=date(2027, 1, 1),
        valid_to=date(2027, 12, 31),
        is_active=True
    )
    db.add_all([prod, plan_future])
    db.commit()

    # Attempt to start subscription before plan is valid -> 409
    res = client.post("/api/subscriptions", json={
        "customer_id": customer_user.id,
        "plan_id": plan_future.id,
        "start_date": "2026-11-01",
        "lines": [{"product_id": prod.id, "quantity": 1}]
    }, headers=staff_headers)
    assert res.status_code == 409


def test_subscription_minimum_quantity_enforced(client, db, staff_headers, customer_user):
    prod = Product(name="Seats", sales_price=10000, cost_price=5000, is_active=True)
    plan = Plan(
        name="Corporate Plan",
        price=50000,
        period="monthly",
        min_qty=5,
        valid_from=date(2026, 1, 1),
        is_active=True
    )
    db.add_all([prod, plan])
    db.commit()

    # Attempt with qty 3 < min_qty 5 -> 422
    res = client.post("/api/subscriptions", json={
        "customer_id": customer_user.id,
        "plan_id": plan.id,
        "start_date": "2026-11-01",
        "lines": [{"product_id": prod.id, "quantity": 3}]
    }, headers=staff_headers)
    assert res.status_code == 422


def test_illegal_status_transitions_rejected(client, db, staff_headers, customer_user):
    prod = Product(name="Item", sales_price=20000, cost_price=10000, is_active=True)
    plan = Plan(name="Flex Plan", price=20000, period="monthly", min_qty=1, valid_from=date(2026, 1, 1), is_active=True)
    db.add_all([prod, plan])
    db.commit()

    res = client.post("/api/subscriptions", json={
        "customer_id": customer_user.id,
        "plan_id": plan.id,
        "start_date": "2026-11-01",
        "lines": [{"product_id": prod.id, "quantity": 1}]
    }, headers=staff_headers)
    sub_id = res.json()["id"]
    assert res.json()["status"] == "draft"

    # Illegal: draft -> active directly -> 409
    res_illegal = client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "active"}, headers=staff_headers)
    assert res_illegal.status_code == 409

    # Legal sequence: draft -> quotation -> confirmed -> active
    r1 = client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "quotation"}, headers=staff_headers)
    assert r1.status_code == 200
    r2 = client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "confirmed"}, headers=staff_headers)
    assert r2.status_code == 200
    r3 = client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "active"}, headers=staff_headers)
    assert r3.status_code == 200
    assert r3.json()["status"] == "active"


def test_pause_close_renew_gated_by_plan_flags(client, db, staff_headers, customer_user):
    prod = Product(name="Strict Item", sales_price=50000, cost_price=20000, is_active=True)
    strict_plan = Plan(
        name="Strict Plan",
        price=50000,
        period="monthly",
        min_qty=1,
        valid_from=date(2026, 1, 1),
        pausable=False,
        closable=False,
        renewable=False,
        is_active=True
    )
    db.add_all([prod, strict_plan])
    db.commit()

    res = client.post("/api/subscriptions", json={
        "customer_id": customer_user.id,
        "plan_id": strict_plan.id,
        "start_date": "2026-11-01",
        "lines": [{"product_id": prod.id, "quantity": 1}]
    }, headers=staff_headers)
    sub_id = res.json()["id"]

    # Move to active
    client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "quotation"}, headers=staff_headers)
    client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "confirmed"}, headers=staff_headers)
    client.post(f"/api/subscriptions/{sub_id}/transition", json={"to": "active"}, headers=staff_headers)

    # Pause should fail because pausable=False
    r_pause = client.post(f"/api/subscriptions/{sub_id}/pause", headers=staff_headers)
    assert r_pause.status_code == 409

    # Close should fail because closable=False
    r_close = client.post(f"/api/subscriptions/{sub_id}/close", json={"reason": "Test"}, headers=staff_headers)
    assert r_close.status_code == 409

    # Renew should fail because renewable=False
    r_renew = client.post(f"/api/subscriptions/{sub_id}/renew", headers=staff_headers)
    assert r_renew.status_code == 409
