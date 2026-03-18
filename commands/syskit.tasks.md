---
description: Convert the implementation plan into atomic, traceable, layer-typed tasks organized by user story with time estimates and acceptance criteria.
handoffs: 
  - label: Generate Quality Checklist
    agent: syskit.checklist
    prompt: Generate a quality checklist for the tasks and requirements
    send: true
  - label: Analyze For Consistency
    agent: syskit.analyze
    prompt: Run a project analysis for consistency
  - label: Implement Project
    agent: syskit.implement
    prompt: Start the implementation in phases
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Governing Principles

> **Every task is a contract**: atomic, traceable, layer-typed, time-estimated, and acceptance-tested.
> No vague tasks. No tasks without outputs. No tasks without a source in the plan or sys.

### Core Rules

1. **ATOMIC DECOMPOSITION** — Every task completable in ONE work session (2–4 hours max). If larger, split it.
2. **TASK FORMULA** — Every task description follows: `[Action] + [Component/File] + [Implementation Details] + [Acceptance Criterion]`
3. **TRACEABILITY** — Every task traces back to a specific section/requirement in plan.md or sys.md.
4. **LAYER CLASSIFICATION** — Every task is typed: 🗄️ Backend / 🎨 Frontend / 🔧 DevOps / 🔗 Cross-Cutting.
5. **LAYER-PREFIXED IDs** — IDs follow the convention: `BE-T-001`, `FE-T-001`, `DO-T-001`, `CC-T-001`.
6. **NO VAGUENESS** — Every task has expected outputs (files), acceptance criteria, and file paths.
7. **TIME ESTIMATES ARE MANDATORY** — Every task has an estimate in hours (max 4h).
8. **RISKS WHERE RELEVANT** — Document risks/attention points for non-trivial tasks.

### Banned Task Styles

| ❌ Avoid | ✅ Do |
|----------|-------|
| Vague task without clear output | Specific task with files and acceptance criteria |
| Task that takes more than a day | Split into tasks ≤ 4 hours each |
| Task that depends on everything | Specify exact dependency IDs |
| "Create the UI" | "Create LoginForm.tsx with email/password fields, Zod validation, Arabic error messages" |
| Assuming knowledge | Document technical notes |
| No source reference | Every task links to plan.md §X or sys.md FR-XXX |

## Pre-Execution Checks

**Check for extension hooks (before tasks generation)**:
- Check if `.Systematize/config/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_tasks` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter to only hooks where `enabled: true`
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    
    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `.Systematize/config/extensions.yml` does not exist, skip silently

## Outline

