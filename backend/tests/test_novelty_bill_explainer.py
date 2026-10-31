"""Unit and API tests for N4: Bill-Change Explainer."""


def test_bill_explainer_post(client):
    """Test invoice comparison via POST endpoint."""
    payload = {
        "prev_invoice_id": "inv-001",
        "curr_invoice_id": "inv-002"
    }
    response = client.post("/api/novelties/bill-explainer/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "human_summary" in data
    assert "changes" in data
    assert "total_delta_paise" in data
    assert isinstance(data["changes"], list)


def test_bill_explainer_get(client):
    """Test invoice comparison via GET endpoint."""
    response = client.get("/api/novelties/bill-explainer/explain?prev_invoice_id=inv-001&curr_invoice_id=inv-002")
    assert response.status_code == 200
    data = response.json()
    assert "human_summary" in data
    assert data["previous_invoice_id"] == "inv-001"
    assert data["current_invoice_id"] == "inv-002"
