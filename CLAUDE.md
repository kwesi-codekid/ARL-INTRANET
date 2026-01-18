# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ARL Intranet is a full-stack React Router v7 application for Adamus Resources Limited, a mining company. It uses server-side rendering (SSR) with Vite as the build tool.

## Commands

```bash
# Development
npm run dev              # Start dev server with HMR (http://localhost:5173)

# Linting & Formatting
npm run lint             # Check for linting issues
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting compliance

# Building & Production
npm run build            # Create production build
npm run typecheck        # Generate React Router types and check TypeScript
npm run start            # Serve production build

# Docker
docker build -t arl-intranet .
docker run -p 3000:3000 arl-intranet
```

**Note:** No test framework is currently configured.

## Architecture

### Framework Stack
- **React Router v7** - Full-stack framework with SSR enabled
- **Vite 7** - Build tool with HMR
- **TailwindCSS v4** - Styling with custom brand theme (Gold #D4AF37 / Navy #1B365D)
- **HeroUI** - Component library with React Router integration
- **TypeScript** - Strict mode enabled

### Project Structure
```
app/
├── components/          # Reusable React components
│   ├── dashboard/       # Dashboard-specific components
│   ├── layout/          # Layout components (Header, Footer, MainLayout)
│   └── ui/              # UI primitives (ErrorPage, LoadingSpinner)
├── lib/                 # Utilities and constants
│   ├── constants.ts     # Brand colors, navigation, departments
│   └── utils.ts         # Helper utilities
├── providers/           # Context providers
│   └── HeroUIProvider.tsx
├── routes/              # Route components
├── root.tsx             # Root layout and error boundary
└── routes.ts            # Route configuration
```

### Key Patterns
- **Path alias:** Use `~/` for absolute imports (maps to `./app/*`)
- **Index exports:** Component directories use `index.ts` for cleaner imports
- **Layout wrapper:** MainLayout wraps content with Header + Footer
- **Provider integration:** HeroUIProvider wraps app with React Router navigation support
- **Brand theming:** Colors defined in both `app.css` (CSS variables) and `lib/constants.ts` (TypeScript)

### Route Configuration
Routes are defined in `app/routes.ts` using React Router v7's file-based routing. Types are auto-generated in `.react-router/` directory.

## Code Style

- **Prettier:** Double quotes, semicolons, 2-space indentation, trailing commas (ES5)
- **ESLint:** TypeScript-ESLint with React Hooks plugin
- **Tailwind plugin:** prettier-plugin-tailwindcss auto-sorts utility classes

## Documentation Reference

- `docs/DEPARTMENTS.md` - Department codes and organizational hierarchy
- `PROJECT_PLAN.md` - Four-phase development plan and feature roadmap
- `WBS.md` - Work breakdown structure with task tracking
