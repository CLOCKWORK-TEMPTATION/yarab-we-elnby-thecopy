---

description: "Task list template for feature implementation — atomic, traceable, layer-typed"
---

# Tasks: [FEATURE NAME]

<!--
  This document converts the implementation plan into atomic, actionable tasks.
  
  GOVERNING PRINCIPLES:
  1. ATOMIC DECOMPOSITION — Every task completable in ONE work session (2–4 hours max)
  2. TASK FORMULA — [Action] + [Component/File] + [Implementation Details] + [Acceptance Criterion]
  3. TRACEABILITY — Every task traces back to its source in the plan/sys
  4. LAYER CLASSIFICATION — Every task is typed: Backend (🗄️) / Frontend (🎨) / DevOps (🔧) / Cross-Cutting (🔗)
  5. NO VAGUENESS — Every task has outputs, acceptance criteria, and file paths
  
  Hierarchy:
  Epic (full project phase) → Feature (independent function) → Task (specific work) → Subtask (technical step)
  
  BANNED task styles:
  ❌ "إنشاء صفحة تسجيل الدخول"
  ✅ "إنشاء مكون LoginForm.tsx يحتوي على حقول (email, password) مع validation باستخدام Zod ورسائل خطأ بالعربية"
-->

**Input**: Design documents from `/aminooof/[###-feature-name]/`
**Prerequisites**: plan.md (required), sys.md (required for user stories), research.md, AGENTS.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL — only include them if explicitly requested in the feature systematize document.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each task is typed by layer for filtering and distribution.

---

## Task ID Convention

| Layer | Prefix | Example |
|-------|--------|---------|
| 🗄️ Backend | `BE-T-` | BE-T-001, BE-T-002 |
| 🎨 Frontend | `FE-T-` | FE-T-001, FE-T-002 |
| 🔧 DevOps | `DO-T-` | DO-T-001, DO-T-002 |
| 🔗 Cross-Cutting | `CC-T-` | CC-T-001, CC-T-002 |

## Task Card Format

Every task MUST follow this structure:

```text
### [ID] — [Task Title]

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend / 🎨 Frontend / 🔧 DevOps / 🔗 Cross-Cutting |
| **Priority** | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) |
| **Estimate** | [X] hours (max 4h — split if larger) |
| **Source** | [Section/Requirement ID from plan.md or sys.md] |
| **Depends On** | [Task IDs] or None |
| **Parallel** | Yes / No |
| **Story** | [US1/US2/...] or Setup / Foundation / Polish |
| **Milestone** | [MS1/MS2/...] or N/A |
| **Owner** | [TEAM_MEMBER] or Unassigned |

**Description:**
[Detailed description following task formula: Action + Component + Sys + Criterion]

**Expected Outputs:**
- [ ] [File or artifact 1]
- [ ] [File or artifact 2]

**Acceptance Criteria:**
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]

**Risks / Attention Points:**
- [Risk or dependency concern, if any — or "None"]

**Technical Notes:**
[Any technical details, patterns, or references — or "None"]
```

## Quick Reference Checklist

<!--
  This section provides a compact checklist for tracking progress.
  Each line maps to a detailed Task Card below.
-->

- [ ] DO-T-001 — Create project structure per implementation plan
- [ ] DO-T-002 — Initialize project with framework dependencies
- [ ] BE-T-001 — Setup database schema and migrations framework
- [ ] ...

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project — adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /syskit.tasks command MUST replace these with actual tasks based on:
  - User stories from sys.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md (with FR-XXX, NFR-XXX, TC-XXX, AC-XXX IDs)
  - Entities from AGENTS.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  Every task MUST use the Task Card Format above.
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

---

## Execution Summary

| Layer | Task Count | Total Estimate | Parallel Opportunities |
|-------|-----------|----------------|----------------------|
| 🗄️ Backend | [X] | [X] hours | [X] tasks |
| 🎨 Frontend | [X] | [X] hours | [X] tasks |
| 🔧 DevOps | [X] | [X] hours | [X] tasks |
| 🔗 Cross-Cutting | [X] | [X] hours | [X] tasks |
| **Total** | **[X]** | **[X] hours** | **[X] tasks** |

