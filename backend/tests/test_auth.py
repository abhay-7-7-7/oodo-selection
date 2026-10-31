from datetime import datetime, timedelta, timezone
from app.models.user import User, PasswordResetToken
from app.models.outbox import Outbox
from app.core.security import hash_token


def test_valid_signup_succeeds(client):
    res = client.post("/api/auth/signup", json={
        "name": "Arjun Sharma",
        "email": "arjun@example.com",
        "password": "Brightloop@2026"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "arjun@example.com"
    assert data["role"] == "customer"
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_email_rejected(client):
    client.post("/api/auth/signup", json={
        "name": "First User",
        "email": "duplicate@example.com",
        "password": "Brightloop@2026"
    })
    res = client.post("/api/auth/signup", json={
        "name": "Second User",
        "email": "duplicate@example.com",
        "password": "Brightloop@2026"
    })
    assert res.status_code == 409


def test_duplicate_email_different_capitalization_rejected(client):
    client.post("/api/auth/signup", json={
        "name": "Case User",
        "email": "caseuser@example.com",
        "password": "Brightloop@2026"
    })
    res = client.post("/api/auth/signup", json={
        "name": "Case User Upper",
        "email": "CaseUser@EXAMPLE.COM",
        "password": "Brightloop@2026"
    })
    assert res.status_code == 409


def test_weak_passwords_rejected(client):
    # Too short (<9 chars)
    res = client.post("/api/auth/signup", json={"name": "Weak", "email": "w1@example.com", "password": "Pass@1"})
    assert res.status_code == 422

    # No uppercase
    res = client.post("/api/auth/signup", json={"name": "Weak", "email": "w2@example.com", "password": "password@123"})
    assert res.status_code == 422

    # No lowercase
    res = client.post("/api/auth/signup", json={"name": "Weak", "email": "w3@example.com", "password": "PASSWORD@123"})
    assert res.status_code == 422

    # No special character
    res = client.post("/api/auth/signup", json={"name": "Weak", "email": "w4@example.com", "password": "Password123"})
    assert res.status_code == 422


def test_valid_login_returns_jwt(client):
    client.post("/api/auth/signup", json={
        "name": "Login User",
        "email": "loginuser@example.com",
        "password": "Brightloop@2026"
    })
    res = client.post("/api/auth/login", json={
        "email": "loginuser@example.com",
        "password": "Brightloop@2026"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "customer"
    assert data["name"] == "Login User"


def test_invalid_credentials_return_401(client):
    res = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "WrongPassword@2026"
    })
    assert res.status_code == 401


def test_forgot_password_and_reset_token_expiration(client, db):
    client.post("/api/auth/signup", json={
        "name": "Reset User",
        "email": "resetuser@example.com",
        "password": "Brightloop@2026"
    })
    res = client.post("/api/auth/forgot-password", json={"email": "resetuser@example.com"})
    assert res.status_code == 200

    outbox_item = db.query(Outbox).filter(Outbox.to_email == "resetuser@example.com").first()
    assert outbox_item is not None
    assert "token=" in outbox_item.body

    raw_token = outbox_item.body.split("token=")[-1]

    # Test expired token
    user = db.query(User).filter(User.email == "resetuser@example.com").first()
    t_hash = hash_token(raw_token)
    token_record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == t_hash).first()
    token_record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()

    res_expired = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewPassword@2026"
    })
    assert res_expired.status_code == 400


def test_reset_token_cannot_be_reused(client, db):
    client.post("/api/auth/signup", json={
        "name": "Reuse User",
        "email": "reuse@example.com",
        "password": "Brightloop@2026"
    })
    client.post("/api/auth/forgot-password", json={"email": "reuse@example.com"})
    outbox_item = db.query(Outbox).filter(Outbox.to_email == "reuse@example.com").order_by(Outbox.id.desc()).first()
    raw_token = outbox_item.body.split("token=")[-1]

    # First reset succeeds
    res1 = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "NewPassword@2026"
    })
    assert res1.status_code == 200

    # Second reset with same token must fail
    res2 = client.post("/api/auth/reset-password", json={
        "token": raw_token,
        "new_password": "AnotherPassword@2026"
    })
    assert res2.status_code == 400
