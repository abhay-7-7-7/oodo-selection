"""Unit and API tests for N3: Split-Payment Bank Matcher."""
import io


def test_bank_matcher_csv_upload_and_match(client):
    """Test CSV statement upload and match proposal generation."""
    csv_content = (
        "date,description,reference,payer,amount\n"
        "2026-10-15,NEFT Payment from TechCorp,NEFT-INV-2026-0105,TechCorp India,236.00\n"
        "2026-10-18,Bulk client settlement,CHQ-34521,Ravi Patel,450.00\n"
    )
    response = client.post(
        "/api/novelties/bank-matcher/upload-csv",
        files={"file": ("statement.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["uploaded"] == 2
    assert len(data["proposals"]) == 2

    # Check transactions endpoint
    tx_resp = client.get("/api/novelties/bank-matcher/transactions")
    assert tx_resp.status_code == 200
    tx_data = tx_resp.json()
    assert tx_data["total"] >= 2

    # Approve match
    tx_id = data["proposals"][0]["transaction_id"]
    approve_resp = client.post(
        "/api/novelties/bank-matcher/reconcile",
        json={"matches": [{"transaction_id": tx_id, "invoice_ids": ["inv-001"], "amount_paise": 23600, "confidence": 1.0, "match_type": "exact"}]}
    )
    assert approve_resp.status_code == 200
    reconciled = approve_resp.json()
    assert len(reconciled) == 1
    assert reconciled[0]["transaction_id"] == tx_id

    # Check history
    hist_resp = client.get("/api/novelties/bank-matcher/history")
    assert hist_resp.status_code == 200
    assert hist_resp.json()["total"] >= 1