1. **Setup**: Run the prerequisites check script from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`

2. **Load design documents**: Read from FEATURE_DIR:
   - **Required**: plan.md (tech stack, libraries, structure, architecture, security, data model, risks), sys.md (user stories with priorities, FR-XXX, NFR-XXX, BR-XXX IDs)
   - **Optional**: AGENTS.md (entities), contracts/ (interface contracts), research.md (decisions), quickstart.md (test scenarios)
   - Note: Not all projects have all documents. Generate tasks based on what's available.

3. **Phase 1 — Analyze the plan** (extract all technical components):
   - From plan.md: extract tech stack, libraries, project structure, architectural decisions, security requirements, data model, phased execution plan, milestones
   - From sys.md: extract user stories with priorities (P1, P2, P3...), functional requirements (FR-XXX), non-functional requirements (NFR-XXX), business rules (BR-XXX), acceptance criteria (AC-XXX), key entities
   - If AGENTS.md exists: extract entities, fields, relationships, validation rules
   - If contracts/ exists: extract interface contracts, endpoints, schemas
   - If research.md exists: extract technical decisions, constraints
   - Build a complete inventory of:
     - [ ] Screens/pages to build
     - [ ] Components required
     - [ ] APIs/endpoints
     - [ ] Database tables/entities
     - [ ] External integrations
     - [ ] Infrastructure/DevOps items

4. **Phase 2 — Classify by layers**:
   For every extracted component, assign a layer type:

   | Layer | Prefix | Scope |
   |-------|--------|-------|
   | 🗄️ Backend | `BE-T-` | Database schema, migrations, API endpoints, business logic services, auth/authz |
   | 🎨 Frontend | `FE-T-` | UI components (atoms → molecules → organisms), pages/screens, state management, API integration |
   | 🔧 DevOps | `DO-T-` | Environment setup, CI/CD, deployment config, project structure |
   | 🔗 Cross-Cutting | `CC-T-` | Documentation, security hardening, performance optimization, cleanup |

5. **Phase 3 — Generate detailed tasks**:
   For each classified component, generate a Task Card following the template format:

   **Every Task Card MUST include**:
   - **ID**: Layer-prefixed sequential (`BE-T-001`, `FE-T-002`, etc.)
   - **Type**: 🗄️/🎨/🔧/🔗
   - **Priority**: P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
   - **Estimate**: Hours (max 4h — split if larger)
   - **Source**: Exact section/requirement ID from plan.md or sys.md (e.g., `plan.md §5`, `sys.md FR-001`)
   - **Depends On**: Task IDs or None
   - **Parallel**: Yes/No
   - **Story**: US1/US2/... or Setup/Foundation/Polish
   - **Milestone**: MS1/MS2/... or N/A
   - **Description**: Following task formula `[Action] + [Component/File] + [Implementation Details] + [Criterion]`
   - **Expected Outputs**: List of files/artifacts with checkboxes
   - **Acceptance Criteria**: Testable criteria with checkboxes
   - **Risks / Attention Points**: Or "None"
   - **Technical Notes**: Or "None"

   **Organization**: Tasks are organized by user story to enable independent implementation and testing:
   - Map all related components to their story (models, services, UI, tests)
   - Mark story dependencies (most stories should be independent)
   - Each entity/contract maps to the user story it primarily serves
   - If entity serves multiple stories: put in earliest story or Foundation phase

6. **Generate tasks.md**: Use `.Systematize/templates/tasks-template.md` as structure, fill with:
   - Correct feature name from plan.md
   - **Quick Reference Checklist**: Compact list of all task IDs and titles for progress tracking
   - **Execution Summary**: Two tables — hours per layer AND hours per phase
   - **Phase 1**: Setup tasks (project initialization) — DO-T-xxx IDs
   - **Phase 2**: Foundational tasks (blocking prerequisites) — mixed layer IDs
   - **Phase 3+**: One phase per user story (in priority order from sys.md) — mixed layer IDs
   - Each phase includes: story goal, source reference, independent test criteria, milestone, Task Cards
   - **Final Phase**: Polish & cross-cutting concerns — CC-T-xxx IDs
   - **Dependencies & Execution Order**: Phase deps, story deps, within-story order, parallel opportunities
   - **Milestone Mapping**: Which tasks belong to which milestone
   - **Implementation Strategy**: MVP first, incremental delivery, parallel team strategy

7. **Post-Generation Review** (MANDATORY — execute before writing file):

   **7a. Duplication Check**:
   - Verify no two tasks produce the same file
   - Verify no semantic duplicates (different wording, same work)

   **7b. Orphan Check**:
   - Every task has a source (plan/sys section)
   - Every task has at least one expected output
   - No task exists without dependencies or dependents (except first Setup and last Polish)

   **7c. Estimate Sanity Check**:
   - No task exceeds 4 hours
   - Total estimate is realistic for project scope
   - Layer distribution matches project type

   **7d. Testability Check**:
   - Every acceptance criterion is testable
   - Every user story has an independent test description

   **7e. Traceability Check**:
   - Every task traces to a source in plan.md or sys.md
   - Every FR-XXX from sys.md has at least one task
   - Every entity from AGENTS.md has at least one task

   **7f. Fill Quality Checklist** in tasks.md (12 items)

   If any review step fails, fix the tasks before writing the file.

8. **Report**: Output path to generated tasks.md and summary:
   - Total task count
   - Task count per layer (🗄️ Backend / 🎨 Frontend / 🔧 DevOps / 🔗 Cross-Cutting)
   - Task count per user story
   - Total estimated hours per layer
   - Total estimated hours per phase
   - Parallel opportunities identified
   - Independent test criteria for each story
   - Milestone mapping summary
   - Suggested MVP scope (typically just User Story 1)
   - Post-generation review results (all checks pass/fail)
   - Quality checklist status (X/12)

9. **Check for extension hooks**: After tasks.md is generated, check if `.Systematize/config/extensions.yml` exists in the project root.
   - If it exists, read it and look for entries under the `hooks.after_tasks` key
   - If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
   - Filter to only hooks where `enabled: true`
   - For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
     - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
     - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
   - For each executable hook, output the following based on its `optional` flag:
     - **Optional hook** (`optional: true`):
       ```
       ## Extension Hooks

       **Optional Hook**: {extension}
       Command: `/{command}`
       Description: {description}

       Prompt: {prompt}
       To execute: `/{command}`
       ```
     - **Mandatory hook** (`optional: false`):
       ```
       ## Extension Hooks

       **Automatic Hook**: {extension}
       Executing: `/{command}`
       EXECUTE_COMMAND: {command}
       ```
   - If no hooks are registered or `.Systematize/config/extensions.yml` does not exist, skip silently

Context for task generation: $ARGUMENTS

The tasks.md should be immediately executable — each task must be specific enough that an LLM can complete it without additional context.

## Task Generation Rules

**CRITICAL**: Tasks MUST be organized by user story to enable independent implementation and testing.

**Tests are OPTIONAL**: Only generate test tasks if explicitly requested in the feature systematize document or if user requests TDD approach.

### Task Card Format (REQUIRED)

Every task MUST be a full Task Card section following `.Systematize/templates/tasks-template.md`:

```text
### [ID] — [Task Title]

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend / 🎨 Frontend / 🔧 DevOps / 🔗 Cross-Cutting |
| **Priority** | P0 / P1 / P2 / P3 |
| **Estimate** | [X] hours |
| **Source** | [plan.md §X / sys.md FR-XXX] |
| **Depends On** | [Task IDs] or None |
| **Parallel** | Yes / No |
| **Story** | [US1/US2/...] or Setup / Foundation / Polish |
| **Milestone** | [MS1/MS2/...] or N/A |