| Phase | Task Count | Total Estimate |
|-------|-----------|----------------|
| Setup | [X] | [X] hours |
| Foundation | [X] | [X] hours |
| User Story 1 (P1) | [X] | [X] hours |
| User Story 2 (P2) | [X] | [X] hours |
| Polish | [X] | [X] hours |
| **Total** | **[X]** | **[X] hours** |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure
**Milestone**: [MS1 or N/A]

### DO-T-001 — Create project structure per implementation plan

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 1 hour |
| **Source** | plan.md §12 (Project Structure) |
| **Depends On** | None |
| **Parallel** | No |
| **Story** | Setup |
| **Milestone** | MS1 |

**Description:**
Create the project directory structure as defined in the implementation plan, including all required subdirectories for models, services, components, and tests.

**Expected Outputs:**
- [ ] All directories from plan.md §12 created
- [ ] .gitkeep files in empty directories

**Acceptance Criteria:**
- [ ] Directory structure matches plan.md §12 exactly
- [ ] All source and test directories exist

**Risks / Attention Points:**
- None

**Technical Notes:**
- None

---

### DO-T-002 — Initialize project with framework dependencies

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P0 |
| **Estimate** | 1 hour |
| **Source** | plan.md §2 (Technical Context) |
| **Depends On** | DO-T-001 |
| **Parallel** | No |
| **Story** | Setup |
| **Milestone** | MS1 |

**Description:**
Initialize [language] project with [framework] and install all dependencies from plan.md Technical Context.

**Expected Outputs:**
- [ ] Package manager config file (package.json / requirements.txt / etc.)
- [ ] Lock file generated
- [ ] Framework configuration file

**Acceptance Criteria:**
- [ ] All dependencies from plan.md §2 are installed
- [ ] Project builds/compiles without errors
- [ ] Linting passes

**Risks / Attention Points:**
- Version conflicts between dependencies

**Technical Notes:**
- Use versions from plan.md §2 Technical Context

---

### DO-T-003 — Configure linting and formatting tools

| Field | Value |
|-------|-------|
| **Type** | 🔧 DevOps |
| **Priority** | P1 |
| **Estimate** | 1 hour |
| **Source** | plan.md §2 (Technical Context) |
| **Depends On** | DO-T-002 |
| **Parallel** | Yes |
| **Story** | Setup |
| **Milestone** | MS1 |

**Description:**
Configure linting (ESLint/Pylint/etc.) and formatting (Prettier/Black/etc.) tools per project standards.

**Expected Outputs:**
- [ ] Linter configuration file
- [ ] Formatter configuration file
- [ ] Pre-commit hooks (if applicable)

**Acceptance Criteria:**
- [ ] Lint command runs without errors on empty project
- [ ] Format command runs without errors

**Risks / Attention Points:**
- None

**Technical Notes:**
- None

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented
**Milestone**: [MS1 or N/A]

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### BE-T-001 — Setup database schema and migrations framework

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | plan.md §6 (Data Model), sys.md §3.4 (Key Entities) |
| **Depends On** | DO-T-002 |
| **Parallel** | No |
| **Story** | Foundation |
| **Milestone** | MS1 |

**Description:**
Configure database connection, migration framework, and create initial schema based on AGENTS.md entities.

**Expected Outputs:**
- [ ] Database configuration file
- [ ] Migration framework setup
- [ ] Initial migration file(s)

**Acceptance Criteria:**
- [ ] Database connection succeeds
- [ ] Migrations run successfully (up/down)
- [ ] Schema matches AGENTS.md

**Risks / Attention Points:**
- Database connection string must be in environment config

**Technical Notes:**
- Follow plan.md §6 Data Controls for sensitivity and encryption requirements

---

### BE-T-002 — Implement authentication/authorization framework

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 3 hours |
| **Source** | plan.md §5 (Security & Privacy) |
| **Depends On** | DO-T-002 |
| **Parallel** | Yes |
| **Story** | Foundation |
| **Milestone** | MS1 |

