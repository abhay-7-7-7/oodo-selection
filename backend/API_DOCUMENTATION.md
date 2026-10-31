# Brightloop Software — API Documentation

This document serves as the comprehensive contract between the **Brightloop Software Backend** and independently developed frontend applications (e.g., React + Vite).

---

## 1. General API Standards

- **Base URL:** `http://localhost:8000/api`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Interactive ReDoc:** `http://localhost:8000/redoc`
- **Content-Type:** `application/json`
- **Authentication Scheme:** `Authorization: Bearer <JWT_TOKEN>`
- **Monetary Unit:** **Integer Paise** (₹1 = 100 paise, ₹560 = 56,000 paise, ₹1,000 = 100,000 paise). The API strictly accepts and returns integer paise. Frontend displays format paise to Rupees (`paise / 100`).
- **Date Format:** ISO 8601 strings (`YYYY-MM-DD` for business dates, `YYYY-MM-DDTHH:MM:SSZ` for UTC timestamps).
- **Error Format:**
  ```json
  {
    "detail": "Human-readable error explanation."
  }
  ```

---

## 2. Role-Based Access Control Matrix

| User Role | Description | Allowed Endpoints |
|---|---|---|
| **admin** | Full system control | All endpoints (products, plans, taxes, discounts, staff creation, subscriptions, billing, invoices, payments, reports, outbox) |
| **staff** | Internal operational staff | Subscriptions, billing, invoices, payments, reports, outbox, read-only catalog, customer picker |
| **customer** | External subscribing customer | Own portal subscriptions (`/api/portal/subscriptions`), own portal invoices (`/api/portal/invoices`), read-only plans, own invoice detail / print |

---

## 3. All 42 Core API Endpoints

### Category A: Authentication & Accounts

#### 1. Customer Registration
- **Endpoint:** `POST /api/auth/signup`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Rahul Menon",
    "email": "rahul@example.com",
    "password": "Brightloop@2026"
  }
  ```
- **Validation Rules:**
  - `email`: Normalized to lowercase; must be unique (case-insensitive).
  - `password`: Minimum 9 characters, at least 1 uppercase, at least 1 lowercase, at least 1 special character.
- **Success (201):**
  ```json
  {
    "id": 12,
    "name": "Rahul Menon",
    "email": "rahul@example.com",
    "role": "customer",
    "is_active": true,
    "created_at": "2026-10-31T10:30:00Z"
  }
  ```
- **Errors:** 409 (Email already registered), 422 (Weak password / validation failure).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"name":"Rahul Menon","email":"rahul@example.com","password":"Brightloop@2026"}'
  ```

#### 2. User Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "rahul@example.com",
    "password": "Brightloop@2026"
  }
  ```
- **Success (200):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "customer",
    "name": "Rahul Menon"
  }
  ```
- **Errors:** 401 (Invalid email or password / disabled account).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@example.com","password":"Brightloop@2026"}'
  ```

#### 3. Forgot Password
- **Endpoint:** `POST /api/auth/forgot-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "rahul@example.com"
  }
  ```
- **Success (200):** Always returns generic success without leaking account existence.
  ```json
  {
    "detail": "If the account exists, a password reset link has been sent."
  }
  ```
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"rahul@example.com"}'
  ```

#### 4. Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "token": "RAW_RESET_TOKEN_FROM_EMAIL_OR_OUTBOX",
    "new_password": "NewPassword@2026"
  }
  ```
- **Success (200):**
  ```json
  {
    "detail": "Password has been successfully reset."
  }
  ```
- **Errors:** 400 (Token invalid, expired or already used), 422 (Password requirements not met).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/auth/reset-password \
    -H "Content-Type: application/json" \
    -d '{"token":"RAW_TOKEN","new_password":"NewPassword@2026"}'
  ```

#### 5. Current User Info
- **Endpoint:** `GET /api/auth/me`
- **Access:** Any authenticated user
- **Headers:** `Authorization: Bearer <TOKEN>`
- **Success (200):**
  ```json
  {
    "id": 12,
    "name": "Rahul Menon",
    "email": "rahul@example.com",
    "role": "customer",
    "is_active": true,
    "created_at": "2026-10-31T10:30:00Z"
  }
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/auth/me \
    -H "Authorization: Bearer <TOKEN>"
  ```

