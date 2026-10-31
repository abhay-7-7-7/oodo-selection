# Brightloop Software — Core API Contract (42 Endpoints)

This document represents the binding API Contract between Backend (Dev A) and Frontend (Dev B) for the Brightloop Software Subscription Management platform. It is derived directly from the Hackathon Build Plan (`API Contract` sheet).

Dev B builds UI components against this contract using the mock JSON in `docs/mock-json/`. Dev A implements backend endpoints matching these exact paths, schemas, and status codes. Roles are strictly enforced on the server.

---

## Summary Index of Core Endpoints

| # | Area | Method | Path | Allowed Roles | Request (Key Fields) | Response (Key Fields) | Error Codes |
|---|---|---|---|---|---|---|---|
| **1** | Auth | `POST` | `/api/auth/signup` | Public | `email`, `password`, `name` | `201` `{id, email, role: "customer", name}` | `409` (email exists), `422` (weak pw) |
| **2** | Auth | `POST` | `/api/auth/login` | Public | `email`, `password` | `200` `{access_token, token_type, role, name}` | `401` (invalid credentials) |
| **3** | Auth | `POST` | `/api/auth/forgot-password` | Public | `email` | `200` `{message}` (Outbox email queued) | `429` (too many requests) |
| **4** | Auth | `POST` | `/api/auth/reset-password` | Public | `token`, `new_password` | `200` `{message}` | `400` (token invalid/expired), `422` (weak pw) |
| **5** | Auth | `GET` | `/api/auth/me` | Any logged-in user | None | `200` `{id, email, role, name}` | `401` (unauthenticated) |
| **6** | Auth | `POST` | `/api/staff` | Admin only | `name`, `email`, `password` | `201` `{id, email, role: "staff", name}` | `403` (not admin), `409` (email exists) |
| **7** | Auth | `GET` | `/api/outbox` | Admin, Staff | `page`, `page_size` | `200` `[{id, to_email, subject, body, created_at}]` | `403` (unauthorized) |
| **8** | Catalog | `GET` | `/api/products` | Admin, Staff | `q`, `page`, `page_size` | `200` `[product + variants]` | - |
| **9** | Catalog | `POST` | `/api/products` | Admin | `name`, `type`, `sales_price`, `cost_price`, `notes` | `201` `{product}` | `422` (negative price), `403` |
| **10** | Catalog | `PUT` | `/api/products/{id}` | Admin | `name`, `type`, `sales_price`, `cost_price`, `notes` | `200` `{product}` | `404` (not found), `403` |
| **11** | Catalog | `POST` | `/api/products/{id}/variants` | Admin | `attribute`, `value`, `price_extra` | `201` `{variant}` | `404`, `422` |
| **12** | Catalog | `GET` | `/api/plans` | Admin, Staff, Customer | `active_only` | `200` `[{plan}]` | - |
| **13** | Catalog | `POST` | `/api/plans` | Admin | `name`, `price`, `period`, `min_qty`, `valid_from`, `valid_to`, `auto_close`, `closable`, `pausable`, `renewable` | `201` `{plan}` | `422` (valid_to < valid_from), `403` |
| **14** | Catalog | `PUT` | `/api/plans/{id}` | Admin | Plan fields | `200` `{plan}` | `404`, `403` |
| **15** | Catalog | `GET` | `/api/taxes` | Admin, Staff | None | `200` `[{tax}]` | - |
| **16** | Catalog | `POST` | `/api/taxes` | Admin | `name`, `rate_percent`, `applies_to` | `201` `{tax}` | `422` (rate outside 0-100), `403` |
| **17** | Catalog | `GET` | `/api/discounts` | Admin, Staff | None | `200` `[{discount + times_used / usage_limit}]` | - |
| **18** | Catalog | `POST` | `/api/discounts` | Admin only | `name`, `kind`, `value`, `min_amount`, `min_qty`, `start_date`, `end_date`, `usage_limit`, `scope`, `product_id` | `201` `{discount}` | `403` (staff), `422` (percent > 100, end < start) |
| **19** | Subscriptions | `GET` | `/api/quotation-templates` | Admin, Staff | None | `200` `[{template}]` | - |
| **20** | Subscriptions | `POST` | `/api/quotation-templates` | Admin, Staff | `name`, `plan_id`, `validity_days`, `lines[]` | `201` `{template}` | `422` |
| **21** | Subscriptions | `POST` | `/api/subscriptions` | Admin, Staff | `customer_id`, `plan_id` or `template_id`, `start_date`, `payment_terms`, `lines[]` | `201` `{subscription}` with generated number | `422`, `409` (plan unavailable on start date) |
| **22** | Subscriptions | `GET` | `/api/subscriptions` | Admin, Staff | `status`, `customer_id`, `q`, `page`, `page_size` | `200` Paged list of subscriptions | - |
| **23** | Subscriptions | `GET` | `/api/subscriptions/{id}` | Admin, Staff | None | `200` Subscription + lines + audit history | `404` |
| **24** | Subscriptions | `PUT` | `/api/subscriptions/{id}` | Admin, Staff | Editable fields | `200` Updated subscription | `409` (not editable unless draft/quotation) |
| **25** | Subscriptions | `POST` | `/api/subscriptions/{id}/transition` | Admin, Staff | `to` (`quotation\|confirmed\|active\|closed`) | `200` `{status}` | `409` (illegal transition) |
| **26** | Subscriptions | `POST` | `/api/subscriptions/{id}/pause` | Admin, Staff | None | `200` `{message, is_paused}` | `409` (plan not pausable) |
| **27** | Subscriptions | `POST` | `/api/subscriptions/{id}/close` | Admin, Staff | `reason` | `200` `{message, status}` | `409` (plan not closable) |
| **28** | Subscriptions | `POST` | `/api/subscriptions/{id}/renew` | Admin, Staff | None | `201` New renewal subscription | `409` (plan not renewable) |
| **29** | Invoicing | `POST` | `/api/billing/run` | Admin, Staff | `as_of_date`, `dry_run` | `200` `{created, skipped, failed, items[]}` | - |
| **30** | Invoicing | `GET` | `/api/invoices` | Admin, Staff | `status`, `overdue`, `customer_id`, `from`, `to`, `page`, `page_size` | `200` Paged list of invoices | - |
| **31** | Invoicing | `GET` | `/api/invoices/{id}` | Admin, Staff, Customer (owner) | None | `200` Invoice + lines + breakdown + payments | `403` (another customer's invoice), `404` |
| **32** | Invoicing | `POST` | `/api/invoices/{id}/confirm` | Admin, Staff | None | `200` `{status: "confirmed"}` | `409` (not in draft) |
| **33** | Invoicing | `POST` | `/api/invoices/{id}/cancel` | Admin, Staff | None | `200` `{status: "cancelled"}` | `409` (already paid) |
| **34** | Invoicing | `POST` | `/api/invoices/{id}/send` | Admin, Staff | None | `200` (email placed in Outbox) | `409` (invoice not confirmed) |
| **35** | Invoicing | `GET` | `/api/invoices/{id}/print` | Admin, Staff, Customer (owner) | None | `200` Printable HTML / structured printable payload | `403`, `404` |
| **36** | Payments | `POST` | `/api/invoices/{id}/payments` | Admin, Staff | `method`, `amount`, `paid_on`, `note` | `201` `{payment, new_balance, invoice_status}` | `422` (amount > balance), `409` |
| **37** | Payments | `GET` | `/api/payments` | Admin, Staff | `from_date`, `to_date`, `method`, `invoice_id`, `page` | `200` Paged list of payments | - |
| **38** | Reports | `GET` | `/api/reports/summary` | Admin, Staff | `from_date`, `to_date` | `200` `{active_subscriptions, revenue_received, outstanding, overdue_count, mrr, query_ms}` | - |
| **39** | Reports | `GET` | `/api/reports/overdue` | Admin, Staff | `min_days_late`, `page`, `page_size` | `200` Paged list with `days_late` | - |
| **40** | Portal | `GET` | `/api/portal/subscriptions` | Customer | None | `200` Current customer's subscriptions | `401` |
| **41** | Portal | `GET` | `/api/portal/invoices` | Customer | None | `200` Current customer's invoices | `401` |
| **42** | Portal | `GET` | `/api/customers` | Admin, Staff | `q`, `page`, `page_size` | `200` List of customer records | `403` |

---

## Detailed Endpoint Specifications

### 1. Authentication & Users

#### 1. POST /api/auth/signup (BE: A1, FE: FA1)
- **Role:** Public
- **Request Body:**
  ```json
  {
    "name": "Rahul Menon",
    "email": "rahul@example.com",
    "password": "ValidPassword@2026"
  }
  ```
- **Validation:**
  - `email`: Normalized to lowercase; must be unique across all users (case-insensitively).
  - `password`: Must be >= 9 characters long, containing at least 1 uppercase letter, 1 lowercase letter, and 1 special character (`!@#$%^&*()_+-=[]{}|;:,.<>?`).
- **Responses:**
  - `201 Created`:
    ```json
    {
      "id": 1,
      "name": "Rahul Menon",
      "email": "rahul@example.com",
      "role": "customer",
      "is_active": true,
      "created_at": "2026-10-31T10:00:00Z"
    }
    ```
  - `409 Conflict`: `{"detail": "An account with this email already exists."}`
  - `422 Unprocessable Entity`: `{"detail": "Password must be at least 9 characters long and include an uppercase letter, lowercase letter, and special character."}`

#### 2. POST /api/auth/login (BE: A2, FE: FA1)
- **Role:** Public
- **Request Body:**
  ```json
  {
    "email": "rahul@example.com",
    "password": "ValidPassword@2026"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer",
      "role": "customer",
      "name": "Rahul Menon",
      "email": "rahul@example.com"
    }
    ```
  - `401 Unauthorized`: `{"detail": "Invalid email or password."}`

#### 3. POST /api/auth/forgot-password (BE: A3, FE: FA2)
- **Role:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Responses:**
  - `200 OK`: `{"message": "If the email is registered, password reset instructions have been sent."}` (Always returns 200 to prevent user enumeration; reset email token is recorded in Outbox).

#### 4. POST /api/auth/reset-password (BE: A3, FE: FA2)
- **Role:** Public
- **Request Body:**
  ```json
  {
    "token": "reset-token-uuid-string",
    "new_password": "NewValidPassword@2026"
  }
  ```
- **Responses:**
  - `200 OK`: `{"message": "Password successfully reset."}`
  - `400 Bad Request`: `{"detail": "Invalid or expired reset token."}`
  - `422 Unprocessable Entity`: Password strength failure.

#### 5. GET /api/auth/me (BE: A4, FE: Common)
- **Role:** Any Authenticated User (Bearer Token)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "id": 1,
      "email": "admin@brightloop.com",
      "name": "System Administrator",
      "role": "admin",
      "is_active": true
    }
    ```
  - `401 Unauthorized`: Missing or invalid Bearer token.

#### 6. POST /api/staff (BE: A5, FE: FA3)
- **Role:** Admin Only
- **Request Body:**
  ```json
  {
    "name": "Priya Sharma",
    "email": "priya.staff@brightloop.com",
    "password": "StaffPassword@2026"
  }
  ```
- **Responses:**
  - `201 Created`: `{ "id": 2, "name": "Priya Sharma", "email": "priya.staff@brightloop.com", "role": "staff", "is_active": true }`
  - `403 Forbidden`: `{"detail": "Admin privileges required."}`
  - `409 Conflict`: `{"detail": "User with this email already exists."}`

#### 7. GET /api/outbox (BE: A6, FE: FA4)
- **Role:** Admin, Staff
- **Query Params:** `page=1`, `page_size=20`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "items": [
        {
          "id": 1,
          "to_email": "rahul@example.com",
          "subject": "Reset your Brightloop password",
          "body": "Use token: abc-123",
          "created_at": "2026-10-31T10:05:00Z"
        }
      ],
      "total": 1,
      "page": 1,
      "page_size": 20
    }
    ```

