# Brightloop — Novelty Modules API Contract

All novelty endpoints are prefixed with `/api/novelties/` and operate completely independently from the main Brightloop endpoints.

---

## N1: Profit-Aware Discount Guardrail (`/api/novelties/discount-guardrail`)

### 1. Simulate Discount
- **Method / Path:** `POST /api/novelties/discount-guardrail/simulate`
- **Description:** Computes unit economics, COGS profit margin, and evaluates against minimum margin threshold (default 15.0%).
- **Request Body:**
  ```json
  {
    "sales_price_paise": 100000,
    "cost_price_paise": 65000,
    "discount_kind": "percent",
    "discount_value": 15.0,
    "quantity": 1,
    "requester_role": "staff",
    "product_id": "prod-optional"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "simulation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "original_price_paise": 100000,
    "discount_amount_paise": 15000,
    "final_price_paise": 85000,
    "cost_price_paise": 65000,
    "profit_paise": 20000,
    "margin_percent": 23.53,
    "min_margin_percent": 15.0,
    "guardrail_breached": false,
    "requires_override": false,
    "override_level": "none",
    "warning_message": null
  }
  ```

### 2. Request / Approve Override
- **Method / Path:** `POST /api/novelties/discount-guardrail/override`
- **Request Body:**
  ```json
  {
    "simulation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "justification": "Strategic deal acquisition with 2-year expansion commit.",
    "requested_by_user_id": 1
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "simulation_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "override_level": "manager",
    "approved": true,
    "message": "Override approved for simulation 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
  ```

