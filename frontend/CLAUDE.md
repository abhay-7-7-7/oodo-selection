# CLAUDE.md — Brightloop Frontend Guidelines

Brightloop is an enterprise software subscription management and recurring billing platform built with React 19, Vite, TypeScript, and Tailwind CSS v4.

## Stack & Architecture
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Routing**: `react-router` with role-based routing and customer portal isolation
- **Data & API Layer**: `src/services/apiClient.ts` (54-endpoint spec) and `src/services/mockStore.ts` (reactive localStorage)
- **UI & Primitives**: Base UI (`@base-ui/react`), Lucide React, Tailwind CSS v4
- **Charts**: Recharts
- **Notifications**: Sonner

## Core Commands
- `pnpm dev`: Start local development server
- `pnpm build`: Compile TypeScript and build production bundle
- `tsc --noEmit`: Strict type checking
