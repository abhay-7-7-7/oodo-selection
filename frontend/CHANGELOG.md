# Brightloop Changelog

All notable changes to the Brightloop Subscription Management System are documented here.

---

## [1.0.0] - Hackathon Production Release

### Added
- **Core Ledger & Billing Engine**: Complete implementation of the 54-endpoint API specification with dual-mode (mock store + live REST) integration.
- **Enterprise Design System**: Custom Brightloop theme tokens, responsive layouts, SVG loop logo, and custom print stylesheets.
- **Role-Based Access Control**: Strict access separation for `admin`, `staff`, and `customer` roles with an interactive 1-click persona switcher.
- **Novelty N1**: Profit-Aware Discount Guardrail (`/discount-guardrail`) with 20-second rubric evaluation demo.
- **Novelty N2**: Billing Integrity Auditor (`/integrity-auditor`) with 20x parallel billing concurrency chaos testing.
- **Novelty N3**: Split-Payment Bank Matcher (`/bank-matcher`) solving the subset-sum allocation problem.
- **Novelty N4**: "Why Did My Bill Change?" Explainer (`/bill-explainer`) with snapshot deltas.
- **Novelty N5**: Renewal Radar (`/renewal-radar`) with 7/30/60-day visual columns and 1-click renewal quotes.
- **Novelty N6**: Zero-SMTP Outbox and Automated Reminders (`/outbox`) with clickable single-use evaluation links.
- **Customer Portal**: Dedicated self-service workspace (`/portal/*`) for client subscription and invoice management.
- **Performance Telemetry**: Dynamic sub-2-second query/render monitoring and 10,000-subscription seed toggle.