#### 6. Create Staff Account
- **Endpoint:** `POST /api/staff`
- **Access:** Admin only
- **Request Body:**
  ```json
  {
    "name": "Anjali Staff",
    "email": "anjali@brightloop.com",
    "password": "StaffPassword@2026"
  }
  ```
- **Success (201):** User object with `role: "staff"`.
- **Errors:** 403 (Caller is not admin), 409 (Email exists), 422 (Weak password).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/staff \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Anjali Staff","email":"anjali@brightloop.com","password":"StaffPassword@2026"}'
  ```

#### 7. Outbox (Simulated Email Dispatch)
- **Endpoint:** `GET /api/outbox`
- **Access:** Admin, Staff
- **Query Parameters:** `page=1`, `page_size=20`
- **Success (200):**
  ```json
  {
    "items": [
      {
        "id": 1,
        "to": "rahul@example.com",
        "subject": "Reset your Brightloop password",
        "body": "Click this link to reset your password: http://localhost:8000/reset-password?token=...",
        "kind": "password_reset",
        "related_id": 12,
        "created_at": "2026-10-31T10:35:00Z"
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 1
  }
  ```
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/outbox?page=1&page_size=20" \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

---

### Category B: Catalog Management

#### 8. List Products
- **Endpoint:** `GET /api/products`
- **Access:** Admin, Staff
- **Query Parameters:** `q` (search name/notes), `page=1`, `page_size=20`
- **Success (200):**
  ```json
  {
    "items": [
      {
        "id": 1,
        "name": "Cloud Business Suite",
        "type": "software",
        "sales_price": 100000,
        "cost_price": 60000,
        "notes": "Enterprise ERP Suite",
        "is_active": true,
        "created_at": "2026-10-31T10:00:00Z",
        "updated_at": "2026-10-31T10:00:00Z",
        "variants": [
          {
            "id": 1,
            "product_id": 1,
            "attribute": "brand",
            "value": "Odoo",
            "price_extra": 56000
          }
        ]
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 1
  }
  ```
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/products" \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 9. Create Product
- **Endpoint:** `POST /api/products`
- **Access:** Admin only
- **Request Body:**
  ```json
  {
    "name": "Cloud Business Suite",
    "type": "software",
    "sales_price": 100000,
    "cost_price": 60000,
    "notes": "Enterprise ERP Suite"
  }
  ```
- **Success (201):** Product object with assigned `id`.
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/products \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Cloud Business Suite","type":"software","sales_price":100000,"cost_price":60000}'
  ```

#### 10. Update Product
- **Endpoint:** `PUT /api/products/{id}`
- **Access:** Admin only
- **Request Body:** Partial or complete product fields.
- **Success (200):** Updated product object.
- **Errors:** 404 (Product not found).
- **Curl:**
  ```bash
  curl -X PUT http://localhost:8000/api/products/1 \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"sales_price":110000}'
  ```

#### 11. Create Product Variant
- **Endpoint:** `POST /api/products/{id}/variants`
- **Access:** Admin only
- **Request Body:**
  ```json
  {
    "attribute": "brand",
    "value": "Odoo",
    "price_extra": 56000
  }
  ```
- **Success (201):**
  ```json
  {
    "id": 1,
    "product_id": 1,
    "attribute": "brand",
    "value": "Odoo",
    "price_extra": 56000
  }
  ```
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/products/1/variants \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"attribute":"brand","value":"Odoo","price_extra":56000}'
  ```

#### 12. List Plans
- **Endpoint:** `GET /api/plans`
- **Access:** Admin, Staff, Customer
- **Query Parameters:** `active_only=true` (or false)
- **Success (200):**
  ```json
  [
    {
      "id": 1,
      "name": "Business Monthly",
      "price": 200000,
      "period": "monthly",
      "min_qty": 2,
      "valid_from": "2026-10-01",
      "valid_to": "2027-03-31",
      "auto_close": true,
      "closable": true,
      "pausable": true,
      "renewable": true,
      "is_active": true,
      "created_at": "2026-10-31T10:00:00Z"
    }
  ]
  ```
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/plans?active_only=true" \
    -H "Authorization: Bearer <TOKEN>"
  ```

#### 13. Create Plan
- **Endpoint:** `POST /api/plans`
- **Access:** Admin only
- **Request Body:**
  ```json
  {
    "name": "Business Monthly",
    "price": 200000,
    "period": "monthly",
    "min_qty": 2,
    "valid_from": "2026-10-01",
    "valid_to": "2027-03-31",
    "auto_close": true,
    "closable": true,
    "pausable": true,
    "renewable": true
  }
  ```
- **Validation Rules:** `period` must be `daily`, `weekly`, `monthly`, or `yearly`. `valid_to >= valid_from`.
- **Success (201):** Created plan object.
- **Errors:** 422 (Validation failure).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/plans \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Business Monthly","price":200000,"period":"monthly","min_qty":2,"valid_from":"2026-10-01","valid_to":"2027-03-31","auto_close":true,"closable":true,"pausable":true,"renewable":true}'
  ```

#### 14. Update Plan
- **Endpoint:** `PUT /api/plans/{id}`
- **Access:** Admin only
- **Request Body:** Partial or complete plan configuration fields.
- **Success (200):** Updated plan object.
- **Curl:**
  ```bash
  curl -X PUT http://localhost:8000/api/plans/1 \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"price":220000}'
  ```

#### 15. List Taxes
- **Endpoint:** `GET /api/taxes`
- **Access:** Admin, Staff
- **Success (200):**
  ```json
  [
    {
      "id": 1,
      "name": "GST 18%",
      "rate_percent": "18.00",
      "applies_to": "all",
      "is_active": true,
      "created_at": "2026-10-31T10:00:00Z"
    }
  ]
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/taxes \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 16. Create Tax
- **Endpoint:** `POST /api/taxes`
- **Access:** Admin only
- **Request Body:**
  ```json
  {
    "name": "GST 18%",
    "rate_percent": "18.00",
    "applies_to": "all"
  }
  ```
- **Validation Rules:** `rate_percent` between 0.00 and 100.00.
- **Success (201):** Created tax object.
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/taxes \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"GST 18%","rate_percent":"18.00","applies_to":"all"}'
  ```

#### 17. List Discounts
- **Endpoint:** `GET /api/discounts`
- **Access:** Admin, Staff
- **Success (200):** List of discount rules with live calculated `remaining_usage` and `is_expired`.
  ```json
  [
    {
      "id": 1,
      "name": "SUMMER10",
      "kind": "percent",
      "value": 10,
      "min_amount": 200000,
      "min_qty": 2,
      "start_date": "2026-10-01",
      "end_date": "2026-11-30",
      "usage_limit": 10,
      "times_used": 1,
      "remaining_usage": 9,
      "scope": "subscription",
      "product_id": null,
      "is_active": true,
      "is_expired": false,
      "created_at": "2026-10-31T10:00:00Z"
    }
  ]
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/discounts \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 18. Create Discount
- **Endpoint:** `POST /api/discounts`
- **Access:** Admin only
- **Request Body (Percentage Example):**
  ```json
  {
    "name": "SUMMER10",
    "kind": "percent",
    "value": 10,
    "min_amount": 200000,
    "min_qty": 2,
    "start_date": "2026-10-01",
    "end_date": "2026-11-30",
    "usage_limit": 10,
    "scope": "subscription",
    "product_id": null
  }
  ```
- **Validation Rules:** `kind` in `fixed` or `percent`. If `percent`, `value <= 100`. `end_date >= start_date`.
- **Success (201):** Created discount object.
- **Errors:** 403 (Caller is staff), 422 (Validation failure).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/discounts \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"SUMMER10","kind":"percent","value":10,"min_amount":200000,"min_qty":2,"start_date":"2026-10-01","end_date":"2026-11-30","usage_limit":10,"scope":"subscription"}'
  ```

---

### Category C: Quotation Templates & Subscriptions

#### 19. List Quotation Templates
- **Endpoint:** `GET /api/quotation-templates`
- **Access:** Admin, Staff
- **Success (200):**
  ```json
  [
    {
      "id": 1,
      "name": "Enterprise Starter Template",
      "plan_id": 1,
      "plan_name": "Business Monthly",
      "validity_days": 15,
      "created_by": 1,
      "created_at": "2026-10-31T10:00:00Z",
      "lines": [
        {
          "id": 1,
          "template_id": 1,
          "product_id": 1,
          "variant_id": 1,
          "quantity": 2,
          "unit_price_override": null,
          "product_name": "Cloud Business Suite",
          "variant_value": "Odoo"
        }
      ]
    }
  ]
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/quotation-templates \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 20. Create Quotation Template
- **Endpoint:** `POST /api/quotation-templates`
- **Access:** Admin, Staff
- **Request Body:**
  ```json
  {
    "name": "Enterprise Starter Template",
    "plan_id": 1,
    "validity_days": 15,
    "lines": [
      {
        "product_id": 1,
        "variant_id": 1,
        "quantity": 2
      }
    ]
  }
  ```
- **Success (201):** Created template with lines.
- **Errors:** 422 (Variant does not belong to selected product).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/quotation-templates \
    -H "Authorization: Bearer <STAFF_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Enterprise Starter","plan_id":1,"validity_days":15,"lines":[{"product_id":1,"variant_id":1,"quantity":2}]}'
  ```

#### 21. Create Subscription
- **Endpoint:** `POST /api/subscriptions`
- **Access:** Admin, Staff
- **Request Body (Template-based):**
  ```json
  {
    "customer_id": 12,
    "plan_id": 1,
    "template_id": 1,
    "start_date": "2026-11-01",
    "payment_terms": "net_15"
  }
  ```
- **Request Body (Manual lines):**
  ```json
  {
    "customer_id": 12,
    "plan_id": 1,
    "start_date": "2026-11-01",
    "payment_terms": "net_30",
    "lines": [
      {
        "product_id": 1,
        "variant_id": 1,
        "quantity": 2,
        "tax_id": 1
      }
    ]
  }
  ```
- **Validation Rules:**
  - Verifies customer exists and role is `customer`.
  - Verifies plan exists and availability window covers `start_date`.
  - Verifies requested total quantity meets plan `min_qty`.
  - Server generates unique `SUB-XXXXX` identifier and computes pricing.
- **Success (201):** Full subscription payload with lines and initial audit entry.
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/subscriptions \
    -H "Authorization: Bearer <STAFF_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"customer_id":12,"plan_id":1,"template_id":1,"start_date":"2026-11-01","payment_terms":"net_15"}'
  ```

