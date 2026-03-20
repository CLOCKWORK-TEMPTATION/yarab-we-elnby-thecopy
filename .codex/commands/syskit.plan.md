---
description: Create the implementation plan — governing execution reference with architecture, phased execution, testing strategy, readiness gate, and design artifacts.
handoffs: 
  - label: Create Tasks
    agent: syskit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: syskit.checklist
    prompt: Create a checklist for the following domain...
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Governing Principle

> **The implementation plan is the governing execution reference.**
> No implementation starts before this plan is approved. No significant change is accepted without updating it.
> The sys (PRD) defines WHAT to build. This plan defines HOW to build it.

### Plan Creation Rules

1. **Do not duplicate the sys** — reference sys sections for problem/value/scope/requirements instead of copying them.
2. **Every section has an obligation level** — mandatory / conditional / optional. Mandatory sections cannot be skipped.
3. **Prevent superficial filling** — critical fields (architecture, risks, testing) must have specific answers, not generic placeholders.
4. **Readiness gate is mandatory** — the plan must explicitly state whether it's ready for execution, preliminary, or not ready, with blocking items listed.
5. **Change management from day one** — the plan is a living document with a change log and approval process.
6. **Separate measurement types** — distinguish between SMART business objectives (in sys), execution acceptance criteria (testing strategy), and post-launch monitoring (success indicators).
7. **Risk domains must be actively checked** — use the 6-domain checklist, don't just list obvious risks.
8. **Architecture decisions must document rejected alternatives** — "we chose X" is insufficient without "we rejected Y because Z".
9. **Project Profile determines depth** — classify the project as S (Small) / M (Medium) / L (Large) based on scope, team size, duration, and complexity. Profile affects which conditional sections are required and how deep mandatory sections must be filled. Default to M if unclear.

## Outline

