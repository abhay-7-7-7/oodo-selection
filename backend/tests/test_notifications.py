from datetime import date, timedelta
import pytest
from app.models.user import User
from app.models.product import Product
from app.models.plan import Plan
from app.models.subscription import Subscription, SubscriptionLine
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.notification import Notification, NotificationPreference
from app.core.security import get_password_hash


def test_customer_registration_triggers_notifications(client, db):
    # Customer signup
    resp = client.post("/api/auth/signup", json={
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "password": "Password@2026!"
    })
    assert resp.status_code == 201
    customer_id = resp.json()["id"]

    # Verify customer received welcome notification
    notifs = db.query(Notification).filter(Notification.user_id == customer_id).all()
    assert len(notifs) >= 1
    welcome = next((n for n in notifs if n.event_key == f"user:{customer_id}:welcome"), None)
    assert welcome is not None
    assert welcome.category == "account"
    assert "Welcome" in welcome.title

    # Verify admin and staff received notification
    admin = db.query(User).filter(User.role == "admin").first()
    if admin:
        admin_notif = db.query(Notification).filter(
            Notification.user_id == admin.id,
            Notification.event_key == f"user:{customer_id}:admin_registered:{admin.id}"
        ).first()
        assert admin_notif is not None
        assert "New Customer Registration" in admin_notif.title


def test_staff_creation_triggers_notifications(client, admin_headers, db):
    resp = client.post("/api/staff", headers=admin_headers, json={
        "name": "New Staff Member",
        "email": "staff.member@brightloop.com",
        "password": "StaffPassword@2026!"
    })
    assert resp.status_code == 201
    staff_id = resp.json()["id"]

    # Verify staff received welcome notification
    staff_notif = db.query(Notification).filter(
        Notification.user_id == staff_id,
        Notification.event_key == f"user:{staff_id}:welcome_staff"
    ).first()
    assert staff_notif is not None
    assert "Staff Portal" in staff_notif.title

    # Verify admin received staff creation notification
    admin = db.query(User).filter(User.role == "admin").first()
    admin_notif = db.query(Notification).filter(
        Notification.user_id == admin.id,
        Notification.event_key == f"staff:{staff_id}:created:{admin.id}"
    ).first()
    assert admin_notif is not None
    assert "New Staff Account Created" in admin_notif.title


def test_forgot_password_triggers_notification(client, customer_user, db):
    resp = client.post("/api/auth/forgot-password", json={
        "email": customer_user.email
    })
    assert resp.status_code == 200

    # Verify security notification for customer
    notif = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.category == "account",
        Notification.priority == "high"
    ).first()
    assert notif is not None
    assert "Password Reset Requested" in notif.title