**Description:**
Implement authentication and authorization middleware per plan.md §5 Security & Privacy requirements.

**Expected Outputs:**
- [ ] Auth middleware file
- [ ] Auth configuration
- [ ] Session/token management

**Acceptance Criteria:**
- [ ] Authentication flow works (login/logout)
- [ ] Authorization rejects unauthorized access
- [ ] Token/session management is secure per plan.md §5

**Risks / Attention Points:**
- Token expiration and refresh logic must be handled
- Follow plan.md §5 exactly for auth method

**Technical Notes:**
- Use implementations from plan.md §5 (e.g., JWT + refresh tokens, not "secure auth")

---

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 — [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]
**Source**: sys.md Scenario 1
**Independent Test**: [How to verify this story works on its own]
**Milestone**: [MS2]

### Tests for User Story 1 (OPTIONAL — only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

### BE-T-003 — Contract test for [endpoint]

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 1 hour |
| **Source** | sys.md FR-001, contracts/[name] |
| **Depends On** | BE-T-001 |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS2 |

**Description:**
Write contract test for [endpoint] verifying request/response schema per sys.md FR-001.

**Expected Outputs:**
- [ ] tests/contract/test_[name].py

**Acceptance Criteria:**
- [ ] Test fails before implementation (Red phase)
- [ ] Test verifies all inputs/outputs from FR-001

**Risks / Attention Points:**
- None

**Technical Notes:**
- None

---

### Implementation for User Story 1

### BE-T-004 — Create [Entity1] model

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 1 hour |
| **Source** | AGENTS.md [Entity1], sys.md FR-001 |
| **Depends On** | BE-T-001 |
| **Parallel** | Yes |
| **Story** | US1 |
| **Milestone** | MS2 |

**Description:**
Create [Entity1] model with fields, validations, and relationships as defined in AGENTS.md.

**Expected Outputs:**
- [ ] src/models/[entity1].py

**Acceptance Criteria:**
- [ ] Model contains all fields from AGENTS.md
- [ ] Validation rules match sys.md requirements
- [ ] Relationships are correctly defined

**Risks / Attention Points:**
- None

**Technical Notes:**
- None

---

### BE-T-005 — Implement [Service] for User Story 1

| Field | Value |
|-------|-------|
| **Type** | 🗄️ Backend |
| **Priority** | P0 |
| **Estimate** | 2 hours |
| **Source** | sys.md FR-001, FR-002 |
| **Depends On** | BE-T-004 |
| **Parallel** | No |
| **Story** | US1 |
| **Milestone** | MS2 |

**Description:**
Implement [Service] with business logic for User Story 1 operations.

**Expected Outputs:**
- [ ] src/services/[service].py

**Acceptance Criteria:**
- [ ] All FR-001 and FR-002 operations implemented
- [ ] Input validation per sys.md requirements
- [ ] Error handling with appropriate error codes

**Risks / Attention Points:**
- Business rule BR-001 applies to this service

**Technical Notes:**
- Follow plan.md §4 architecture patterns

---

### FE-T-001 — Create [Component] UI for User Story 1

| Field | Value |
|-------|-------|
| **Type** | 🎨 Frontend |
| **Priority** | P1 |
| **Estimate** | 3 hours |
| **Source** | sys.md Scenario 1, FR-001 |
| **Depends On** | BE-T-005 |
| **Parallel** | No |
| **Story** | US1 |
| **Milestone** | MS2 |

**Description:**
Create [Component] UI implementing the user journey from sys.md Scenario 1.

**Expected Outputs:**
- [ ] src/components/[component].tsx
- [ ] src/hooks/use[Feature].ts

**Acceptance Criteria:**
- [ ] All acceptance scenarios from Scenario 1 pass
- [ ] Client-side validation with appropriate messages
- [ ] Loading states during async operations
- [ ] Error display from server responses

**Risks / Attention Points:**
- Accessibility requirements from sys.md NFR-004

**Technical Notes:**
- None

---

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 — [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]
**Source**: sys.md Scenario 2
**Independent Test**: [How to verify this story works on its own]
**Milestone**: [MS3]

