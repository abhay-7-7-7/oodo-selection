# Subscription Management System

A unified platform for running plans, subscriptions and recurring billing for **Brightloop Software**: from product setup and quotations to automatic invoicing, payments and revenue reporting.

> Status: Hackathon build in progress. This README is updated every hour with the latest checkpoint.

## Problem

Brightloop sells software on monthly and yearly subscriptions. Today subscriptions live in spreadsheets, renewals are missed, invoices are typed by hand, payments are matched manually, and nobody knows the real recurring revenue. This project replaces that with one system.

## Team

| Member | Role | GitHub |
|---|---|---|
| TBD | Backend core (auth, RBAC, catalog),Dashboard, customer portal, seed data | @ |
| TBD | Billing (subscriptions, invoices, discounts, payments),Frontend (admin/staff UI | @ |

## Planned Features

### Must have (hackathon rubric)
- [ ] Real-time / dynamic data (live dashboard updates)
- [ ] Responsive, consistent UI
- [ ] Robust input validation (client and server)
- [ ] Intuitive navigation
- [ ] Proper Git usage by every team member

### Core functionality
- [ ] Sign up, login, password reset (unique email, strong password rules)
- [ ] Roles: Admin, Internal staff, Customer portal
- [ ] Products, variants (e.g. brand adds 560), plans (daily/weekly/monthly/yearly)
- [ ] Quotation templates and subscription lifecycle (Draft, Quotation, Confirmed, Active, Closed)
- [ ] Automatic invoice generation, never billed twice or skipped
- [ ] Tax rules and discount rules (admin only)
- [ ] Payment recording and outstanding/overdue tracking
- [ ] Finance dashboard (active subscriptions, revenue, payments, overdue) with filters, under 2 s per page

### Planned differentiators
1. **Idempotent billing engine** with dry-run preview and a simulated clock
2. **Live revenue command center** tested against 10k+ seeded subscriptions
3. **Explainable pricing**: every invoice line shows how its amount was calculated

### Nice to have
- [ ] Backend API with a local database
- [ ] Offline-capable customer portal
- [ ] Notes on design decisions and any adapted AI/code snippets

## Tech Stack

_To be decided._

| Layer | Choice |
|---|---|
| Backend | TBD |
| Database | TBD |
| Frontend | TBD |
| Auth | TBD |

## Getting Started

_Setup instructions will be added once the stack is chosen._

```bash
git clone <repo-url>
cd <repo-folder>
```

## Git Workflow

- Every member commits from their own account.
- Feature branches (`feat/...`, `fix/...`) merged through pull requests.
- Commit messages follow `type: short description` (e.g. `feat: add password validation`).
- Hourly checkpoints are tagged `checkpoint-1`, `checkpoint-2`, and so on.

## Progress Log

| Checkpoint | Time | What was done |
|---|---|---|
| 1 | 10:00 | Repo created, README added, problem analysed, features and differentiators planned |

## Design Decisions

_To be filled in as we build._

## License

MIT