def test_get_notifications_and_filtering(client, customer_user, customer_headers, db):
    # Create test notifications
    n1 = Notification(
        user_id=customer_user.id,
        title="Invoice Notice",
        message="Your invoice is ready",
        category="invoice",
        priority="normal",
        event_key="inv:test:1",
        is_read=False
    )
    n2 = Notification(
        user_id=customer_user.id,
        title="Subscription Notice",
        message="Your subscription is active",
        category="subscription",
        priority="high",
        event_key="sub:test:2",
        is_read=True
    )
    db.add_all([n1, n2])
    db.commit()

    # Get all notifications
    resp = client.get("/api/notifications", headers=customer_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    assert "items" in data

    # Filter by category
    resp_cat = client.get("/api/notifications?category=invoice", headers=customer_headers)
    assert resp_cat.status_code == 200
    for item in resp_cat.json()["items"]:
        assert item["category"] == "invoice"

    # Filter by is_read
    resp_read = client.get("/api/notifications?is_read=false", headers=customer_headers)
    assert resp_read.status_code == 200
    for item in resp_read.json()["items"]:
        assert item["is_read"] is False

    # Check unread count endpoint
    resp_count = client.get("/api/notifications/unread-count", headers=customer_headers)
    assert resp_count.status_code == 200
    assert resp_count.json()["unread_count"] >= 1


def test_mark_as_read_and_read_all(client, customer_user, customer_headers, db):
    notif = Notification(
        user_id=customer_user.id,
        title="Unread 1",
        message="Unread message",
        category="system",
        priority="normal",
        event_key="sys:test:unread1",
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Mark single as read
    patch_resp = client.patch(f"/api/notifications/{notif.id}/read", headers=customer_headers)
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_read"] is True
    assert patch_resp.json()["read_at"] is not None

    # Add another unread notification
    notif2 = Notification(
        user_id=customer_user.id,
        title="Unread 2",
        message="Unread message 2",
        category="payment",
        priority="normal",
        event_key="pay:test:unread2",
        is_read=False
    )
    db.add(notif2)
    db.commit()

    # Mark all as read
    all_resp = client.patch("/api/notifications/read-all", headers=customer_headers)
    assert all_resp.status_code == 200
    assert all_resp.json()["updated_count"] >= 1

    # Verify unread count is 0
    count_resp = client.get("/api/notifications/unread-count", headers=customer_headers)
    assert count_resp.json()["unread_count"] == 0


def test_delete_notification(client, customer_user, customer_headers, db):
    notif = Notification(
        user_id=customer_user.id,
        title="To Delete",
        message="Message to delete",
        category="system",
        priority="low",
        event_key="sys:test:delete",
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    del_resp = client.delete(f"/api/notifications/{notif.id}", headers=customer_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["detail"] == "Notification deleted successfully."

    # Deleting non-existent returns 404
    not_found_resp = client.delete(f"/api/notifications/999999", headers=customer_headers)
    assert not_found_resp.status_code == 404


def test_customer_isolation_and_security(client, customer_user, other_customer_user, customer_headers, other_customer_headers, db):
    # Notification belonging to customer_user
    notif = Notification(
        user_id=customer_user.id,
        title="Private Notification",
        message="Secret info for customer A",
        category="invoice",
        priority="normal",
        event_key="secret:a:1",
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Customer B attempts to read Customer A's notification -> 403 Forbidden
    read_resp = client.patch(f"/api/notifications/{notif.id}/read", headers=other_customer_headers)
    assert read_resp.status_code == 403

    # Customer B attempts to delete Customer A's notification -> 403 Forbidden
    del_resp = client.delete(f"/api/notifications/{notif.id}", headers=other_customer_headers)
    assert del_resp.status_code == 403

    # Customer B lists notifications -> Customer A's notification must not appear
    list_resp = client.get("/api/notifications", headers=other_customer_headers)
    assert list_resp.status_code == 200
    item_ids = [item["id"] for item in list_resp.json()["items"]]
    assert notif.id not in item_ids


def test_notification_preferences_management(client, customer_headers):
    # GET preferences
    get_resp = client.get("/api/notifications/preferences", headers=customer_headers)
    assert get_resp.status_code == 200
    prefs = get_resp.json()["preferences"]
    categories = [p["category"] for p in prefs]
    assert "invoice" in categories
    assert "account" in categories

    # PUT preferences: disable invoice and attempt to disable account (security)
    put_resp = client.put("/api/notifications/preferences", headers=customer_headers, json={
        "preferences": [
            {"category": "invoice", "enabled": False},
            {"category": "account", "enabled": False}  # Should be forced to True
        ]
    })
    assert put_resp.status_code == 200
    updated_prefs = {p["category"]: p["enabled"] for p in put_resp.json()["preferences"]}
    assert updated_prefs["invoice"] is False
    assert updated_prefs["account"] is True  # Essential category must remain enabled!


def test_scheduled_run_admin_only_protection(client, admin_headers, staff_headers, customer_headers):
    # Customer cannot call scheduled run -> 403
    cust_resp = client.post("/api/notifications/run-scheduled", headers=customer_headers, json={})
    assert cust_resp.status_code == 403

    # Staff cannot call scheduled run -> 403
    staff_resp = client.post("/api/notifications/run-scheduled", headers=staff_headers, json={})
    assert staff_resp.status_code == 403

    # Admin can call scheduled run -> 200
    admin_resp = client.post("/api/notifications/run-scheduled", headers=admin_headers, json={})
    assert admin_resp.status_code == 200
    assert "notifications_created" in admin_resp.json()


def test_scheduled_invoice_reminders(client, admin_headers, customer_user, db):
    today = date.today()

    plan = Plan(
        name="Invoice Test Plan",
        price=100000,
        period="monthly",
        min_qty=1,
        renewable=True,
        pausable=True,
        closable=True,
        auto_close=False,
        valid_from=today - timedelta(days=60)
    )
    db.add(plan)
    db.flush()

    sub = Subscription(
        number="SUB-INV-TEST",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=today - timedelta(days=60),
        expiry_date=today + timedelta(days=300),
        payment_terms="due_on_receipt",
        status="active",
        next_billing_date=today,
        is_paused=False
    )
    db.add(sub)
    db.flush()

    # 1. Invoice due in 3 days
    inv_due_soon = Invoice(
        number="INV-DUE-3D",
        subscription_id=sub.id,
        customer_id=customer_user.id,
        period_start=today - timedelta(days=27),
        period_end=today + timedelta(days=3),
        issue_date=today - timedelta(days=27),
        due_date=today + timedelta(days=3),  # Exactly 3 days away
        status="confirmed",
        subtotal=100000,
        discount_total=0,
        tax_total=0,
        total=100000,
        paid_total=0
    )

    # 2. Invoice 7 days overdue
    inv_overdue = Invoice(
        number="INV-OVERDUE-7D",
        subscription_id=sub.id,
        customer_id=customer_user.id,
        period_start=today - timedelta(days=57),
        period_end=today - timedelta(days=27),
        issue_date=today - timedelta(days=57),
        due_date=today - timedelta(days=7),  # 7 days overdue
        status="confirmed",
        subtotal=200000,
        discount_total=0,
        tax_total=0,
        total=200000,
        paid_total=0
    )

    # 3. Fully paid invoice (should be excluded)
    inv_paid = Invoice(
        number="INV-PAID-EXCL",
        subscription_id=sub.id,
        customer_id=customer_user.id,
        period_start=today - timedelta(days=87),
        period_end=today - timedelta(days=57),
        issue_date=today - timedelta(days=87),
        due_date=today - timedelta(days=7),
        status="paid",
        subtotal=150000,
        discount_total=0,
        tax_total=0,
        total=150000,
        paid_total=150000
    )

    # 4. Cancelled invoice (should be excluded)
    inv_cancelled = Invoice(
        number="INV-CANC-EXCL",
        subscription_id=sub.id,
        customer_id=customer_user.id,
        period_start=today - timedelta(days=117),
        period_end=today - timedelta(days=87),
        issue_date=today - timedelta(days=117),
        due_date=today - timedelta(days=7),
        status="cancelled",
        subtotal=150000,
        discount_total=0,
        tax_total=0,
        total=150000,
        paid_total=0
    )

    db.add_all([inv_due_soon, inv_overdue, inv_paid, inv_cancelled])
    db.commit()

    # Run scheduled check
    resp = client.post("/api/notifications/run-scheduled", headers=admin_headers, json={
        "as_of_date": str(today)
    })
    assert resp.status_code == 200

    # Verify due soon notification created for customer
    notif_due = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"invoice:{inv_due_soon.id}:due_soon:3d"
    ).first()
    assert notif_due is not None
    assert "Due Soon" in notif_due.title

    # Verify overdue notification created for customer and admin
    notif_overdue = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"invoice:{inv_overdue.id}:overdue:7d"
    ).first()
    assert notif_overdue is not None
    assert notif_overdue.priority == "high"

    # Verify paid and cancelled invoices generated NO notifications
    notif_paid = db.query(Notification).filter(
        Notification.event_key.like(f"invoice:{inv_paid.id}:%")
    ).first()
    assert notif_paid is None

    notif_canc = db.query(Notification).filter(
        Notification.event_key.like(f"invoice:{inv_cancelled.id}:%")
    ).first()
    assert notif_canc is None


def test_scheduled_subscription_and_quotation_reminders(client, admin_headers, customer_user, db):
    today = date.today()

    plan = Plan(
        name="Reminder Test Plan",
        price=100000,
        period="monthly",
        min_qty=1,
        renewable=True,
        pausable=True,
        closable=True,
        auto_close=False,
        valid_from=today - timedelta(days=60)
    )
    db.add(plan)
    db.flush()

    # Active subscription expiring in 7 days
    sub_exp = Subscription(
        number="SUB-EXP-7D",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=today - timedelta(days=23),
        expiry_date=today + timedelta(days=7),  # 7 days away
        payment_terms="due_on_receipt",
        status="active",
        next_billing_date=today + timedelta(days=7),
        is_paused=False
    )

    # Quotation expiring in 1 day
    quote_exp = Subscription(
        number="QUOTE-EXP-1D",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=today - timedelta(days=13),
        expiry_date=today + timedelta(days=1),  # 1 day away
        payment_terms="due_on_receipt",
        status="quotation",
        next_billing_date=today + timedelta(days=1),
        is_paused=False
    )

    # Quotation already expired
    quote_expired = Subscription(
        number="QUOTE-EXPIRED",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=today - timedelta(days=30),
        expiry_date=today - timedelta(days=2),  # Expired 2 days ago
        payment_terms="due_on_receipt",
        status="quotation",
        next_billing_date=today,
        is_paused=False
    )

    db.add_all([sub_exp, quote_exp, quote_expired])
    db.commit()

    # Run scheduled check
    resp = client.post("/api/notifications/run-scheduled", headers=admin_headers, json={
        "as_of_date": str(today)
    })
    assert resp.status_code == 200

    # Subscription expiring notification
    sub_notif = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"subscription:{sub_exp.id}:expiring:7d"
    ).first()
    assert sub_notif is not None
    assert sub_notif.category == "subscription"

    # Quotation expiring notification
    quote_notif = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"quotation:{quote_exp.id}:expiring:1d"
    ).first()
    assert quote_notif is not None
    assert quote_notif.category == "quotation"

    # Quotation expired notification
    expired_notif = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"quotation:{quote_expired.id}:expired"
    ).first()
    assert expired_notif is not None
    assert "Expired" in expired_notif.title


