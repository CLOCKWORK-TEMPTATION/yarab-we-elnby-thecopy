<todos title="Todos" rule="Review steps frequently throughout the conversation and DO NOT stop between steps unless they explicitly require it.">
- No current todos
</todos>

# Copilot Instructions for The Copy

- **Tooling**: Node 20.x, pnpm 10.20+. Monorepo workspace; always run pnpm commands (no npm/yarn).
- **Services**: Next.js 16 app on port 5000 in `frontend/`. Express/TypeScript API on port 3000 in `backend/`. Local Redis binary in `redis/`.
- **Bootstrapping**: `pnpm install`, then `pnpm start` (PowerShell starts app) or `pnpm start:dev` (dev stack). Redis only: `pnpm start:redis`; stop stack: `pnpm kill:dev`.
- **Frontend workflows** (run inside `frontend/`): `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint` / `pnpm lint:fix`, `pnpm test` (Vitest), `pnpm e2e` (Playwright). Prod build uses `NODE_ENV=production`.
- **Backend workflows** (run from repo root): `pnpm --filter @the-copy/backend dev|build|start|test|typecheck`. Database: `db:generate`, `db:push`, `db:studio` (Drizzle). MCP server: `pnpm --filter @the-copy/backend mcp`.
- **CI parity**: `pnpm ci` at root runs export checks → lint/typecheck/tests → build → remote-config check. Expected build warnings from Sentry/OpenTelemetry are approved; avoid "fixing" them unless truly new.
- **Architecture map**: App Router lives in `frontend/src/app/` with `(main)` routes for Director's Studio, Actor AI, and Card Scanner; shared UI in `frontend/src/components/`; state in Zustand stores and React Query. Animations via GSAP/Framer/Three. Backend follows controllers → services → db/queues; AI agents in `backend/src/services/agents/`.
- **Path aliases (frontend)**: `@/*` for src directory. Prefer absolute imports.
- **Response pattern (backend)**: Controllers return `{ success: boolean, data?, error? }` with Arabic user-facing messages and English logs; keep try/catch around async handlers.
- **RTL & localization**: UI is Arabic-first/RTL (Cairo font). Use logical CSS and ensure components render correctly in RTL. Shadcn/Radix is the design system.
- **State & data flow**: Client state via Zustand stores; server state via React Query; real-time updates with socket.io-client. Heavy UI effects use web workers in `frontend/src/workers/`.
- **AI pipeline**: Seven-agent drama analysis pipeline coordinated in backend agents; changes to BaseAgent/orchestrator must include contract stability checks and tests.
- **Testing focus**: Frontend Vitest tests target Director's Studio helpers/pages; smoke tests in `frontend/src/app/__smoke__/`. Playwright covers critical flows. Backend tests use Vitest/Supertest.
- **Performance & budgets**: Tailwind v4 with OKLCH palette; bundle/performance budgets enforced. Use lazy loading and avoid blocking work in React components; move heavy work to workers.
- **Env & secrets**: Copy variables from `.env.example`. Keep server secrets off the client; only `NEXT_PUBLIC_*` may be exposed. Required keys include database/Redis, Google GenAI/Groq, Sentry.
- **Logging/observability**: Use centralized logger (Winston) and keep Sentry/Otel instrumentation intact.
- **Deployment targets**: Frontend deploys to Vercel; backend to Render; Neon Postgres + Redis required.
- **Common pitfalls**: Avoid `any`; keep strict typing. Respect ESLint rules. Maintain bilingual error messaging and RTL layout. Do not change approved warnings pipeline without review.

Ask for clarification if a workflow or invariant is unclear; keep instructions short and specific when updating this file.
