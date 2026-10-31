# Brightloop Software — Backend Service

Backend service for Brightloop Software's subscription management and recurring billing platform.

## Checkpoint 1 (H1) Scope — Foundation & Customer Signup

This repository checkpoint contains the foundational architecture and initial customer signup implementation:
- **S1 — Project Foundation:** Modular FastAPI backend architecture, environment configuration, database engine setup with SQLite WAL mode and foreign key enforcement, and git ignore hygiene.
- **S2 — API Contract & Mock JSON:** Formal API agreement for all 42 core endpoints (`docs/api-contract.md`) and mock JSON fixtures (`docs/mock-json/`) enabling independent frontend parallel development.
- **B1 — Database Schema & Models:** Complete SQLAlchemy models for all 12 core business entities (`users`, `products`, `variants`, `plans`, `taxes`, `discounts`, `quotation_templates`, `subscriptions`, `subscription_lines`, `invoices`, `invoice_lines`, `payments`, `outbox`, `subscription_audit`, `settings`) including the critical anti-double-billing uniqueness constraint:
  ```sql
  UNIQUE(subscription_id, period_start, period_end)
  ```
- **A1 — Customer Signup:** Secure signup endpoint (`POST /api/auth/signup`) featuring case-insensitive email deduplication, bcrypt password hashing, and strong password validation (>= 9 characters, uppercase, lowercase, special character).

---

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   └── auth.py             # Authentication endpoints (POST /signup)
│   ├── core/
│   │   ├── exceptions.py       # Custom domain exceptions
│   │   ├── permissions.py      # Role-based access control helpers
│   │   ├── security.py         # Password validation and bcrypt hashing
│   │   └── dependencies.py     # FastAPI dependencies (DB session, current user)
│   ├── models/                 # SQLAlchemy ORM models (B1)
│   │   ├── audit.py
│   │   ├── discount.py
│   │   ├── invoice.py          # Includes UNIQUE(subscription_id, period_start, period_end)
│   │   ├── outbox.py
│   │   ├── payment.py
│   │   ├── plan.py
│   │   ├── product.py
│   │   ├── quotation.py
│   │   ├── settings.py
│   │   ├── subscription.py
│   │   ├── tax.py
│   │   └── user.py
│   ├── schemas/                # Pydantic request/response schemas
│   │   ├── auth.py
│   │   └── common.py
│   ├── services/               # Business logic services
│   │   └── auth_service.py     # Customer signup logic & validation
│   ├── config.py               # Pydantic Settings & environment variables
│   ├── database.py             # SQLite engine with WAL & PRAGMA foreign_keys
│   └── main.py                 # FastAPI application factory & lifespan
├── tests/
│   ├── conftest.py             # Test database isolation fixtures
│   ├── test_auth.py            # Signup validation and conflict tests
│   └── test_models.py          # B1 schema & anti-double-billing constraint tests
├── .env.example                # Example environment variables
├── .gitignore                  # Backend specific git ignore
├── requirements.txt            # Python dependencies
└── README.md                   # This documentation
```

---

## Getting Started

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Git

### 2. Environment Setup

Create and activate a virtual environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:
```bash
pip install -r requirements.txt
```

### 3. Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Default configuration in `.env.example`:
```ini
PROJECT_NAME="Brightloop Software Backend"
VERSION="0.1.0"
API_V1_STR="/api"
SECRET_KEY="replace-this-in-production-with-a-secure-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite:///./brightloop.db"
CORS_ORIGINS="*"
```

### 4. Running the Application

Start the local development server:
```bash
uvicorn app.main:app --reload --port 8000
```

The interactive OpenAPI documentation will be available at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/api/health`

---

## Running Automated Tests

Run the test suite using `pytest`:
```bash
# From the repository root
python -m pytest backend/tests/ -v

# Or from within the backend directory
pytest tests/ -v
```

All 9 tests verify:
- Valid customer signup returns 201 with cleansed response (no password or hash leak)
- Duplicate email rejection with 409 Conflict
- Case-insensitive email duplicate rejection (e.g. `User@EXAMPLE.COM` vs `user@example.com`)
- Password strength rejection (too short, missing uppercase, missing lowercase, missing special character) with 422 Unprocessable Entity
- ORM model instantiation for all core entities
- Database-level anti-double-billing unique constraint `UNIQUE(subscription_id, period_start, period_end)` on the `invoices` table
