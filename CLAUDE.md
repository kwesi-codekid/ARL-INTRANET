# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ARL Intranet - Internal intranet portal for Adamus Resources Limited, a mining company in Ghana. Full-stack React Router v7 application with SSR, replacing an existing WordPress-based intranet.

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
```

## Tech Stack

- **Framework:** React Router v7.12 (full-stack with SSR)
- **React:** v19.2
- **UI:** HeroUI (formerly NextUI), Framer Motion, Lucide icons
- **Styling:** TailwindCSS v4 with custom brand theme
- **Build:** Vite v7
- **Database:** MongoDB with Mongoose v9
- **Auth:** Two-track auth system (see below)
- **Rich Text:** TipTap editor
- **File Storage:** Cloudinary
- **Date/Time:** Luxon

## Architecture

```
app/
├── components/
│   ├── admin/           # Admin-specific components (RichTextEditor, forms)
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

### Imports & Exports

- **Path alias:** `~/` maps to the `app/` directory (e.g., `import { Header } from "~/components/layout"`)
- **Named exports** with `index.ts` barrel files for components

### Server-Only Files & Dynamic Imports (Critical)

Files ending in `.server.ts` are server-only. **All `.server.ts` imports in route files must use dynamic `import()` inside loaders/actions**, not static imports at the top of the file. Static imports of `.server.ts` files in route modules will break the build.

```typescript
// CORRECT - dynamic import inside loader/action
export async function loader({ request }: Route.LoaderArgs) {
  const { requireAuth } = await import("~/lib/services/session.server");
  const { connectDB } = await import("~/lib/db/connection.server");
  const { NewsModel } = await import("~/lib/db/models/news.server");
  await connectDB();
  // ...
}

// WRONG - static import at module level
import { requireAuth } from "~/lib/services/session.server"; // breaks build
```

### Database Access

Services must call `connectDB()` before any database operations:
```typescript
const { connectDB } = await import("~/lib/db/connection.server");
await connectDB();
```

### Two-Track Authentication System

**Admin auth** (cookie session via `session.server.ts`):
- Cookie: `__arl_session`, TTL: 7 days
- `requireAuth(request)` — redirects to `/admin/login` if not authenticated
- `requireSuperAdmin(request)` — requires superadmin role
- `getUser(request)` — returns user or null (no redirect)
- `getSessionData(request)` — lightweight session info without DB lookup

**Portal user auth** (JWT-based via `user-auth.server.ts`):
- Cookies: `__arl_user_access` + `__arl_user_refresh`
- OTP-based login (phone SMS or email)
- `getCurrentUser(request)` — returns portal user or null

### Route Protection via Layout Gates

- **`routes/admin.tsx`** — layout loader calls `requireAuth()` for all admin routes (except `/admin/login` and `/admin/logout`)
- **`routes/_public.tsx`** — wraps public routes with maintenance mode check, provides `portalUser` context to children via `useOutletContext<PublicOutletContext>()`

### Route Configuration

Routes are defined centrally in `app/routes.ts` using React Router's route config API, not file-based routing. Public routes are nested under the `_public.tsx` layout; admin routes under `admin.tsx`.

### Form Handling

- Use React Router `<Form>` component
- Actions process submissions via `request.formData()`
- Track submission state with `useNavigation()` (`navigation.state === "submitting"`)
- File uploads via FormData: `formData.get("fieldName") as File`

### File Uploads (Cloudinary)

- Upload service: `~/lib/services/upload.server.ts`
- Methods: `uploadImage(file, subdir)`, `uploadVideo(file, subdir)`
- Limits: images 5MB, videos 100MB, PDFs 20MB, documents 50MB
- Responsive image helpers in `~/lib/utils/cloudinary-media.ts`: `getResponsiveUrl()`, `generateSrcSet()`, `generateSizes()`

### Brand Colors

Primary gold (#d2ab67 / #c7a262), secondary dark (#1a1a1a), safety colors defined in `app.css`. Based on Nguvu Mining brand guidelines.

## Environment Variables

Copy `.env.example` to `.env`. Key variables:
- `MONGODB_URI` — MongoDB connection string
- `SESSION_SECRET` — Secret for cookie sessions
- `SMS_API_KEY`, `SMS_USERNAME` — For OTP SMS delivery

## Project Documentation

- `PROJECT_PLAN.md` — Detailed 4-phase project plan with all features
- `WBS.md` — Work Breakdown Structure with task tracking and status
- `docs/DEPARTMENTS.md` — Department structure and codes
