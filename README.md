# Brightloop — Enterprise Subscription Management & Recurring Billing Platform

A unified, financial-grade software subscription management, recurring billing, and revenue intelligence platform engineered for SaaS finance teams, sales operations, and customer self-service.

> **Status:** Full-stack integration complete. Features a high-performance **FastAPI + SQLite (WAL Mode)** backend paired with a modern **React 19 + TypeScript + Vite + Tailwind CSS v4** frontend implementing 50+ API inventory endpoints, 6 novelties, automated customer tenant isolation, and automated CI/CD pipelines.

---

## 1. System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │       React 19 Frontend (Vite 6)        │
                  │  28 Responsive Views + Customer Portal  │
                  └────────────────────┬────────────────────┘
                                       │
                                       │ HTTP / HTTPS JSON Requests
                                       │ (Vite Proxy: /api -> :8000)
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │   Centralized API Client (apiClient)    │
                  │  JWT Bearer Auth, Error Normalization   │
                  └────────────────────┬────────────────────┘
                                       │
                                       │ Authorization: Bearer <JWT>
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │           FastAPI REST Server           │
                  │  Port 8000, Pydantic v2 Schema Engine   │
                  └────────────────────┬────────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
   │ Authentication  │        │ Business Logic  │        │  Role & Tenant  │
   │ & Password Hash │        │ Pricing/Billing │        │  Data Isolation │
   │ (bcrypt + JWT)  │        │ (Integer Paise) │        │ (Strict IDOR)   │
   └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          SQLAlchemy 2.0 ORM             │
                  │  Unit-of-Work Transactions & Constraints │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          SQLite Database                │
                  │  WAL Mode, 5000ms Timeout, Integer Paise│
                  └─────────────────────────────────────────┘
```

---

## 2. Problem & Executive Overview

Brightloop sells software across daily, weekly, monthly, and annual subscription cycles. Traditionally, subscriptions live in disconnected spreadsheets where renewals are missed, invoices are manually entered, split payments are matched by hand, and recurring revenue calculations suffer from floating-point errors.

This project delivers a unified, production-ready system replacing that workflow:
- **Zero Floating-Point Drift:** Precise integer paise currency arithmetic (₹1 = 100 paise) across all pricing, discounts, taxes, and invoicing.
- **Anti-Double-Billing Safeguards:** Enforced `UNIQUE(subscription_id, period_start, period_end)` database constraint with automatic missed-period catch-up.
- **Strict Customer Tenant Isolation:** Server-side IDOR validation ensuring customer users cannot access or mutate subscriptions, invoices, payments, or profiles belonging to other tenants.
- **Enterprise Self-Service:** Complete Customer Portal for self-service invoice inspection, payments, and plan management.
- **Sub-50ms Analytics at Scale:** Dynamic reporting engine evaluated on a 10,000-subscription dataset in **46.24 ms** (well within the < 2,000 ms SLA requirement).

---

## 3. 📁 Repository Structure

```
.
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI: Pytest, Customer Isolation, Frontend Build, E2E Demo
│       └── security.yml          # Security: Secret leak detection & dependency auditing
├── backend/                      # FastAPI + SQLAlchemy 2.0 + SQLite application
│   ├── app/                      # Application code (routers, models, schemas, services, core)
│   ├── scripts/                  # High-performance 10k database seeder & E2E demo scenario
│   ├── tests/                    # Pytest test suite (50 tests including customer isolation)
│   ├── API_DOCUMENTATION.md      # Complete schema, endpoints, and curl examples
│   ├── requirements.txt          # Python dependencies
│   └── README.md                 # Detailed backend guide
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS v4 application
│   ├── src/                      # Components, layouts, views, state, and services
│   │   ├── views/                # 28 pages across Admin, Finance, Sales, Intelligence, Portal
│   │   ├── services/apiClient.ts # Centralized REST API client (JWT Bearer auth)
│   │   ├── types/                # Strict TypeScript interfaces matching the API contract
│   │   └── utils/                # Shared financial calculation helpers
│   ├── package.json              # Frontend dependencies
│   └── vite.config.ts            # Vite proxy configuration (/api -> http://localhost:8000)
└── docs/                         # Shared specifications and API contracts
    ├── api-contract.md           # API endpoint inventory and schemas
    └── mock-json/                # Reference payload fixtures
