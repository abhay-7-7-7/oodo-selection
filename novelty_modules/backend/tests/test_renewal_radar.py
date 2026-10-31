"""Unit and API tests for N5: Renewal Radar."""


def test_renewal_radar_buckets(client):
    """Test retrieving expiring subscriptions bucketed by urgency."""
    response = client.get("/api/novelties/renewal-radar/subscriptions")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) > 0


def test_renewal_radar_quotation_creation(client):
    """Test 1-click quotation generation."""
    payload = {
        "subscription_id": "sub-001",
        "customer_id": "cust-001",
        "plan_id": "plan-pro",
        "quantity": 2,
        "notes": "Annual renewal discount applied"
    }
    response = client.post("/api/novelties/renewal-radar/quotation", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["subscription_id"] == "sub-001"
    assert data["status"] == "draft"

    # List quotations
    list_resp = client.get("/api/novelties/renewal-radar/quotations")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1
