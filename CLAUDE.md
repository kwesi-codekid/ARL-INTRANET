# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ARL Intranet (ARL Intranet) - Internal intranet portal for Adamus Resources Limited, a mining company in Ghana. This is a full-stack React Router v7 application with SSR, replacing an existing WordPress-based intranet.

## Commands

```bash
# Development
npm run dev              # Start development server with HMR

# Build & Production
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run typecheck        # Generate types & run TypeScript check
npm run lint             # ESLint check on app/
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format all TS/TSX/CSS with Prettier
npm run format:check     # Check formatting without modifying

# Database
npm run db:seed          # Seed the database with initial data

# E2E Testing (Playwright)
npx playwright test                              # Run all E2E tests
npx playwright test --ui                         # Run tests in UI mode
npx playwright test tests/admin-login.spec.ts   # Run single test file

# Docker
docker build -t arl-intranet .
docker run -p 3000:3000 arl-intranet
```

## Tech Stack

- **Framework:** React Router v7.12 (full-stack with SSR)
- **React:** v19.2
- **UI:** HeroUI (formerly NextUI), Framer Motion, Lucide icons
- **Styling:** TailwindCSS v4 with custom brand theme
- **Build:** Vite v7
- **Database:** MongoDB with Mongoose v9
- **Auth:** OTP-based authentication with cookie sessions

## Architecture

```
app/
├── components/
│   ├── admin/           # Admin-specific components
│   ├── alerts/          # Alert banner and popup components
│   ├── dashboard/       # Homepage dashboard widgets
│   ├── layout/          # MainLayout, Header, Footer, Sidebars
│   └── ui/              # Reusable UI (LoadingSpinner, ErrorPage)
├── routes/              # Route components (configured in routes.ts)
├── routes.ts            # Central route configuration (not file-based)
├── lib/
│   ├── db/
│   │   ├── connection.server.ts  # MongoDB connection singleton
│   │   ├── models/               # Mongoose models (*.server.ts)
│   │   └── seeds/                # Database seeders
│   ├── services/                 # Business logic layer (*.server.ts)
│   └── utils/                    # Helper functions
├── providers/           # Context providers (HeroUIProvider)
├── root.tsx             # Root layout & error boundary
└── app.css              # Global styles & Tailwind theme
```

## Key Patterns

**Imports:** Use path alias `~/` for app directory (e.g., `import { Header } from "~/components/layout"`)

**Component exports:** Named exports with index.ts barrel files

**Server-only files:** Files ending in `.server.ts` are server-only and not bundled to the client. All database models and services use this convention.

**Database access:** Services must call `connectDB()` before any database operations:
```typescript
import { connectDB } from "~/lib/db/connection.server";
await connectDB();
```

**Route protection:** Use session helpers in loaders/actions:
- `requireAuth(request)` - Redirects to login if not authenticated
- `requireSuperAdmin(request)` - Requires superadmin role
- `getUser(request)` - Returns user or null (no redirect)

**Route configuration:** Routes are defined centrally in `app/routes.ts` using React Router's route config API, not file-based routing.

**Brand colors:** Primary gold (#d2ab67 / #c7a262), secondary dark (#1a1a1a), safety colors defined in app.css. Based on Nguvu Mining brand guidelines.

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `MONGODB_URI` - MongoDB connection string
- `SESSION_SECRET` - Secret for cookie sessions
- `SMS_API_KEY`, `SMS_USERNAME` - For OTP SMS delivery

## Project Documentation

- `PROJECT_PLAN.md` - Detailed 4-phase project plan with all features
- `WBS.md` - Work Breakdown Structure with task tracking and status
- `docs/DEPARTMENTS.md` - Department structure and codes