#### 22. List Subscriptions
- **Endpoint:** `GET /api/subscriptions`
- **Access:** Admin, Staff
- **Query Parameters:** `status` (`draft`, `quotation`, `confirmed`, `active`, `closed`), `customer_id`, `q` (subscription number or customer name), `page=1`, `page_size=20`
- **Success (200):** Paginated subscription list.
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/subscriptions?status=active&page=1&page_size=20" \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 23. Subscription Detail
- **Endpoint:** `GET /api/subscriptions/{id}`
- **Access:** Admin, Staff
- **Success (200):** Subscription metadata, customer details, plan details, product lines, recurring amount, and full audit trail timeline.
- **Errors:** 404 (Subscription not found).
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/subscriptions/1 \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 24. Edit Subscription
- **Endpoint:** `PUT /api/subscriptions/{id}`
- **Access:** Admin, Staff
- **Rules:** Modification permitted **only in `draft` or `quotation` status**. Attempting to modify confirmed, active or closed returns 409.
- **Success (200):** Updated subscription object.
- **Curl:**
  ```bash
  curl -X PUT http://localhost:8000/api/subscriptions/1 \
    -H "Authorization: Bearer <STAFF_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"payment_terms":"net_30"}'
  ```

#### 25. Transition Subscription Status
- **Endpoint:** `POST /api/subscriptions/{id}/transition`
- **Access:** Admin, Staff
- **Request Body:**
  ```json
  {
    "to": "confirmed"
  }
  ```
