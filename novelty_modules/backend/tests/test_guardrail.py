"""Unit and API tests for N1: Profit-Aware Discount Guardrail."""


def test_discount_guardrail_safe(client):
    """Test a safe discount that maintains > 15% margin."""
    payload = {
        "sales_price_paise": 100000,  # ₹1000
        "cost_price_paise": 60000,    # ₹600 (COGS)
        "discount_kind": "percent",
        "discount_value": 10.0,       # 10% off -> ₹900 final price -> ₹300 profit -> 33.3% margin
        "quantity": 1,
        "requester_role": "staff"
    }
    response = client.post("/api/novelties/discount-guardrail/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["guardrail_breached"] is False
    assert data["requires_override"] is False
    assert data["override_level"] == "none"
    assert data["margin_percent"] > 15.0


def test_discount_guardrail_breached_and_override(client):
    """Test a discount that breaches minimum margin and submit an override."""
    payload = {
        "sales_price_paise": 100000,  # ₹1000
        "cost_price_paise": 80000,    # ₹800 (COGS)
        "discount_kind": "percent",
        "discount_value": 15.0,       # 15% off -> ₹850 final price -> ₹50 profit -> 5.88% margin (<15%)
        "quantity": 1,
        "requester_role": "staff"
    }
    response = client.post("/api/novelties/discount-guardrail/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["guardrail_breached"] is True
    assert data["requires_override"] is True
    assert data["override_level"] in ("manager", "director")
    simulation_id = data["simulation_id"]

    # Submit override
    override_payload = {
        "simulation_id": simulation_id,
        "justification": "Strategic deal to acquire large enterprise account with high expansion potential.",
        "requested_by_user_id": 1
    }
    override_resp = client.post("/api/novelties/discount-guardrail/override", json=override_payload)
    assert override_resp.status_code == 200
    override_data = override_resp.json()
    assert override_data["approved"] is True

    # Check audit log
    audit_resp = client.get("/api/novelties/discount-guardrail/audit-log")
    assert audit_resp.status_code == 200
    audit_data = audit_resp.json()
    assert audit_data["total"] >= 1
    matching = [x for x in audit_data["items"] if x["simulation_id"] == simulation_id]
    assert len(matching) == 1
    assert matching[0]["override_approved"] is True