---

### 2. Catalog: Products, Variants, Plans, Taxes, Discounts

#### 8. GET /api/products
- **Role:** Admin, Staff
- **Query Params:** `q` (search string), `page`, `page_size`
- **Response:** List of products with their configured variants.

#### 9. POST /api/products
- **Role:** Admin Only
- **Request Body:**
  ```json
  {
    "name": "Brightloop Enterprise Suite",
    "type": "software",
    "sales_price": 499900,
    "cost_price": 150000,
    "notes": "Core ERP software edition"
  }
  ```
- **Errors:** `422` (sales_price or cost_price < 0), `403` (Staff).

#### 10. PUT /api/products/{id}
- **Role:** Admin Only
- **Responses:** `200` updated product, `404` not found.

#### 11. POST /api/products/{id}/variants
- **Role:** Admin Only
- **Request Body:**
  ```json
  {
    "attribute": "Brand",
    "value": "Acme Special",
    "price_extra": 56000
  }
  ```

#### 12. GET /api/plans
- **Role:** Admin, Staff, Customer (read-only)
- **Query Params:** `active_only=true`

#### 13. POST /api/plans
- **Role:** Admin Only
- **Request Body:**
  ```json
  {
    "name": "Enterprise Monthly",
    "price": 250000,
    "period": "monthly",
    "min_qty": 1,
    "valid_from": "2026-01-01",
    "valid_to": null,
    "auto_close": false,
    "closable": true,
    "pausable": true,
    "renewable": true
  }
  ```