def test_scheduled_run_idempotence(client, admin_headers):
    today = str(date.today())

    # First run
    resp1 = client.post("/api/notifications/run-scheduled", headers=admin_headers, json={
        "as_of_date": today
    })
    assert resp1.status_code == 200

    # Second run on the same date must create 0 new notifications due to deduplication
    resp2 = client.post("/api/notifications/run-scheduled", headers=admin_headers, json={
        "as_of_date": today
    })
    assert resp2.status_code == 200
    assert resp2.json()["notifications_created"] == 0


def test_subscription_lifecycle_notifications(client, admin_headers, customer_user, db):
    today = date.today()
    plan = Plan(
        name="Lifecycle Plan",
        price=50000,
        period="monthly",
        min_qty=1,
        renewable=True,
        pausable=True,
        closable=True,
        auto_close=False,
        valid_from=today - timedelta(days=10)
    )
    product = Product(name="Lifecycle Product", sales_price=50000, cost_price=30000, is_active=True)
    db.add_all([plan, product])
    db.flush()

    # 1. Create subscription with status=draft
    from app.services.subscription_service import SubscriptionService
    from app.schemas.subscription import SubscriptionCreate, SubscriptionLineCreate

    sub = SubscriptionService.create_subscription(
        db=db,
        data=SubscriptionCreate(
            customer_id=customer_user.id,
            plan_id=plan.id,
            start_date=today,
            payment_terms="due_on_receipt",
            lines=[SubscriptionLineCreate(product_id=product.id, quantity=1)]
        )
    )
    assert sub.status == "draft"

    # 2. Transition draft -> quotation
    sub = SubscriptionService.transition_status(db, sub.id, "quotation")
    c_quote = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"subscription:{sub.id}:quotation_transition"
    ).first()
    assert c_quote is not None
    assert c_quote.category == "quotation"

    # 3. Transition quotation -> confirmed
    sub = SubscriptionService.transition_status(db, sub.id, "confirmed")
    c_conf = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"subscription:{sub.id}:confirmed"
    ).first()
    assert c_conf is not None
    assert c_conf.category == "subscription"

    # 4. Transition confirmed -> active
    sub = SubscriptionService.transition_status(db, sub.id, "active")
    c_act = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"subscription:{sub.id}:activated"
    ).first()
    assert c_act is not None
    assert c_act.category == "subscription"

    # 5. Pause subscription
    sub = SubscriptionService.pause_subscription(db, sub.id)
    c_pause = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key.like(f"subscription:{sub.id}:paused:%")
    ).first()
    assert c_pause is not None

    # 6. Close subscription
    sub = SubscriptionService.close_subscription(db, sub.id)
    c_close = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.event_key == f"subscription:{sub.id}:closed"
    ).first()
    assert c_close is not None


