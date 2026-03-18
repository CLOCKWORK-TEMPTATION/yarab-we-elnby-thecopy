# the copy Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-18
Supported platforms: Claude Code


## Active Technologies
- PowerShell 7.x, Node.js 20.x, TypeScript 5.9.x + pnpm 10.32.1, Turborepo 2.5.0, Next.js 16.1.5, React 19.2.1, Express 5.1.0, Vitest 4.x, Playwright 1.49.x, Zod 4.x (002-audit-platform-apps)

- Bootstrap stage: no plan-derived technologies yet

## Project Structure

```text
commands/
.Systematize/
specs/
```

## Commands

PowerShell:
pwsh -File .Systematize/scripts/powershell/create-new-feature.ps1 "Feature description" -Json

Node.js:
node .Systematize/scripts/node/cli.mjs create-feature "Feature description" --json

Bootstrap:
pwsh -File .Systematize/scripts/powershell/init-syskit.ps1
node .Systematize/scripts/node/cli.mjs init

## Code Style

Follow repository conventions and update these instructions after plan.md is created.
Prefer the Systematize workflow: sys -> clarify -> constitution -> research -> plan -> tasks -> implement.

## Recent Changes
- 002-audit-platform-apps: Added PowerShell 7.x, Node.js 20.x, TypeScript 5.9.x + pnpm 10.32.1, Turborepo 2.5.0, Next.js 16.1.5, React 19.2.1, Express 5.1.0, Vitest 4.x, Playwright 1.49.x, Zod 4.x
- 001-v-formation-split-entry: Updated agent context


- bootstrap: Installed Systematize KIT

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Supported Platforms
- Claude Code
