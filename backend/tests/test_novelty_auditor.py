"""Unit and API tests for N2: Billing Integrity Auditor."""


def test_trigger_audit_run(client):
    """Test running an integrity audit scan."""
    response = client.post("/api/novelties/integrity-auditor/run")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "findings" in data
    assert data["total_findings"] >= 0
    run_id = data["id"]

    # Retrieve specific run
    detail_resp = client.get(f"/api/novelties/integrity-auditor/runs/{run_id}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["id"] == run_id

    # List runs
    list_resp = client.get("/api/novelties/integrity-auditor/runs")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