def test_payment_and_invoice_notifications(client, admin_headers, customer_user, db):
    today = date.today()
    plan = Plan(
        name="Pay Plan",
        price=100000,
        period="monthly",
        min_qty=1,
        renewable=True,
        pausable=True,
        closable=True,
        auto_close=False,
        valid_from=today - timedelta(days=10)
    )
    db.add(plan)
    db.flush()

    sub = Subscription(
        number="SUB-PAY-NOTIF",
        customer_id=customer_user.id,
        plan_id=plan.id,
        start_date=today,
        payment_terms="due_on_receipt",
        status="active",
        next_billing_date=today,
        is_paused=False
    )
    db.add(sub)
    db.flush()

    inv = Invoice(
        number="INV-PAY-NOTIF",
        subscription_id=sub.id,
        customer_id=customer_user.id,
        period_start=today,
        period_end=today + timedelta(days=30),
        issue_date=today,
        due_date=today,
        status="confirmed",
        subtotal=100000,
        discount_total=0,
        tax_total=0,
        total=100000,
        paid_total=0
    )
    db.add(inv)
    db.commit()

    # Record partial payment (40000 paise)
    from app.services.payment_service import PaymentService
    from app.schemas.payment import PaymentCreate

    PaymentService.record_payment(
        db=db,
        invoice_id=inv.id,
        data=PaymentCreate(amount=40000, method="card", paid_on=today)
    )

    # Verify partial payment notification
    c_part = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.category == "payment",
        Notification.title == "Partial Payment Received"
    ).first()
    assert c_part is not None

    # Record remaining payment (60000 paise) -> fully paid
    PaymentService.record_payment(
        db=db,
        invoice_id=inv.id,
        data=PaymentCreate(amount=60000, method="upi", paid_on=today)
    )

    c_full = db.query(Notification).filter(
        Notification.user_id == customer_user.id,
        Notification.category == "payment",
        Notification.title == "Invoice Fully Paid"
    ).first()
    assert c_full is not None


def test_disabled_preference_prevents_notification(client, customer_user, customer_headers, db):
    # Disable "payment" category for customer
    put_resp = client.put("/api/notifications/preferences", headers=customer_headers, json={
        "preferences": [
            {"category": "payment", "enabled": False}
        ]
    })
    assert put_resp.status_code == 200

    # Try to notify customer with category="payment"
    from app.services.notification_service import NotificationService
    res = NotificationService.notify_user(
        db=db,
        user_id=customer_user.id,
        title="Should Not Receive",
        message="This should be blocked by preferences",
        category="payment",
        event_key="pay:pref:blocked"
    )
    assert res is None  # Blocked!

    # Essential category "account" CANNOT be blocked
    res_account = NotificationService.notify_user(
        db=db,
        user_id=customer_user.id,
        title="Security Alert",
        message="Critical security event",
        category="account",
        event_key="acc:pref:allowed"
    )
    assert res_account is not None  # Allowed!