[Same Task Card pattern as Phase 3 — one card per task]

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 — [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]
**Source**: sys.md Scenario 3
**Independent Test**: [How to verify this story works on its own]
**Milestone**: [MS3]

[Same Task Card pattern — one card per task]

**Checkpoint**: All user stories independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories
**Milestone**: [Final MS]

### CC-T-001 — Documentation updates

| Field | Value |
|-------|-------|
| **Type** | 🔗 Cross-Cutting |
| **Priority** | P2 |
| **Estimate** | 2 hours |
| **Source** | plan.md §12 (Project Structure) |
| **Depends On** | All user story phases |
| **Parallel** | Yes |
| **Story** | Polish |
| **Milestone** | Final MS |

**Description:**
Update all documentation (README, API docs, usage guides) to reflect implemented features.

**Expected Outputs:**
- [ ] docs/ updated

**Acceptance Criteria:**
- [ ] All implemented features documented
- [ ] Setup instructions verified

**Risks / Attention Points:**
- None

**Technical Notes:**
- None

---

[Additional polish tasks follow the same card format: security hardening, performance optimization, quickstart.md validation, etc.]

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks with Parallel=Yes can run simultaneously
- All Foundational tasks with Parallel=Yes can run simultaneously (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story with Parallel=Yes can run simultaneously
- Models within a story with Parallel=Yes can run simultaneously
- Different user stories can be worked on in parallel by different team members

---

## Milestone Mapping

| Milestone | Phase | Tasks | Total Estimate |
|-----------|-------|-------|----------------|
| [MS1] | Setup + Foundation | [IDs] | [X] hours |
| [MS2] | User Story 1 (MVP) | [IDs] | [X] hours |
| [MS3] | User Story 2 + 3 | [IDs] | [X] hours |
| [Final] | Polish | [IDs] | [X] hours |

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Post-Generation Review

Before finalizing this task list, verify:

### Duplication Check
- [ ] No two tasks produce the same file
- [ ] No semantic duplicates (different wording, same work)

### Orphan Check
- [ ] Every task has a source (plan/sys section or requirement ID)
- [ ] Every task has at least one expected output
- [ ] No task exists without dependencies or dependents (except first Setup task and last Polish task)

### Estimate Sanity Check
- [ ] No task exceeds 4 hours
- [ ] Total estimate is realistic for project scope
- [ ] Layer distribution matches project type (e.g., frontend-heavy project has more FE tasks)

### Testability Check
- [ ] Every acceptance criterion is testable
- [ ] Every user story has an independent test description

### Traceability Check
- [ ] Every task traces to a source in plan.md or sys.md
- [ ] Every FR-XXX from sys.md has at least one task
- [ ] Every TC-XXX and critical AC-XXX has at least one implementing or verifying task
- [ ] Every entity from AGENTS.md has at least one task

---

## Tasks Quality Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Every task has a unique layer-prefixed ID | ☐ |
| 2 | Every task has a tangible output (files/artifacts) | ☐ |
| 3 | Every task has a time estimate (≤ 4 hours) | ☐ |
| 4 | Dependencies are clearly defined | ☐ |
| 5 | Acceptance criteria are testable | ☐ |
| 6 | Tasks are ordered by priority | ☐ |
| 7 | No duplicate tasks | ☐ |
| 8 | Every task traces to a source in plan/sys | ☐ |
| 9 | Risks/attention points documented where relevant | ☐ |
| 10 | Layer summary totals are calculated | ☐ |
| 11 | Milestone mapping is complete | ☐ |
| 12 | Post-generation review completed | ☐ |

---

## Notes

- Layer-prefixed IDs (BE-T-, FE-T-, DO-T-, CC-T-) enable filtering and distribution by layer
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Task formula: [Action] + [Component/File] + [Sys Requirements] + [Acceptance Criterion]

---

## Changelog
<!-- يتملي تلقائياً مع كل تعديل -->
| التاريخ | الإصدار | التغيير | المؤلف |
|---------|---------|--------|--------|
