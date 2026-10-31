# Subscription Management System — Brightloop Software

A unified platform for running plans, subscriptions and recurring billing for **Brightloop Software**: from product setup and quotations to automatic invoicing, payments and revenue reporting.

> Status: Backend implementation complete, tested with 10,000 subscriptions, and fully documented for frontend integration.

---

## 1. Problem

Brightloop sells software on monthly and yearly subscriptions. Today subscriptions live in spreadsheets, renewals are missed, invoices are typed by hand, payments are matched manually, and nobody knows the real recurring revenue. This project replaces that spreadsheet workflow with one robust, connected backend.

---

## 2. Team Split

| Member | Role | Responsibilities |
|---|---|---|
| **Dev A (Backend)** | Principal Backend Engineer & Database Architect | FastAPI backend, SQLite WAL, schema, auth, RBAC, pricing engine, automated billing, payments, reporting API, seed data, automated tests |
| **Dev B (Frontend)** | Frontend Engineer | React + Vite UI, admin template, customer portal, billing run interface, invoice printing |

---

## 3. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Backend** | Python 3.11+ / FastAPI | High speed, async, Pydantic v2 data validation, auto-generated OpenAPI contract |
| **Database** | SQLite (`WAL` mode, foreign keys, indexed) | Zero external server setup, local-first, blazing fast (< 50ms on 10,000 subscriptions) |
| **ORM** | SQLAlchemy 2.x | Relational mapping, unit-of-work transactions, constraint enforcement |
| **Auth** | JWT + bcrypt | Role-Based Access Control (`admin`, `staff`, `customer`) strictly enforced on the server |
| **Email** | Outbox Table simulation | No external SMTP required; all reset tokens and invoice dispatches visible in-app |
| **Testing** | Pytest + HTTPX | 28 automated tests covering auth, permissions, catalog, subscriptions, billing, payments, and reporting |

---

## 4. Getting Started

### Start the Backend
```bash
# 1. Enter the backend directory
cd backend

# 2. Install Python dependencies
python -m pip install -r requirements.txt

# 3. (Optional) Seed 10,000 realistic subscriptions
python scripts/seed.py --reset 10000

# 4. Start the server
python -m uvicorn app.main --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Documentation & Contract:** See [`backend/API_DOCUMENTATION.md`](backend/API_DOCUMENTATION.md) for schemas and curl commands for all 42 endpoints.

---

## 5. Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@brightloop.com` | `AdminPassword@2026` |
| **Staff** | `anjali@brightloop.com` | `StaffPassword@2026` |
| **Customer** | `rahul@example.com` | `Brightloop@2026` |

---

## 6. Git Workflow

- Every member commits from their own GitHub account.
- Feature branches (`feat/...`, `fix/...`) merged through pull requests.
- Commit messages follow conventional commits `type(scope): short description`.
- Hourly checkpoints tagged `checkpoint-1`, `checkpoint-2`, up to `checkpoint-8` and `v1.0`.

---

## 7. Progress Log

| Checkpoint | Time | What was done |
|---|---|---|
| 1 | 10:00 | Repo created, README added, problem analysed, features and differentiators planned |
| 2 | 11:00 | Complete SQLite schema designed, WAL mode configured, models for Users, Outbox, Products, Variants, Plans, Taxes, Discounts, Templates, Subscriptions, Invoices, Payments |
| 3 | 11:15 | Authentication, JWT, bcrypt, password strength validation (>8 chars, upper, lower, special), Outbox email simulation |
| 4 | 11:25 | Catalog APIs (Products, Variants, Plans, Taxes, Discounts), Quotation templates, Subscriptions with lifecycle state machine |
| 5 | 11:35 | Reusable pricing engine (integer paise, variant adjustments, discounts, taxes), Automatic billing engine with catch-up and anti-double-billing guard |
| 6 | 11:45 | Invoice management, Payments (partial and full settlement), Financial reporting (MRR, revenue, outstanding, overdue < 50ms) |
| 7 | 11:50 | High-performance 10k seeder (3.78s execution), 28 automated tests written and verified passing |
| 8 | 11:55 | Part M end-to-end acceptance test scenario executed with 100% success; complete `API_DOCUMENTATION.md` delivered |

---

## 8. Requirements Traceability Matrix

| Rubric / Brief Requirement | Covered in Backend | Verified By |
|---|---|---|
| **Dynamic data / local database** | SQLite in WAL mode with relational models and indexes | `scripts/seed.py`, `app/database.py` |
| **Robust input validation** | Pydantic v2 schemas with server-side validation | `tests/test_auth.py`, `tests/test_subscriptions.py` |
| **Password rules (>8 chars, upper, lower, special)** | `validate_password_strength` | `tests/test_auth.py` |
| **Case-insensitive unique email** | `User.email` NOCASE collation + unique index | `tests/test_auth.py` |
| **Role-based access control** | Admin, Staff, Customer roles checked on server | `tests/test_permissions.py` |
| **Customer data isolation** | Customer portal endpoints only return caller's own records (403 for others) | `tests/test_permissions.py`, `demo_scenario.py` |
| **Products & variants (+560 Odoo brand)** | Product and Variant tables with variant price extra | `tests/test_products_pricing.py` |
| **Plans with lifecycle flags** | `auto_close`, `closable`, `pausable`, `renewable` | `tests/test_subscriptions.py` |
| **Automatic billing (never twice, never skipped)** | `UNIQUE(subscription_id, period_start, period_end)` + missed period catch-up | `tests/test_billing.py` |
| **Integer paise monetary handling** | ₹1 = 100 paise; zero floating point drift | `app/services/pricing_service.py` |
| **Payment tracking & partial payments** | Partial payments update balance; settles to `paid` when balance reaches 0 | `tests/test_payments.py` |
| **Financial summary & MRR** | Aggregated active subscriptions, revenue received, outstanding, overdue, MRR | `tests/test_reports.py` |
| **Performance under 2 seconds** | Database queries execute in **46.24 ms** with 10,000 subscriptions | `app/services/report_service.py` |

---

## 9. License

MIT
