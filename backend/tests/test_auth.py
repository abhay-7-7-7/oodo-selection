import pytest


def test_valid_signup_succeeds(client):
    payload = {
        "name": "Rahul Menon",
        "email": "rahul@example.com",
        "password": "ValidPassword@2026"
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "rahul@example.com"
    assert data["role"] == "customer"
    assert data["name"] == "Rahul Menon"
    assert data["is_active"] is True
    assert "id" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_email_rejected(client):
    payload = {
        "name": "First User",
        "email": "duplicate@example.com",
        "password": "ValidPassword@2026"
    }
    resp1 = client.post("/api/auth/signup", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/auth/signup", json=payload)
    assert resp2.status_code == 409
    assert "already exists" in resp2.json()["detail"].lower()


def test_duplicate_email_different_capitalization_rejected(client):
    resp1 = client.post("/api/auth/signup", json={
        "name": "Case User",
        "email": "casesensitive@example.com",
        "password": "ValidPassword@2026"
    })
    assert resp1.status_code == 201

    resp2 = client.post("/api/auth/signup", json={
        "name": "Case User Caps",
        "email": "CaseSensitive@EXAMPLE.COM",
        "password": "ValidPassword@2026"
    })
    assert resp2.status_code == 409
    assert "already exists" in resp2.json()["detail"].lower()


@pytest.mark.parametrize("bad_password,reason", [
    ("Short1!", "too short (< 9 characters)"),
    ("alllowercase1!", "missing uppercase letter"),
    ("ALLUPPERCASE1!", "missing lowercase letter"),
    ("NoSpecialChar123", "missing special character"),
])
def test_weak_passwords_rejected(client, bad_password, reason):
    payload = {
        "name": "Weak Password User",
        "email": f"weak_{bad_password[:4]}@example.com",
        "password": bad_password
    }
    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 422, f"Expected 422 for password {reason}, got {response.status_code}"