- **Errors:** `422` if `valid_to` < `valid_from`.

#### 14. PUT /api/plans/{id}
- **Role:** Admin Only

#### 15. GET /api/taxes
- **Role:** Admin, Staff

#### 16. POST /api/taxes
- **Role:** Admin Only
- **Request Body:**
  ```json
  {
    "name": "GST 18%",
    "rate_percent": 18.0,
    "applies_to": "all"
  }
  ```
- **Errors:** `422` if `rate_percent` not between 0 and 100.

#### 17. GET /api/discounts
- **Role:** Admin, Staff
- **Response:** List of discounts including `times_used` and `usage_limit`.

#### 18. POST /api/discounts
- **Role:** Admin Only
- **Request Body:**
  ```json
  {
    "name": "HACKATHON_VIP",
    "kind": "percent",
    "value": 15.0,
    "min_amount": 0,
    "min_qty": 1,
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "usage_limit": 100,
    "scope": "subscription",
    "product_id": null
  }
  ```
- **Errors:** `403` (Staff forbidden), `422` (percent > 100 or `end_date` < `start_date`).

---

### 3. Subscriptions & Quotation Templates

#### 19. GET /api/quotation-templates
- **Role:** Admin, Staff

#### 20. POST /api/quotation-templates
- **Role:** Admin, Staff
- **Request Body:**
  ```json
  {
    "name": "Standard Cloud Starter",
    "plan_id": 1,
    "validity_days": 30,
    "lines": [
      {
        "product_id": 1,
        "variant_id": null,
        "quantity": 1,
        "unit_price": 250000
      }
    ]
  }
  ```