- **Allowed Transitions:**
  - `draft` → `quotation`
  - `quotation` → `confirmed`
  - `confirmed` → `active`
  - `active` → `closed`
- **Errors:** 409 (Illegal status jump).
- **Success (200):** Updated subscription object.
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/subscriptions/1/transition \
    -H "Authorization: Bearer <STAFF_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"to":"confirmed"}'
  ```

#### 26. Pause Subscription
- **Endpoint:** `POST /api/subscriptions/{id}/pause`
- **Access:** Admin, Staff
- **Rules:** Validates `plan.pausable == True`. Sets `is_paused = true` and `paused_at`.
- **Errors:** 409 (Plan not pausable or already paused).
- **Success (200):** Updated subscription object.
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/subscriptions/1/pause \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 27. Close Subscription Early
- **Endpoint:** `POST /api/subscriptions/{id}/close`
- **Access:** Admin, Staff
- **Request Body:**
  ```json
  {
    "reason": "Customer requested cancellation"
  }
  ```
- **Rules:** Validates `plan.closable == True`. Moves status to `closed`.
- **Errors:** 409 (Plan not closable or already closed).
- **Success (200):** Updated subscription object.
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/subscriptions/1/close \
    -H "Authorization: Bearer <STAFF_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"reason":"Customer requested cancellation"}'
  ```

