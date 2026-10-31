"""Unit and API tests for N6: Automatic Reminder Centre."""


def test_reminder_settings_and_update(client):
    """Test retrieving and updating reminder cadence settings."""
    resp = client.get("/api/novelties/reminder-centre/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert data["enabled"] is True

    update_payload = {
        "invoice_due_days_before": [5, 2],
        "overdue_repeat_days": 4,
    }
    put_resp = client.put("/api/novelties/reminder-centre/settings", json=update_payload)
    assert put_resp.status_code == 200
    updated = put_resp.json()
    assert updated["invoice_due_days_before"] == [5, 2]
    assert updated["overdue_repeat_days"] == 4


def test_reminder_run_and_upcoming(client):
    """Test triggering an automated reminder dispatch run and querying upcoming queue."""
    run_resp = client.post("/api/novelties/reminder-centre/run")
    assert run_resp.status_code == 200
    data = run_resp.json()
    assert "sent" in data
    assert "skipped" in data
    assert "failed" in data

    upcoming_resp = client.get("/api/novelties/reminder-centre/upcoming")
    assert upcoming_resp.status_code == 200
    assert isinstance(upcoming_resp.json(), list)

    hist_resp = client.get("/api/novelties/reminder-centre/history")
    assert hist_resp.status_code == 200
    assert "items" in hist_resp.json()