```

---

## 4. 🌟 Novelty Features (N1 – N6)

Brightloop incorporates six purpose-built novelty capabilities accessible directly from the management interface:

1. **N1: Profit-Aware Discount Guardrail (`/discount-guardrail`)**
   - Evaluates prospective discounts against minimum margin thresholds and maximum discount ceilings.
   - Triggers automated two-level management approval workflows when guardrails are breached, preventing revenue leakage.
   - Includes an interactive 20-second evaluation demo.

2. **N2: Subscription & Billing Integrity Auditor (`/integrity-auditor`)**
   - Continuously audits database records to detect phantom subscriptions, mismatched invoice periods, and orphaned transactions.
   - Features a live **🔥 20x Parallel Concurrency Chaos Test** demonstrating race-condition resilience and transaction isolation under load.

3. **N3: Split-Payment Bank Matcher (`/bank-matcher`)**
   - Solves the NP-hard subset-sum allocation problem to match incoming lump-sum bank statement transfers against multiple outstanding invoices.
   - Generates confidence scores, highlights fee variances, and enables single-click multi-invoice reconciliation.

4. **N4: "Why Did My Bill Change?" Explainer (`/bill-explainer`)**
   - Generates human-readable, transparent audit diffs between consecutive billing cycles.
   - Explains prorations, plan upgrades, consumption adjustments, and expired promotional discounts with timeline visualization.

5. **N5: Renewal Radar (`/renewal-radar`)**
   - Multi-horizon visual forecasting pipeline categorizing impending subscription expirations into 7-day, 30-day, and 60-day windows.
   - Calculates dynamic churn risk scores based on overdue dunning history and payment trends, with 1-click renewal quotation generation.

6. **N6: Zero-SMTP Outbox and Automated Reminders (`/outbox`)**
   - In-app email dispatch simulator eliminating external SMTP dependencies during evaluation.
   - Records all password reset tokens, quotation delivery notices, payment receipts, and dunning alerts with single-use evaluation links.

---

## 5. 🔒 Security & Customer Data Isolation

### In-Depth IDOR & RBAC Protection
- **Role-Based Access Control:** All routes verify JWT tokens and enforce strict role boundaries (`admin`, `staff`, `customer`). Admin-only endpoints reject staff with HTTP 403 Forbidden.
- **Automatic Query Scoping:** Customer portal endpoints (`/api/portal/*`) automatically scope queries to the authenticated `current_user.id`.
- **Server-Side IDOR Rejection:** Direct entity lookups (`/api/subscriptions/{id}`, `/api/invoices/{id}`, `/api/customers/{id}`) verify ownership. If a customer attempts to query or mutate an entity owned by another customer, the server immediately rejects the request with **HTTP 403 Forbidden**.
- **Mass-Assignment Defense:** Customer profile updates strictly allow name, phone, and company; role, email, password, and permissions cannot be altered via self-service APIs.
- **Dedicated Automated Isolation Suite:** `backend/tests/test_customer_isolation.py` proves 100% rejection across 5 tenant cross-contamination attack vectors:
  1. Customer A cannot view Customer B's subscription details (403 Forbidden).
  2. Customer A cannot view or print Customer B's invoice (403 Forbidden).
  3. Customer A cannot inspect Customer B's payment transactions (0 items returned).
  4. Customer A cannot mutate Customer B's profile (403 Forbidden).
  5. Customer A cannot transition subscription status or record payments (403 Forbidden).

---

## 6. 👤 Default Demo Accounts & Personas

The platform includes pre-configured personas for testing and evaluation:

| Role | Email | Password | Allowed Capabilities |
|---|---|---|---|
| **Admin** | `admin@brightloop.io` / `admin@brightloop.com` | `AdminPassword@2026` | Full platform access, staff management, settings, financial reports, all novelties |
| **Staff** | `sarah@brightloop.io` / `anjali@brightloop.com` | `StaffPassword@2026` | Quotations, catalog management, customer accounts, subscriptions, invoices, payments |
| **Customer** | `ravi@techcorp.in` / `rahul@example.com` | `Brightloop@2026` | Customer self-service portal (`/portal/*`), view owned subscriptions, invoices, and payments |

> **Tip for Evaluators:** The frontend includes a **1-Click Persona Switcher** in the top navigation header and on the login page to instantaneously switch between Admin, Staff, and Customer contexts without retyping credentials.

---

## 7. 🚀 Getting Started

### Prerequisites
- **Python 3.11+** and `pip`
- **Node.js 20+** and `npm`

---

### Step 1: Start the Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install Python dependencies
python -m pip install -r requirements.txt

# 3. Seed the database with demo personas and realistic data
python scripts/seed.py --reset 1000

# 4. Start the FastAPI development server
python -m uvicorn app.main --reload --host 0.0.0.0 --port 8000
```

- **Interactive API Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Base API Endpoint:** `http://localhost:8000/api`

---

### Step 2: Start the Frontend

Open a second terminal window:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

- **Application URL:** [http://localhost:5173](http://localhost:5173)
- **Customer Portal:** [http://localhost:5173/portal](http://localhost:5173/portal)

---

## 8. 🧪 Testing & Verification

### Run Complete Backend Test Suite (50 Tests)
```bash
cd backend
python -m pytest tests -v
```

### Run Customer Isolation Verification Specifically
```bash
cd backend
python -m pytest tests/test_customer_isolation.py -v
```

### Run End-to-End Acceptance Scenario
```bash
python backend/scripts/demo_scenario.py
```

### Run Frontend Typecheck & Production Build
```bash
cd frontend
npm run build
```

---

## 9. 🤖 Automated CI/CD Pipelines

The repository features comprehensive GitHub Actions workflows under `.github/workflows/`:

1. **`ci.yml` (Continuous Integration Pipeline):**
   - **Backend Job:** Tests on Python 3.11 with pytest, validating 50 unit and integration tests including tenant isolation.
   - **Frontend Job:** Builds React bundle on Node 20 with `npm run build` (`tsc && vite build`).
   - **E2E Integration Job:** Executes `backend/scripts/demo_scenario.py` verifying the full business workflow (signup -> quotation -> confirm -> subscription -> billing run -> invoice -> partial payment -> full settlement).

2. **`security.yml` (Security & Vulnerability Audit):**
   - **Gitleaks Scanner:** Detects accidentally committed secrets or tokens.
   - **Dependency Vulnerability Scan:** Runs `pip-audit` on Python packages and `npm audit` on frontend packages.

---

## 10. 📄 License & Attribution

This project is licensed under the MIT License. See [frontend/LICENSE](./frontend/LICENSE) for third-party open-source attribution details.