#### 28. Renew Subscription
- **Endpoint:** `POST /api/subscriptions/{id}/renew`
- **Access:** Admin, Staff
- **Rules:** Validates `plan.renewable == True`. Clones commercial configuration into a new quotation subscription.
- **Success (201):** New subscription in `quotation` status.
- **Errors:** 409 (Plan not renewable).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/subscriptions/1/renew \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

---

### Category D: Billing & Invoice Management

#### 29. Run Automatic Billing Engine
- **Endpoint:** `POST /api/billing/run`
- **Access:** Admin, Staff
- **Request Body:**
  ```json
  {
    "as_of_date": "2026-11-01",
    "dry_run": false
  }
  ```
- **Features:**
  - Idempotent: `UNIQUE(subscription_id, period_start, period_end)` prevents duplicate billing.
  - Missed billing period catch-up: Processes all elapsed unbilled cycles.
  - Automatically applies eligible discounts and taxes.
  - Advances `next_billing_date` and atomically increments discount usage.
  - `dry_run: true` projects invoices without database mutations.
- **Success (200):**
  ```json
  {
    "created": 1,
    "skipped": 0,
    "failed": 0,
    "items": [
      {
        "subscription_number": "SUB-00001",
        "status": "created",
        "invoice_number": "INV-00001",
        "period_start": "2026-11-01",
        "period_end": "2026-11-30",
        "total": 331344
      }
    ]
  }
  ```
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/billing/run \
    -H "Authorization: Bearer <STAFF_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"as_of_date":"2026-11-01","dry_run":false}'
  ```

#### 30. List Invoices
- **Endpoint:** `GET /api/invoices`
- **Access:** Admin, Staff
- **Query Parameters:** `status` (`draft`, `confirmed`, `paid`, `cancelled`), `overdue=true/false`, `customer_id`, `from`, `to`, `page=1`, `page_size=20`
- **Success (200):** Paginated invoices with outstanding balances and overdue indicators.
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/invoices?status=confirmed&page=1" \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 31. Invoice Detail
- **Endpoint:** `GET /api/invoices/{id}`
- **Access:** Admin, Staff, or the owning Customer
- **Rules:** If a Customer requests an invoice belonging to another customer, server strictly returns **403 Forbidden**.
- **Success (200):**
  ```json
  {
    "id": 1,
    "number": "INV-00001",
    "subscription_id": 1,
    "subscription_number": "SUB-00001",
    "customer_id": 12,
    "customer_name": "Rahul Menon",
    "customer_email": "rahul@example.com",
    "period_start": "2026-11-01",
    "period_end": "2026-11-30",
    "issue_date": "2026-11-01",
    "due_date": "2026-11-16",
    "status": "confirmed",
    "subtotal": 312000,
    "discount_total": 31200,
    "tax_total": 50544,
    "total": 331344,
    "paid_total": 100000,
    "outstanding": 231344,
    "is_overdue": false,
    "lines": [...],
    "payments": [...]
  }
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/invoices/1 \
    -H "Authorization: Bearer <STAFF_OR_CUSTOMER_TOKEN>"
  ```

#### 32. Confirm Invoice
- **Endpoint:** `POST /api/invoices/{id}/confirm`
- **Access:** Admin, Staff
- **Rules:** Only `draft` invoices can be confirmed.
- **Success (200):** Confirmed invoice.
- **Errors:** 409 (Invoice not in draft status).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/invoices/1/confirm \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 33. Cancel Invoice
- **Endpoint:** `POST /api/invoices/{id}/cancel`
- **Access:** Admin, Staff
- **Rules:** Cannot cancel paid or already cancelled invoices.
- **Success (200):** Cancelled invoice.
- **Errors:** 409 (Invoice already paid or cancelled).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/invoices/1/cancel \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 34. Send Invoice
- **Endpoint:** `POST /api/invoices/{id}/send`
- **Access:** Admin, Staff
- **Rules:** Only `confirmed` invoices can be sent. Queues message into local Outbox.
- **Success (200):**
  ```json
  {
    "detail": "Invoice INV-00001 has been queued to Outbox for rahul@example.com."
  }
  ```
- **Errors:** 409 (Invoice not confirmed).
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/invoices/1/send \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 35. Printable Invoice Payload
- **Endpoint:** `GET /api/invoices/{id}/print`
- **Access:** Admin, Staff, or owning Customer (403 for other customer)
- **Success (200):** Structured print-ready breakdown.
  ```json
  {
    "invoice_number": "INV-00001",
    "customer": {
      "name": "Rahul Menon",
      "email": "rahul@example.com"
    },
    "subscription_number": "SUB-00001",
    "issue_date": "2026-11-01",
    "due_date": "2026-11-16",
    "status": "confirmed",
    "subtotal": 312000,
    "discount_total": 31200,
    "tax_total": 50544,
    "total": 331344,
    "paid_total": 100000,
    "outstanding": 231344,
    "lines": [...]
  }
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/invoices/1/print \
    -H "Authorization: Bearer <TOKEN>"
  ```

---

### Category E: Payment Management

#### 36. Record Payment
- **Endpoint:** `POST /api/invoices/{id}/payments`
- **Access:** Admin, Staff
- **Request Body:**
  ```json
  {
    "method": "UPI",
    "amount": 100000,
    "paid_on": "2026-11-05",
    "note": "Partial payment through UPI"
  }
  ```
- **Validation Rules:**
  - `amount > 0`.
  - Cannot pay against cancelled invoices (409).
  - Overpayment strictly rejected: `amount <= invoice.total - invoice.paid_total` (422).
  - When outstanding reaches 0, invoice status automatically updates to `paid`.
- **Success (201):**
  ```json
  {
    "payment": {
      "id": 1,
      "invoice_id": 1,
      "invoice_number": "INV-00001",
      "method": "UPI",
      "amount": 100000,
      "paid_on": "2026-11-05",
      "note": "Partial payment through UPI",
      "recorded_by": 2,
      "source": "manual",
      "created_at": "2026-11-05T10:00:00Z"
    },
    "invoice_status": "confirmed",
    "paid_total": 100000,
    "outstanding": 231344
  }
  ```
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/invoices/1/payments \
    -H "Authorization: Bearer <STAFF_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"method":"UPI","amount":100000,"paid_on":"2026-11-05","note":"Partial payment"}'
  ```

