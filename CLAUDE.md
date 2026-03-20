# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Copy (النسخة)** — Arabic drama analysis and screenplay development platform. A pnpm monorepo with 13 specialized applications for screenwriters, directors, actors, and production teams.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development (frontend + backend)
pnpm dev                    # Both web (port 5000) + backend (port 3000)
pnpm dev:web                # Frontend only
pnpm dev:backend            # Backend only

# Build & CI
pnpm build                  # Turborepo build all
pnpm ci                     # Full pipeline: lint → type-check → test → build
pnpm lint                   # ESLint across all packages
pnpm type-check             # TypeScript validation

# Testing
pnpm test                   # Vitest across all packages
pnpm --filter @the-copy/web test              # Frontend unit tests
pnpm --filter @the-copy/backend test          # Backend unit tests
pnpm --filter @the-copy/web e2e               # Playwright E2E tests

# Single test file
pnpm --filter @the-copy/web exec vitest run path/to/test.ts
pnpm --filter @the-copy/backend exec vitest run path/to/test.ts

# Backend database
pnpm --filter @the-copy/backend db:generate   # Generate Drizzle migrations
pnpm --filter @the-copy/backend db:push       # Push schema to Neon
pnpm --filter @the-copy/backend db:studio     # Drizzle Studio UI

# Services (Windows PowerShell)
pnpm start                  # Start all services (frontend + backend + Redis)
pnpm stop                   # Kill all dev ports

# Cleanup
pnpm clean                  # Remove build artifacts and node_modules
```

## Architecture

### Monorepo Structure

- **`apps/web/`** — Next.js 16 + React 19 frontend (port 5000). App Router, Tailwind CSS v4 (OKLCH), 42 path aliases (`@the-copy/*`).
- **`apps/backend/`** — Express.js 5.1 API (port 3000). Drizzle ORM → Neon PostgreSQL, Redis + BullMQ queues, JWT auth.
- **`packages/shared/`** — Shared utilities exported as `./ai`, `./db`, `./auth`, `./types`, `./schemas`, `./cache`, `./utils`.
- **`packages/ui/`** — Reusable UI component library (Radix/Shadcn).
- **`packages/tsconfig/`** — Shared TypeScript configurations.
- **13 domain packages** in `packages/`: `actorai`, `art-director`, `brain-storm-ai`, `breakapp`, `breakdown`, `budget`, `cinefit`, `cinematography`, `creative-writing`, `directors-studio`, `editor`, `prompt-engineering`, `styleist`.

### Key Technical Details

- **Package manager**: pnpm 10.32.1 (enforced via `packageManager` field)
- **Workspace**: `apps/*` + `packages/*` (defined in `pnpm-workspace.yaml`)
- **Turborepo**: Tasks cascade via `^build` dependency. `.env` is a global dependency.
- **Frontend TypeScript**: Strict mode, path aliases for all packages
- **Backend TypeScript**: Strict disabled (`strict: false`), CommonJS output, aliases `@/` → `src/`
- **AI stack**: Google Gemini (primary), Groq, Genkit, LangChain, Anthropic SDK, OpenAI SDK
- **Observability**: Sentry 10.x (frontend + backend), OpenTelemetry, Prometheus
- **Editors**: TipTap 3.0 (Pro registry via `.npmrc`), Monaco, ProseMirror
- **Animation**: GSAP + ScrollTrigger, Framer Motion, Three.js

### Filtering Packages

Use Turborepo filter to target specific packages:
```bash
pnpm --filter @the-copy/web <command>
pnpm --filter @the-copy/backend <command>
pnpm --filter @the-copy/shared <command>
```

## Systematize Workflow

This project uses the **Systematize KIT** for feature governance. Features live in `aminooof/` with numbered branches (e.g., `001-v-formation-split-entry`, `002-audit-platform-apps`).

**Workflow**: `sys → clarify → constitution → research → plan → tasks → implement`

```bash
# Create a new feature
node .Systematize/scripts/node/cli.mjs create-feature "Feature description" --json
pwsh -File .Systematize/scripts/powershell/create-new-feature.ps1 "Feature description" -Json

# Health check
node .Systematize/scripts/node/cli.mjs healthcheck
```

- **`commands/`** — Syskit command definitions (agent instructions for each phase)
- **`.Systematize/templates/`** — Document templates (sys, plan, research, tasks, constitution)
- **`.Systematize/memory/constitution.md`** — Project governance rules and traceability registry
- **`aminooof/<feature>/`** — Feature artifacts (sys.md, plan.md, tasks.md, research.md, contracts/)

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `ci.yml` — Main pipeline (lint, type-check, test, build)
- Firebase hosting deployment on merge/PR
- Neon database workflows
- Security scans: CodeQL, Trivy, Bearer, DevSkim, Snyk

## Code Style

- Prefer the Systematize workflow for new features
- Follow existing conventions in each app (strict TS in frontend, relaxed in backend)
- The frontend excludes several legacy directories from TypeScript compilation (editor/, art-director/, BUDGET/, breakdown/)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
