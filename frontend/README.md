# Brightloop — Enterprise Subscription Management & Recurring Billing Platform

Brightloop is a software subscription management, recurring billing, and revenue intelligence platform engineered for SaaS finance teams, sales operations, and customer self-service.

---

## 🚀 Quick Start for Hackathon Evaluators

Brightloop features a **1-click Persona Switcher** built directly into both the top navigation header and the login page, allowing evaluators to review the application from multiple role perspectives without repeatedly signing in and out:

| Persona | Name | Role | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | Alex Vance | `admin` | Full system control, staff invitation, catalog pricing, promotional discount rule creation, margin floor setting, and system factory reset. |
| **Internal Staff** | Sarah Jenkins | `staff` | Sales workflows, customer management, quotation creation, quotation conversion, manual invoice confirmation, and payment reconciliation. |
| **Customer** | Ravi Patel | `customer` | Isolated client portal (`/portal`), own subscription reviews, invoice inspection, bill change explanations, and 1-click subscription renewals. |

---

## 🌟 6 Hackathon Novelty Features

Brightloop implements all 6 required novelty specifications:

### 1. N1: Profit-Aware Discount Guardrail (`/discount-guardrail`)
* **What it does**: Simulates the exact profit margin impact of promotional discounts before sales reps apply them to quotations or subscriptions.
* **Rubric Highlight**: Features an interactive 20-second evaluation demo. When a discount forces unit margins below the administrative margin floor (default 15%), it triggers a warning requiring override; when unit profit drops below ₹0, the engine issues a hard block.

### 2. N2: Subscription & Billing Integrity Auditor (`/integrity-auditor`)
* **What it does**: Continuously monitors ledger invariants:
  1. Exactly 1 invoice per elapsed calendar period (anti-double-billing).
  2. Invoice header total strictly equals the mathematical sum of line items.
  3. Total payments recorded never exceed the invoice grand total.
* **Concurrency Chaos Test**: Includes a **🔥 20x Parallel Billing Chaos Button**. Dispatches 20 concurrent billing run requests simultaneously to prove that the database `UNIQUE(subscription_id, period_start, period_end)` constraint intercepts all race conditions with **0 duplicate invoices created**.

### 3. N3: Split-Payment Bank Matcher (`/bank-matcher`)
* **What it does**: Matches uploaded bank deposits against accounts receivable using a dynamic programming **subset-sum algorithm**.
* **Rubric Highlight**: Preloaded with a demonstration deposit of **₹23,600** from TechCorp that settles multiple open invoices simultaneously with confidence scoring and 1-click batch payment execution.

### 4. N4: "Why Did My Bill Change?" Explainer (`/bill-explainer`)
* **What it does**: Diffs any recurring subscription invoice against its preceding billing cycle's immutable JSON snapshot.
* **Rubric Highlight**: Generates natural language summary sentences (e.g. *"+₹560: Odoo Brand variant added; +₹100.80 tax adjustment"*) with side-by-side Before/After cards and itemized variance tables.

### 5. N5: Renewal Radar (`/renewal-radar`)
* **What it does**: Proactive churn and expiry board categorized into 7-Day Critical, 30-Day High, 60-Day Medium, and Expired columns.
* **Rubric Highlight**: Includes a 1-click **"Create Renewal Quote"** button that automatically duplicates lines and terms into an approved quotation.

### 6. N6: Automatic Reminder Emails & Outbox (`/outbox`)
* **What it does**: Automated dunning and invoice reminder engine with zero-SMTP offline evaluation capability.
* **Rubric Highlight**: All system communications (overdue dunning, upcoming due notices, password reset tokens) are viewable and auditable directly in the in-app Outbox. Password reset links are clickable directly from the table to facilitate seamless evaluation without email servers.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript (Strict Type Safety)
- **Build Engine**: Vite (sub-second HMR and production bundle optimization)
- **Styling**: Tailwind CSS v4 + Brightloop FinTech Design System Tokens
- **Icons**: Lucide React
- **Charts**: Recharts
- **Components**: Primitive components based on `@base-ui/react` and accessible dialogs
- **Notifications**: Sonner

---

## 📦 Project Setup & Scripts

```powershell
# Install dependencies
pnpm install

# Run local development server
pnpm dev

# Type check
pnpm tsc --noEmit

# Production build
pnpm build
```

---

## 🏛️ Architecture & API Integration

Brightloop features a **dual-mode API architecture** located in `src/services/apiClient.ts` and `src/services/mockStore.ts`:
- **Offline / Evaluation Mode**: Persistent in-memory reactive store backed by `localStorage` with relational seed data (customers, products with +₹560 Odoo brand variants, plans with lifecycle flags, tax schedules, discounts, invoices, payments, and bank feeds).
- **Production REST Mode**: Directly targets any backend implementing the 54-endpoint specification by pointing `VITE_API_URL` to the target service.

---

## 📄 License & Attribution

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for third-party open-source attribution details.