**Description:**
[Action + Component/File + Implementation Details + Criterion]

**Expected Outputs:**
- [ ] [File or artifact]

**Acceptance Criteria:**
- [ ] [Testable criterion]

**Risks / Attention Points:**
- [Risk or "None"]

**Technical Notes:**
[Details or "None"]
```

**Additionally**, every task MUST appear in the **Quick Reference Checklist** at the top of the file:

```text
- [ ] BE-T-001 — [Title]
- [ ] FE-T-001 — [Title]
```

### Layer-Prefixed ID System

| Layer | Prefix | Sequential within layer |
|-------|--------|----------------------|
| 🗄️ Backend | `BE-T-` | BE-T-001, BE-T-002, BE-T-003... |
| 🎨 Frontend | `FE-T-` | FE-T-001, FE-T-002, FE-T-003... |
| 🔧 DevOps | `DO-T-` | DO-T-001, DO-T-002, DO-T-003... |
| 🔗 Cross-Cutting | `CC-T-` | CC-T-001, CC-T-002, CC-T-003... |

IDs are sequential within each layer (not globally). This enables filtering and distribution by layer.

### Task Organization

1. **From User Stories (sys.md)** — PRIMARY ORGANIZATION:
   - Each user story (P1, P2, P3...) gets its own phase
   - Map all related components to their story:
     - Models needed for that story
     - Services needed for that story
     - Interfaces/UI needed for that story
     - If tests requested: Tests specific to that story
   - Mark story dependencies (most stories should be independent)
   - **Source field**: Link each task to its FR-XXX, NFR-XXX, or scenario

2. **From Contracts**:
   - Map each interface contract → to the user story it serves
   - If tests requested: Each interface contract → contract test task before implementation in that story's phase

3. **From AGENTS.md**:
   - Map each entity to the user story(ies) that need it
   - If entity serves multiple stories: Put in earliest story or Foundation phase
   - Relationships → service layer tasks in appropriate story phase

4. **From Setup/Infrastructure**:
   - Shared infrastructure → Setup phase (Phase 1)
   - Foundational/blocking tasks → Foundational phase (Phase 2)
   - Story-specific setup → within that story's phase

5. **From Plan Architecture/Security/Risks**:
   - Architecture decisions (plan.md §4) → inform task technical notes
   - Security requirements (plan.md §5) → generate specific security tasks in Foundation
   - Risk registry (plan.md §9) → inform task risks/attention points
   - Milestones (plan.md §7.2) → map tasks to milestones

### Phase Structure

- **Phase 1**: Setup (project initialization) — primarily DO-T-xxx
- **Phase 2**: Foundational (blocking prerequisites — MUST complete before user stories) — mixed layers
- **Phase 3+**: User Stories in priority order (P1, P2, P3...)
  - Within each story: Tests (if requested) → Models → Services → Endpoints → Integration
  - Each phase should be a complete, independently testable increment
  - **Source**: sys.md Scenario X
  - **Milestone**: Mapped from plan.md §7.2
- **Final Phase**: Polish & Cross-Cutting Concerns — primarily CC-T-xxx

### Estimate Guidelines

| Task Type | Typical Estimate |
|-----------|-----------------|
| Project structure setup | 1h |
| Dependency initialization | 1h |
| Single model/entity | 1h |
| Service with business logic | 2–3h |
| API endpoint (CRUD) | 1–2h |
| UI component (simple) | 1–2h |
| UI component (complex form/table) | 3–4h |
| Auth middleware | 2–3h |
| Database migration | 1–2h |
| Integration with external service | 2–4h |
| Test file (contract/integration) | 1h |
| Documentation | 1–2h |

If a task exceeds 4h, it MUST be split into subtasks.

## Output

- **Primary format**: Task generation summary in Markdown.
- **Files created or updated**: `tasks.md`.
- **Success result**: Total task count, layer distribution, story mapping, hour totals, milestone mapping, review results, and suggested MVP scope.
- **Exit status**: `0` when `tasks.md` passes post-generation review and is written; `1` when prerequisite design artifacts are missing, traceability fails, or task quality checks cannot pass.
- **Failure conditions**: Missing `plan.md`, invalid task decomposition, duplicate or orphan tasks after review, or write failure for `tasks.md`.
