# Brightloop — Novelty Modules Integration Guide

This guide describes how to cleanly merge the independent novelty modules (`novelty_modules/`) into the main Brightloop application without breaking existing code.

---

## 1. Architecture Overview

During development, the novelty modules were intentionally isolated:
- **Backend:** FastAPI running on port 8001, isolated SQLite database (`novelty_modules.db`), standalone test suite (`novelty_modules/backend/tests`).
- **Frontend:** React 19 + Vite running on port 5174, independent router, isolated types and API client.

All endpoints adhere to the common prefix `/api/novelties/`.

---

## 2. Merging the Backend into the Main App

### Step 1: Copy Novelty Models, Schemas, Services, and Routers
Copy the novelty files into the main `backend/app/` hierarchy:
```bash
# Models
cp novelty_modules/backend/app/models/*.py backend/app/models/

# Schemas
cp novelty_modules/backend/app/schemas/*.py backend/app/schemas/

# Services
cp novelty_modules/backend/app/services/*.py backend/app/services/

# Routers
cp novelty_modules/backend/app/api/*.py backend/app/api/novelties/
```

### Step 2: Register Routers in `backend/app/main.py`
Add the novelty routers to the main FastAPI application:
```python
from app.api.novelties import (
    discount_guardrail,
    integrity_auditor,
    bank_matcher,
    bill_explainer,
    renewal_radar,
    reminder_centre,
)

prefix = "/api/novelties"
app.include_router(discount_guardrail.router, prefix=f"{prefix}/discount-guardrail", tags=["N1 Discount Guardrail"])
app.include_router(integrity_auditor.router, prefix=f"{prefix}/integrity-auditor", tags=["N2 Integrity Auditor"])
app.include_router(bank_matcher.router, prefix=f"{prefix}/bank-matcher", tags=["N3 Bank Matcher"])
app.include_router(bill_explainer.router, prefix=f"{prefix}/bill-explainer", tags=["N4 Bill Explainer"])
app.include_router(renewal_radar.router, prefix=f"{prefix}/renewal-radar", tags=["N5 Renewal Radar"])
app.include_router(reminder_centre.router, prefix=f"{prefix}/reminder-centre", tags=["N6 Reminder Centre"])
```

### Step 3: Switch Dependencies to Main Auth
In the copied router files:
Replace `from app.core.dependencies import get_current_token_user` with the main app's `get_current_active_user`. Both use compatible JWT payloads.

---

## 3. Merging the Frontend into the Main App

### Step 1: Copy Feature Views
Copy the novelty views into `frontend/src/views/` or `frontend/src/features/`:
- `novelty_modules/frontend/src/features/discount-guardrail/` -> `frontend/src/views/discounts/DiscountGuardrail.tsx`
- `novelty_modules/frontend/src/features/integrity-auditor/` -> `frontend/src/views/auditor/IntegrityAuditor.tsx`
- `novelty_modules/frontend/src/features/bank-matcher/` -> `frontend/src/views/payments/BankMatcher.tsx`
- `novelty_modules/frontend/src/features/bill-explainer/` -> `frontend/src/views/invoices/BillExplainer.tsx`
- `novelty_modules/frontend/src/features/renewal-radar/` -> `frontend/src/views/subscriptions/RenewalRadar.tsx`
- `novelty_modules/frontend/src/features/reminder-centre/` -> `frontend/src/views/settings/ReminderCentre.tsx`

### Step 2: Add Novelty Methods to Main `frontend/src/services/apiClient.ts`
Copy the methods from `novelty_modules/frontend/src/services/apiClient.ts` into the main client object.

### Step 3: Register Routes in Main `frontend/src/routes/Router.tsx`
Add routes inside the main layout:
```tsx
<Route path="/discount-guardrail" element={<DiscountGuardrail />} />
<Route path="/integrity-auditor" element={<IntegrityAuditor />} />
<Route path="/bank-matcher" element={<BankMatcher />} />
<Route path="/bill-explainer" element={<BillExplainer />} />
<Route path="/renewal-radar" element={<RenewalRadar />} />
<Route path="/reminder-centre" element={<ReminderCentre />} />
```

---

## 4. Verification

After merging:
1. Run backend tests:
   ```bash
   pytest -v backend/tests/
   ```
2. Run frontend type check and build:
   ```bash
   pnpm tsc --noEmit
   pnpm build
   ```