#### 37. List Payments
- **Endpoint:** `GET /api/payments`
- **Access:** Admin, Staff
- **Query Parameters:** `from`, `to`, `method`, `invoice_id`, `page=1`, `page_size=20`
- **Success (200):** Paginated payments with customer names and invoice numbers.
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/payments?page=1&page_size=20" \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

---

### Category F: Finance Reporting

#### 38. Financial Summary
- **Endpoint:** `GET /api/reports/summary`
- **Access:** Admin, Staff
- **Query Parameters:** `from` (date), `to` (date)
- **Metrics Calculated in Database:**
  - `active_subscriptions`: Active, unpaused, unexpired subscriptions count.
  - `revenue_received`: Sum of actual payments in period.
  - `outstanding`: Sum of `total - paid_total` on valid invoices.
  - `overdue_count`: Number of invoices where `due_date < today` and `outstanding > 0`.
  - `mrr`: Normalized monthly recurring revenue across daily, weekly, monthly and yearly subscriptions.
  - `query_ms`: Measured database execution time in milliseconds (< 50ms on 10,000 subscriptions).
- **Success (200):**
  ```json
  {
    "active_subscriptions": 8052,
    "revenue_received": 4087037970,
    "outstanding": 3338260710,
    "overdue_count": 4103,
    "mrr": 11055227833,
    "query_ms": 46
  }
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/reports/summary \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

#### 39. Overdue Invoices Report
- **Endpoint:** `GET /api/reports/overdue`
- **Access:** Admin, Staff
- **Query Parameters:** `min_days_late=7`, `page=1`, `page_size=20`
- **Success (200):**
  ```json
  {
    "items": [
      {
        "invoice_number": "INV-00045",
        "customer_name": "Acme Corp",
        "total": 1000000,
        "paid_total": 400000,
        "outstanding": 600000,
        "due_date": "2026-10-20",
        "days_late": 11
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 1
  }
  ```
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/reports/overdue?min_days_late=7&page=1" \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

---

### Category G: Customer Portal & Directory

#### 40. Customer Own Subscriptions
- **Endpoint:** `GET /api/portal/subscriptions`
- **Access:** Customer role only
- **Rules:** The customer's identity is strictly extracted from the validated JWT token. No query parameters can bypass authorization.
- **Success (200):** List of current customer's subscriptions.
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/portal/subscriptions \
    -H "Authorization: Bearer <CUSTOMER_TOKEN>"
  ```

#### 41. Customer Own Invoices
- **Endpoint:** `GET /api/portal/invoices`
- **Access:** Customer role only
- **Success (200):** List of current customer's invoices with balances and payment statuses.
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/portal/invoices \
    -H "Authorization: Bearer <CUSTOMER_TOKEN>"
  ```

#### 42. Customers Directory
- **Endpoint:** `GET /api/customers`
- **Access:** Admin, Staff
- **Query Parameters:** `q` (search customer name or email), `page=1`, `page_size=20`
- **Success (200):** Paginated directory of customer accounts (without password hashes) for UI dropdown pickers.
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/customers?page=1&page_size=20" \
    -H "Authorization: Bearer <STAFF_TOKEN>"
  ```

---

### Category H: Role-Based In-App Notification System

All notifications are stored persistently in the database with strict user isolation, category preference gating, and deduplication guarantees via unique event keys.

#### 43. List Notifications
- **Endpoint:** `GET /api/notifications`
- **Access:** Authenticated (Admin, Staff, Customer)
- **Query Parameters:**
  - `category` (optional): `invoice`, `payment`, `subscription`, `quotation`, `account`, `system`
  - `is_read` (optional): `true` / `false`
  - `priority` (optional): `low`, `normal`, `high`, `critical`
  - `page` (optional, default: `1`): page number
  - `page_size` (optional, default: `20`, max: `100`): items per page
- **Customer Isolation:** Returns ONLY notifications addressed to the authenticated user's `id`.
- **Success (200):**
  ```json
  {
    "items": [
      {
        "id": 101,
        "user_id": 12,
        "title": "Invoice Due Soon",
        "message": "Invoice INV-00045 for ₹560.00 is due in 3 days on 2026-11-03.",
        "category": "invoice",
        "priority": "normal",
        "related_entity_type": "invoice",
        "related_entity_id": 45,
        "action_url": "/portal/invoices",
        "event_key": "invoice:45:due_soon:3d",
        "is_read": false,
        "created_at": "2026-10-31T06:00:00Z",
        "read_at": null
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 1,
    "unread_count": 1
  }
  ```
- **Curl:**
  ```bash
  curl -X GET "http://localhost:8000/api/notifications?is_read=false&page=1" \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

#### 44. Unread Notification Count
- **Endpoint:** `GET /api/notifications/unread-count`
- **Access:** Authenticated (Admin, Staff, Customer)
- **Success (200):**
  ```json
  {
    "unread_count": 3
  }
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/notifications/unread-count \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

#### 45. Mark Notification as Read
- **Endpoint:** `PATCH /api/notifications/{notification_id}/read`
- **Access:** Authenticated (Owner of notification only)
- **Security Check:** If notification belongs to another user, returns `403 Forbidden`. If non-existent, returns `404 Not Found`.
- **Success (200):**
  ```json
  {
    "id": 101,
    "user_id": 12,
    "title": "Invoice Due Soon",
    "message": "Invoice INV-00045 for ₹560.00 is due in 3 days on 2026-11-03.",
    "category": "invoice",
    "priority": "normal",
    "related_entity_type": "invoice",
    "related_entity_id": 45,
    "action_url": "/portal/invoices",
    "event_key": "invoice:45:due_soon:3d",
    "is_read": true,
    "created_at": "2026-10-31T06:00:00Z",
    "read_at": "2026-10-31T06:45:00Z"
  }
  ```
- **Curl:**
  ```bash
  curl -X PATCH http://localhost:8000/api/notifications/101/read \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

#### 46. Mark All Notifications as Read
- **Endpoint:** `PATCH /api/notifications/read-all`
- **Access:** Authenticated
- **Success (200):**
  ```json
  {
    "message": "3 notifications marked as read.",
    "updated_count": 3
  }
  ```
- **Curl:**
  ```bash
  curl -X PATCH http://localhost:8000/api/notifications/read-all \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

#### 47. Dismiss / Delete Notification
- **Endpoint:** `DELETE /api/notifications/{notification_id}`
- **Access:** Authenticated (Owner only)
- **Security Check:** Returns `403 Forbidden` if notification belongs to another user. Returns `404 Not Found` if not found.
- **Success (200):**
  ```json
  {
    "detail": "Notification deleted successfully."
  }
  ```
- **Curl:**
  ```bash
  curl -X DELETE http://localhost:8000/api/notifications/101 \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

#### 48. Get Notification Preferences
- **Endpoint:** `GET /api/notifications/preferences`
- **Access:** Authenticated
- **Success (200):**
  ```json
  {
    "preferences": [
      {"category": "invoice", "enabled": true},
      {"category": "payment", "enabled": true},
      {"category": "subscription", "enabled": true},
      {"category": "quotation", "enabled": true},
      {"category": "account", "enabled": true},
      {"category": "system", "enabled": true}
    ]
  }
  ```
- **Curl:**
  ```bash
  curl -X GET http://localhost:8000/api/notifications/preferences \
    -H "Authorization: Bearer <JWT_TOKEN>"
  ```

#### 49. Update Notification Preferences
- **Endpoint:** `PUT /api/notifications/preferences`
- **Access:** Authenticated
- **Business Rule:** Essential security and integrity categories (`account`, `system`) cannot be disabled. If sent with `enabled: false`, the server automatically retains `enabled: true`.
- **Request Body:**
  ```json
  {
    "preferences": [
      {"category": "invoice", "enabled": false},
      {"category": "payment", "enabled": true}
    ]
  }
  ```
- **Success (200):** Complete updated list of preferences.
- **Curl:**
  ```bash
  curl -X PUT http://localhost:8000/api/notifications/preferences \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -d '{"preferences":[{"category":"invoice","enabled":false}]}'
  ```

#### 50. Run Scheduled Notification Checks
- **Endpoint:** `POST /api/notifications/run-scheduled`
- **Access:** **Admin role only** (Staff: 403, Customer: 403)
- **Request Body (Optional):**
  ```json
  {
    "as_of_date": "2026-10-31"
  }
  ```
- **Operations Performed:**
  1. **Invoice Reminders:** 3 days before due date (`due_soon`), 1 day overdue, 7 days overdue, 15 days overdue. Excludes paid (`paid_total >= total`) and cancelled invoices.
  2. **Subscription Expiry Reminders:** 30 days, 7 days, 1 day before expiry for active subscriptions. Excludes closed subscriptions.
  3. **Quotation Expiry Reminders:** 3 days and 1 day before expiry, and expired quotations (`as_of_date > expiry_date`).
  4. **Deduplication:** Safe against duplicate executions via database event keys.
- **Success (200):**
  ```json
  {
    "notifications_created": 4,
    "as_of_date": "2026-10-31",
    "details": [
      "Due soon (3d) notification sent to customer 12 for invoice INV-00045"
    ]
  }
  ```
- **Curl:**
  ```bash
  curl -X POST http://localhost:8000/api/notifications/run-scheduled \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -d '{"as_of_date":"2026-10-31"}'
  ```