#### 21. POST /api/subscriptions
- **Role:** Admin, Staff
- **Request Body:**
  ```json
  {
    "customer_id": 3,
    "plan_id": 1,
    "start_date": "2026-02-01",
    "payment_terms": "net_15",
    "lines": [
      {
        "product_id": 1,
        "variant_id": 1,
        "quantity": 2,
        "unit_price": 250000
      }
    ]
  }
  ```
- **Response:** Created subscription with generated sequence `number` (e.g., `SUB-2026-0001`).
- **Errors:** `409` if plan is not active or outside validity range on `start_date`.

#### 22. GET /api/subscriptions
- **Role:** Admin, Staff
- **Query Params:** `status`, `customer_id`, `q`, `page`, `page_size`

#### 23. GET /api/subscriptions/{id}
- **Role:** Admin, Staff
- **Response:** Subscription details with lines, pricing calculations, and audit history.

#### 24. PUT /api/subscriptions/{id}
- **Role:** Admin, Staff
- **Rule:** Can only update lines/fields when subscription is in `draft` or `quotation` status.
- **Errors:** `409 Conflict` if subscription is `confirmed`, `active`, or `closed`.

#### 25. POST /api/subscriptions/{id}/transition
- **Role:** Admin, Staff
- **Request Body:** `{"to": "confirmed"}` (Valid transitions: draft -> quotation -> confirmed -> active -> closed).
- **Errors:** `409 Conflict` for illegal transition sequence.

#### 26. POST /api/subscriptions/{id}/pause
- **Role:** Admin, Staff
- **Errors:** `409 Conflict` if plan `pausable` is false.

#### 27. POST /api/subscriptions/{id}/close
- **Role:** Admin, Staff
- **Request Body:** `{"reason": "Customer cancellation"}`
- **Errors:** `409 Conflict` if plan `closable` is false.

#### 28. POST /api/subscriptions/{id}/renew
- **Role:** Admin, Staff
- **Response:** Creates new renewed subscription record.
- **Errors:** `409 Conflict` if plan `renewable` is false.

---

### 4. Invoicing & Billing

#### 29. POST /api/billing/run
- **Role:** Admin, Staff
- **Request Body:**
  ```json
  {
    "as_of_date": "2026-03-01",
    "dry_run": false
  }
  ```