1. **Setup**: Run the plan setup script from repo root and parse JSON for FEATURE_SYS, IMPL_PLAN, AMINOOOF_DIR, BRANCH.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/setup-plan.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs setup-plan --json`
   - For single quotes in args: use double-quote (e.g., `"I'm Groot"`)

2. **Load context**: Read FEATURE_SYS, `research.md`, and `.Systematize/memory/constitution.md`. Load IMPL_PLAN template (already copied by script).

3. **Fill the plan** following this execution flow:

   **Step 1 — Plan Card**:
   - Fill branch, date, sys link, version (1.0), status (Draft), readiness (Not Ready initially)
   - Fill product manager and technical lead from sys or user input
   - **Determine Project Profile** (S/M/L) from sys scope, team size, and duration:
     - **S**: Internal tool, ≤3 screens, 1–2 devs, ≤2 weeks → skip sections 3, 13, Appendices; simplify 9, 10
     - **M**: Standard feature, small team, 2–8 weeks → default depth
     - **L**: Multi-team, external integrations, regulatory, >8 weeks → all sections mandatory, full depth
   - If user specified a profile, use it. Otherwise infer from sys and mark in Plan Card.

   **Step 2 — Summary** *(mandatory)*:
   - Extract primary requirement from sys + research-backed technical direction

   **Step 3 — Technical Context** *(mandatory)*:
   - Fill all 9 fields from sys + project analysis
   - Every field must use sys + research evidence
   - If a field still cannot be resolved from both, stop with a blocker instead of deferring to implicit research

   **Step 4 — Stakeholders & Decision Rights** *(mandatory)*:
   - Identify decision makers for product, technical, budget, launch decisions
   - This prevents execution bottlenecks and ambiguity

   **Step 5 — Architecture** *(mandatory)*:
   - 5a: Draw component overview diagram appropriate to project type
   - 5b: Document architectural decisions with **rejected alternatives and rationale**
   - Do NOT just pick a technology — document what was considered and why

   **Step 6 — Security & Privacy** *(mandatory)*:
   - Fill authentication, authorization, encryption, audit logging
   - Use specific implementations, not vague words ("JWT + refresh tokens", not "secure auth")

   **Step 7 — Data Model & Controls** *(conditional — if feature involves data)*:
   - Entities with sensitivity levels
   - Data controls: source, deletion policy, backup, encryption

   **Step 8 — Phased Execution Plan** *(mandatory)*:
   - Define phases with objectives, durations, deliverables, transition criteria
   - Each phase must have a clear exit condition
   - Define milestones with target dates, deliverables, owners

   **Step 9 — Testing Strategy** *(mandatory)*:
   - 4 test levels: unit, integration, acceptance, performance
   - Feature acceptance criteria: must work / must not break / edge case
   - Separate from sys's acceptance criteria (those are requirement-level, these are execution-level)

   **Step 10 — Risk Registry** *(mandatory)*:
   - Fill risk table with probability, impact, score, mitigation, owner
   - **Actively check all 6 risk domains** (scope, technical, resource, integration, security, budget)
   - Do not skip domains — mark "No significant risk identified" if truly none

   **Step 11 — Success Indicators** *(mandatory)*:
   - Pre-launch: plan completeness, test pass rate
   - Post-launch: adoption, retention, performance
   - These are MONITORING metrics, not sys KPIs (which are in the sys)

   **Step 12 — Constitution Check** *(mandatory)*:
   - Load gates from constitution file
   - Evaluate against current plan
   - ERROR if violations exist and are unjustified

   **Step 13 — Project Structure** *(mandatory)*:
   - Documentation layout for this feature
   - Source code layout — select appropriate option, delete unused ones
   - Document structure decision with rationale

   **Step 14 — Change Management** *(mandatory)*:
   - Initialize change log with version 1.0

   **Step 15 — Readiness Gate** *(mandatory)*:
   - Assess plan readiness: Not Ready / Preliminary / Ready for Execution
   - List any blocking items
   - List reasons for non-readiness if applicable

   **Step 16 — Plan Quality Checklist** *(mandatory)*:
   - Check all 11 pre-approval items
   - Pre-launch items are left unchecked (filled later)

   **Step 17 — Approval** *(mandatory)*:
   - Initialize approval table (signatures added later)

4. **Validate the mandatory research gate**:

   - Treat `research.md` as a required upstream artifact, not a sub-step of planning.
   - Confirm it exists, is complete, and resolves all architecture-shaping or constraint-shaping unknowns.
   - If research verdict is STOP or PIVOT, halt immediately and report that planning is blocked.
   - If research verdict is PROCEED WITH CHANGES, apply those changes to the plan inputs before drafting.
   - If `research.md` is missing or incomplete, fail and direct the user to `/syskit.research`.

5. **Execute Phase 1: Design & Contracts**:

   **Prerequisites**: research.md complete, Technical Context fully resolved

   1. Extract entities from sys → `AGENTS.md`:
      - Entity name, fields, relationships
      - Validation rules from requirements
      - State transitions if applicable

   2. Define interface contracts (if project has external interfaces) → `/contracts/`:
      - Identify interfaces the project exposes
      - Document contract format appropriate for project type
      - Examples: public APIs, command schemas, endpoints, UI contracts
      - Skip if project is purely internal

   3. Generate `quickstart.md`:
      - Setup instructions, dev environment, first run

   4. Agent context update:
      - Run the agent context update script:
        - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/update-agent-context.ps1 -AgentType claude`
        - **Node.js**: `node .Systematize/scripts/node/cli.mjs update-agent-context --agent-type claude`
      - Add only new technology from current plan
      - Preserve manual additions between markers

   5. **Re-evaluate Constitution Check** post-design
   6. **Re-assess Readiness Gate** — update status if plan is now more complete

   **Output**: AGENTS.md, /contracts/*, quickstart.md, agent-specific file

6. **Stop and report**:
   - Branch name and IMPL_PLAN path
   - Generated artifacts list
   - Readiness gate status (Not Ready / Preliminary / Ready)
   - Pre-approval checklist results (X/11 passing)
   - Remaining blocking items (if any)
   - Constitution check result (pass/fail)
   - Next step recommendation (`/syskit.tasks` or resolve blocking items)

## Key Rules

- Use absolute paths
- ERROR on gate failures or unresolved research findings
- Do NOT duplicate sys content — reference it
- Mandatory sections cannot be skipped or left empty
- Architecture decisions MUST document rejected alternatives
- Risk domains MUST be actively checked (all 6)
- Readiness gate MUST be assessed honestly — do not mark "Ready" with unresolved items
- Plan is a living document — version and change log must be maintained

## Output

- **Primary format**: Plan generation summary in Markdown.
- **Files created or updated**: `plan.md`, and when applicable `AGENTS.md`, `quickstart.md`, agent context files, and interface contracts.
- **Success result**: Plan path, readiness gate status, generated artifacts, constitution check result, and remaining blockers.
- **Exit status**: `0` when the plan and mandatory supporting artifacts are generated; `1` when setup fails, upstream research is missing/incomplete, or readiness gates remain violated.
- **Failure conditions**: Missing `sys.md`, missing or incomplete `research.md`, constitution gate failures, or file generation errors.
