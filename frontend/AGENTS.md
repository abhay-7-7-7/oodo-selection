# AGENTS.md — Brightloop Agent Reference

This document provides architectural context, entity relationships, and conventions for AI coding agents working on Brightloop.

---

## Project Identity & Architecture
- **Product**: Brightloop — Enterprise Subscription Management & Recurring Billing Platform
- **Framework**: Vite + React 19 + TypeScript + Tailwind CSS v4
- **Currency**: Indian Rupees (`₹` INR)
- **Routing**: `react-router` with internal management shell (`/`), isolated customer portal (`/portal/*`), and public auth (`/auth/*`).

---

## Key Modules & Routes
- `/dashboard`: Executive KPIs, Recharts revenue velocity, overdue dunning table.
- `/customers`: Accounts directory and multi-tab customer profile drawers.
- `/quotations` & `/quotation-templates`: Quotation builder with live margin check and 1-click subscription conversion.
- `/products`, `/product-variants`, `/subscription-plans`: Catalog with variant surcharges and plan behavior flags.
- `/taxes` & `/discounts`: Multi-rate GST tax schedules and administrative promotional rules.
- `/subscriptions` & `/subscriptions/:id`: Subscription lifecycle state machine with append-only audit log.
- `/invoices` & `/billing-runs`: Invoicing ledger and automated batch billing with double-billing prevention.
- `/payments`: Payment ledger with partial settlement support.
- `/reports`: Revenue velocity, Collections ledger, Overdue aging (A/R), and Subscription health reports with CSV export.
- `/staff`, `/outbox`, `/settings`: Role management, zero-SMTP outbox, and billing engine configuration.
- `/portal/*`: Customer self-service dashboard, subscriptions, invoices, and payments.

---

## The 6 Novelty Features
- **N1**: Profit-Aware Discount Guardrail (`/discount-guardrail`)
- **N2**: Billing Integrity Auditor with 20x parallel Chaos test (`/integrity-auditor`)
- **N3**: Split-Payment Bank Matcher with subset-sum algorithm (`/bank-matcher`)
- **N4**: "Why Did My Bill Change?" Explainer with snapshot deltas (`/bill-explainer`)
- **N5**: Renewal Radar with 7/30/60-day visual columns (`/renewal-radar`)
- **N6**: Zero-SMTP Outbox and Automated Reminders (`/outbox`)

---

## Coding Standards
- Maintain strict TypeScript type definitions in `src/types/index.ts`.
- All financial calculations must route through `src/utils/calculations.ts`.
- All data mutations must persist via `src/services/apiClient.ts` / `src/services/mockStore.ts`.