- **Response:**
  ```json
  {
    "as_of_date": "2026-03-01",
    "dry_run": false,
    "created": 12,
    "skipped": 45,
    "failed": 0,
    "items": [
      {
        "subscription_id": 1,
        "subscription_number": "SUB-2026-0001",
        "invoice_number": "INV-2026-0001",
        "period_start": "2026-03-01",
        "period_end": "2026-03-31",
        "total": 306000
      }
    ]
  }
  ```
- **Database Rule:** Anti-double-billing uniqueness constraint `UNIQUE(subscription_id, period_start, period_end)` guarantees no duplicate invoices are ever created.

#### 30. GET /api/invoices
- **Role:** Admin, Staff
- **Query Params:** `status`, `overdue`, `customer_id`, `from_date`, `to_date`, `page`, `page_size`

#### 31. GET /api/invoices/{id}
- **Role:** Admin, Staff, Owning Customer
- **Response:** Full invoice object, itemized lines, discount breakdowns, tax breakdowns, and payment history.
- **Errors:** `403 Forbidden` if a customer attempts to read another customer's invoice.

#### 32. POST /api/invoices/{id}/confirm
- **Role:** Admin, Staff
- **Responses:** `200` with `status: "confirmed"`, `409` if not in draft.

#### 33. POST /api/invoices/{id}/cancel
- **Role:** Admin, Staff
- **Errors:** `409 Conflict` if invoice has recorded payments.

#### 34. POST /api/invoices/{id}/send
- **Role:** Admin, Staff
- **Action:** Generates invoice email notice into the Outbox table.
- **Errors:** `409 Conflict` if invoice is not confirmed.

#### 35. GET /api/invoices/{id}/print
- **Role:** Admin, Staff, Owning Customer
- **Response:** Printable HTML / formatted JSON printable view.

---

### 5. Payments

#### 36. POST /api/invoices/{id}/payments
- **Role:** Admin, Staff
- **Request Body:**
  ```json
  {
    "method": "bank_transfer",
    "amount": 306000,
    "paid_on": "2026-03-05",
    "note": "NEFT ref #998877"
  }
  ```
- **Validation:**
  - `amount` must be > 0 and cannot exceed invoice outstanding balance (`total - paid_total`).
- **Response:**
  ```json
  {
    "payment_id": 1,
    "invoice_id": 1,
    "amount": 306000,
    "new_balance": 0,
    "invoice_status": "paid",
    "paid_on": "2026-03-05"
  }
  ```
- **Errors:** `422 Unprocessable Entity` if amount exceeds balance; `409 Conflict` if invoice cancelled.

#### 37. GET /api/payments
- **Role:** Admin, Staff
- **Query Params:** `from_date`, `to_date`, `method`, `invoice_id`, `page`, `page_size`

---

### 6. Reports

#### 38. GET /api/reports/summary
- **Role:** Admin, Staff
- **Query Params:** `from_date`, `to_date`
- **Response:**
  ```json
  {
    "active_subscriptions": 142,
    "revenue_received": 18450000,
    "outstanding": 3200000,
    "overdue_count": 8,
    "mrr": 4250000,
    "query_ms": 28
  }
  ```

#### 39. GET /api/reports/overdue
- **Role:** Admin, Staff
- **Query Params:** `min_days_late=1`, `page=1`, `page_size=20`
- **Response:** Paged list of overdue invoices with customer details and `days_late` count.

---

### 7. Customer Portal & Customers Directory

#### 40. GET /api/portal/subscriptions
- **Role:** Customer Only (scoped to currently authenticated user)
- **Response:** List of subscriptions belonging to the calling customer.

#### 41. GET /api/portal/invoices
- **Role:** Customer Only (scoped to currently authenticated user)
- **Response:** List of invoices belonging to the calling customer.

#### 42. GET /api/customers
- **Role:** Admin, Staff
- **Query Params:** `q` (search name/email), `page`, `page_size`
- **Response:** List of customer user profiles.

---

## Mock JSON Reference

Mock JSON files for Dev B frontend consumption are stored in `docs/mock-json/`:
- `docs/mock-json/auth.json`
- `docs/mock-json/products.json`
- `docs/mock-json/plans.json`
- `docs/mock-json/taxes.json`
- `docs/mock-json/discounts.json`
- `docs/mock-json/quotation-templates.json`
- `docs/mock-json/subscriptions.json`
- `docs/mock-json/billing.json`
- `docs/mock-json/invoices.json`
- `docs/mock-json/payments.json`
- `docs/mock-json/reports.json`
- `docs/mock-json/portal.json`