### 3. List Audit Logs
- **Method / Path:** `GET /api/novelties/discount-guardrail/audit-log?skip=0&limit=50`
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "c7a8...",
        "simulation_id": "9b1deb4d...",
        "product_id": null,
        "original_price_paise": 100000,
        "final_price_paise": 85000,
        "margin_percent": 23.53,
        "guardrail_breached": false,
        "override_level": "none",
        "justification": null,
        "override_approved": null,
        "created_at": "2026-10-31T10:00:00Z"
      }
    ],
    "total": 1
  }
  ```

---

## N2: Billing Integrity Auditor (`/api/novelties/integrity-auditor`)

### 1. Trigger Audit Scan
- **Method / Path:** `POST /api/novelties/integrity-auditor/run`
- **Response (200 OK):**
  ```json
  {
    "id": "run-uuid",
    "started_at": "2026-10-31T10:00:00Z",
    "completed_at": "2026-10-31T10:00:02Z",
    "total_findings": 2,
    "critical": 1,
    "high": 1,
    "medium": 0,
    "low": 0,
    "info": 0,
    "findings": [
      {
        "id": "f-1",
        "category": "duplicate_invoice",
        "severity": "critical",
        "description": "Duplicate invoices for subscription sub-102 in period 2026-10-01–2026-10-31",
        "entity_type": "invoice",
        "entity_id": "sub-102",
        "detail": { "invoice_ids": "inv-101,inv-102", "count": 2 }
      }
    ]
  }
  ```

### 2. List Past Audit Runs
- **Method / Path:** `GET /api/novelties/integrity-auditor/runs?skip=0&limit=20`

### 3. Get Single Run Detail
- **Method / Path:** `GET /api/novelties/integrity-auditor/runs/{run_id}`

---

## N3: Split-Payment Bank Matcher (`/api/novelties/bank-matcher`)

### 1. Upload Statement CSV
- **Method / Path:** `POST /api/novelties/bank-matcher/upload-csv`
- **Form Data:** `file` (CSV file with headers `date,description,reference,payer,amount`) or Body `content`
- **Response (200 OK):**
  ```json
  {
    "uploaded": 2,
    "transactions": [...],
    "proposals": [
      {
        "transaction_id": "tx-1",
        "transaction_amount_paise": 45000,
        "transaction_description": "Bulk client settlement",
        "match_type": "subset_sum",
        "suggestions": [
          {
            "invoice_id": "inv-002",
            "invoice_number": "BL-2026-0102",
            "customer_name": "Ravi Patel",
            "invoice_amount_paise": 18000,
            "outstanding_paise": 18000,
            "confidence": 0.95,
            "match_reason": "Subset-sum match (N3)"
          },
          {
            "invoice_id": "inv-003",
            "invoice_number": "BL-2026-0103",
            "customer_name": "Ravi Patel",
            "invoice_amount_paise": 27000,
            "outstanding_paise": 27000,
            "confidence": 0.95,
            "match_reason": "Subset-sum match (N3)"
          }
        ]
      }
    ]
  }
  ```

### 2. List Bank Transactions
- **Method / Path:** `GET /api/novelties/bank-matcher/transactions?status=pending`

### 3. Reconcile Matches
- **Method / Path:** `POST /api/novelties/bank-matcher/reconcile`
- **Request Body:**
  ```json
  {
    "matches": [
      {
        "transaction_id": "tx-1",
        "invoice_ids": ["inv-002", "inv-003"],
        "amount_paise": 45000,
        "confidence": 0.95,
        "match_type": "subset_sum"
      }
    ]
  }
  ```

### 4. Reconciliation History
- **Method / Path:** `GET /api/novelties/bank-matcher/history`

---

## N4: Bill-Change Explainer (`/api/novelties/bill-explainer`)

### 1. Compare Invoices
- **Method / Path:** `POST /api/novelties/bill-explainer/explain` (or `GET /api/novelties/bill-explainer/explain?prev_invoice_id=...&curr_invoice_id=...`)
- **Request Body:**
  ```json
  {
    "prev_invoice_id": "inv-001",
    "curr_invoice_id": "inv-002"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "previous_invoice_id": "inv-001",
    "current_invoice_id": "inv-002",
    "previous_total_paise": 23600,
    "current_total_paise": 28320,
    "total_delta_paise": 4720,
    "changes": [
      {
        "field": "subtotal_paise",
        "label": "Subtotal",
        "previous": 20000,
        "current": 24000,
        "delta_paise": 4000,
        "explanation": "Subtotal increased by ₹40.00 (from ₹200.00 to ₹240.00). This could be due to quantity change, plan upgrade, or price revision."
      },
      {
        "field": "tax_amount_paise",
        "label": "Tax",
        "previous": 3600,
        "current": 4320,
        "delta_paise": 720,
        "explanation": "Tax amount changed by ₹7.20 because the taxable amount changed."
      }
    ],
    "human_summary": "Your bill increased by ₹47.20 (from ₹236.00 to ₹283.20). This is primarily due to: subtotal, tax."
  }
  ```

---

## N5: Renewal Radar (`/api/novelties/renewal-radar`)

### 1. List Subscriptions by Renewal Bucket
- **Method / Path:** `GET /api/novelties/renewal-radar/subscriptions?bucket=7d` (options: `7d`, `30d`, `60d`, `expired`)
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "subscription_id": "sub-001",
        "customer_name": "TechCorp India",
        "plan_name": "Professional",
        "expires_at": "2026-11-05",
        "days_until_expiry": 5,
        "bucket": "7d",
        "renewable": true,
        "has_open_renewal_quotation": false,
        "last_payment_date": "2026-10-01",
        "outstanding_paise": 0
      }
    ],
    "total": 1
  }
  ```

### 2. Create 1-Click Renewal Quotation Draft
- **Method / Path:** `POST /api/novelties/renewal-radar/quotation`
- **Request Body:**
  ```json
  {
    "subscription_id": "sub-001",
    "customer_id": "cust-001",
    "plan_id": "professional",
    "quantity": 1,
    "notes": "Annual renewal quotation"
  }
  ```

### 3. List Quotations
- **Method / Path:** `GET /api/novelties/renewal-radar/quotations`

---

## N6: Automatic Reminder Centre (`/api/novelties/reminder-centre`)

### 1. Get Cadence Settings
- **Method / Path:** `GET /api/novelties/reminder-centre/settings`

### 2. Update Cadence Settings
- **Method / Path:** `PUT /api/novelties/reminder-centre/settings`
- **Request Body:**
  ```json
  {
    "invoice_due_days_before": [7, 3, 1],
    "overdue_repeat_days": 3,
    "expiry_days_before": [30, 7],
    "enabled": true
  }
  ```

### 3. Trigger Dispatch Batch
- **Method / Path:** `POST /api/novelties/reminder-centre/run`
- **Response (200 OK):**
  ```json
  {
    "run_at": "2026-10-31T10:00:00Z",
    "sent": 5,
    "skipped": 2,
    "failed": 0,
    "details": [...]
  }
  ```

### 4. Upcoming Queue & History
- `GET /api/novelties/reminder-centre/upcoming`
- `GET /api/novelties/reminder-centre/history?skip=0&limit=50`
