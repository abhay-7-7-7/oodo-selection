# Contribution

Two-person team, 8-hour hackathon build. This is who did what, taken from the Git history.

| Member | GitHub | Commits under this account | Main area |
|---|---|---|---|
| Abhay | [@abhay-7-7-7](https://github.com/abhay-7-7-7) | 18 (3 made through the GitHub web editor, shown as "freeze") | Backend, six novelty features, notifications, integration, documentation |
| Jenny | [@jenny4906](https://github.com/jenny4906) | 6 | Frontend application, header notifications |

## Note on commit attribution

The six novelty modules (commits `265f7ea` and `1413766`) were written by Abhay while working on Jenny's machine and were committed from her GitHub account, so they appear under @jenny4906 in the history. Everything else is attributed to the account that made the commit.

## Abhay: backend, novelties and delivery

- Designed the database schema and built the FastAPI backend: authentication with JWT and roles, products, variants, plans, taxes, discounts, quotations, subscriptions, billing, invoices, payments and reports.
- Wrote the 10,000-subscription seed script, the API documentation and the API contract used by both of us.
- Built the automated test suite (60 tests) and the CI pipelines.
- Connected the frontend to the backend, including customer data isolation so a customer sees only their own records.
- Built the role-based layouts, sidebar navigation and core module pages (customers, notifications and others).
- Fixed UI and authentication issues found during integration.
- Built all six novelty features, each with backend logic, frontend screen, tests and documentation: discount guardrail, bill explainer, integrity auditor, bank matcher, renewal radar and reminder centre (committed from Jenny's machine, see the note above).
- Integrated the six novelties into the main backend and frontend: 47 files, with routes, navigation and fixes so they work with the live API.
- Built the notification system: the notifications backend and database model, the notification centre page, and the customer portal notifications page.
- Merged backend and novelty work into `main`, and wrote the README and differentiator sections.

## Jenny: frontend

- Built the frontend application on an open-source admin template: layouts, components and screens covering the full API.
- Built the header notifications dropdown in the frontend layout.
- Fixed backend dependency issues found while running the project (`pydantic-settings`, `email-validator`).
- Edited the README.

## Shared

- Problem analysis, feature planning and the choice of the six novelties.
- Agreeing the API contract so frontend and backend could be built at the same time.
- Feature branches and pull requests, with commits from both accounts throughout the build.

## Tools and AI assistance

We used Claude to help plan the project, draft the README and demo script, and generate the demo voice-over. Code was written and integrated by the two of us, and the automated tests verify it.
