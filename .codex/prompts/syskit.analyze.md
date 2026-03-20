---
description: "Perform a non-destructive, 4-domain 30+ analysis-type deep-context cross-artifact analysis across constitution.md, AGENTS.md, sys.md, plan.md, and tasks.md — covering Unit Definition (SCU modeling, behavioral completeness, atomicity, acceptance criteria, ambiguity), Quality & Logic (correctness, consistency, determinism, invariants, assumptions, feasibility, necessity, modifiability, redundancy), Boundaries & Dependencies (dependency graph, context boundaries, interface contracts, translation maps, transitions, read/write separation, cohesion/coupling, impact radius), and Execution & Governance (traceability, evidence linkage, priority alignment, test coverage, negative constraints, CRUD/lifecycle, change-control, criticality/risk)."
handoffs:
  - label: Implement Project
    agent: syskit.implement
    prompt: Start the implementation in phases
  - label: Fix Systematize
    agent: syskit.systematize
    prompt: Update the sys to resolve analysis findings
  - label: Fix Plan
    agent: syskit.plan
    prompt: Update the plan to resolve analysis findings
  - label: Regenerate Tasks
    agent: syskit.tasks
    prompt: Regenerate tasks to resolve analysis findings
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## Goal

Deliver a **4-domain, 30+ analysis-type** deep analysis of all core artifacts (`sys.md`, `plan.md`, `tasks.md`) through the lens of **Semantic Context Units (SCUs)** — grounded in requirements engineering quality attributes, domain-driven design boundary analysis, and governance traceability.

### The 4 Analysis Domains

| # | Domain | Scope | Count |
|---|--------|-------|-------|
| 1 | **Unit Definition** | SCU modeling, behavioral completeness, atomicity/granularity, acceptance criteria completeness, ambiguity & terminology drift detection, ontology building | 6 |
| 2 | **Quality & Logic** | Correctness, consistency, determinism, invariant extraction, assumption register, feasibility, necessity/value, modifiability, redundancy/duplication | 9 |
| 3 | **Boundaries & Dependencies** | Dependency graph, context boundary, interface contracts, cross-context translation, context transition, read/write separation, reporting leakage, cohesion/coupling, impact radius | 9 |
| 4 | **Execution & Governance** | Traceability matrix, evidence linkage, priority alignment, test scenario coverage, negative constraints, CRUD/lifecycle, change-control readiness, criticality/risk annotation | 8 |

### SCU Definition

Each SCU is a self-contained, atomic unit with:

```
SCU {
  id:              Stable slug (e.g., "user-upload-file")
  type:            requirement | story | plan-component | task
  source:          sys | plan | tasks
  location:        filename:line-range
  trigger:         What initiates this unit? (event, user action, system condition)
  actor:           Who performs the action?
  action:          What does the system/user do?
  outcome:         What is the measurable result?
  scope:           Which domain entities/components are in scope?
  entities:        [Entity names referenced]
  constraints:     [Hard limits or invariants]
  dependencies:    [SCU ids this unit depends on]
  priority:        P0 | P1 | P2 | P3 | UNSET
  ac_count:        Number of acceptance criteria defined
  ac_testable:     Boolean — are all ACs verifiable?
  assumptions:     [ASM-XXX ids if any]
  risk_annotation: CRITICAL | HIGH | MEDIUM | LOW | NONE
  bounded_context: Which bounded context does this SCU belong to?
  completeness:    Score 0–100 (see rubric below)
}
```

This command runs **only after** `/syskit.tasks` has produced a complete `tasks.md`.

---

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report only.

**Constitution Authority**: `.Systematize/memory/constitution.md` is non-negotiable. Constitution conflicts are automatically CRITICAL. Reinterpretation or silent ignoring is prohibited. Constitution changes require a separate explicit update outside `/syskit.analyze`.

**ID System Compliance**: All references must use the project's unified ID system (`RQ-`, `OBJ-`, `FR-`, `NFR-`, `BR-`, `INT-`, `ADR-`, `RK-`, `ASM-`, `TC-`, `AC-`, `KPI-`) as defined in constitution §5.

**Task Card Awareness**: Tasks use layer-prefixed IDs (`BE-T-`, `FE-T-`, `DO-T-`, `CC-T-`) with full Task Card format (Type, Priority, Estimate, Source, Depends On, Parallel, Story, Milestone, Description, Expected Outputs, Acceptance Criteria, Risks, Technical Notes).

**Offer Remediation**: After the report, offer an optional remediation plan. User must explicitly approve before any edits are applied.

---

## Execution Steps

### Phase 1 — Initialize Analysis Context

Run the prerequisites check script once from repo root. Parse JSON for `FEATURE_DIR` and `AVAILABLE_DOCS`. Derive absolute paths:
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json --require-tasks --include-tasks`

- `SYS`          = FEATURE_DIR/sys.md
- `PLAN`         = FEATURE_DIR/plan.md
- `TASKS`        = FEATURE_DIR/tasks.md
- `CONSTITUTION` = .Systematize/memory/constitution.md

Abort with a clear error if any required file is missing. Instruct the user to run the prerequisite command.

For arguments with single quotes, use escape syntax: `'I'\''m Groot'` or double-quote: `"I'm Groot"`.

---

### Phase 2 — Progressive Artifact Loading

Load only the minimal necessary slices from each artifact.

**From sys.md (PRD — 5-level structure):**
- Level 1: Context, Problem Statement, Expected Value, Objectives (`OBJ-XXX`), Scope (in/out)
- Level 2: Target Users, Use Case Scenarios (prioritized P1/P2/P3), Edge Cases
- Level 3: Functional Requirements (`FR-XXX` with trigger/input/output), NFR (`NFR-XXX` — 5 mandatory categories), Business Rules (`BR-XXX`), Key Entities
- Level 4: Integrations (`INT-XXX`) with failure plans
- Level 5: Acceptance Criteria (`AC-XXX` linked to `FR-XXX`), Risk Registry (`RK-XXX`), Milestones, KPIs, Traceability Matrix, Quality Audit
- Clarification Contract: What Required, What NOT Required, Constraints, Assumptions (`ASM-XXX`), Critical Questions Resolved, Success Criteria

**From plan.md:**
- Plan Card (including Project Profile S/M/L, Readiness status)
- Technical Context (9 fields — all must be resolved, no NEEDS CLARIFICATION)
- Stakeholders & Decision Rights (RACI)
- Architecture + Architectural Decisions (`ADR-XXX` with rejected alternatives)
- Security & Privacy (Auth/AuthZ/Encrypt/Audit)
- Data Model & Controls (entities, sensitivity levels, data governance)
- Phased Execution (phases with transition criteria, milestones with owners)
- Testing Strategy (4 levels + feature acceptance criteria: must work / must not break / edge)
- Risk Registry (6-domain checklist: scope, technical, resource, integration, security, budget)
- Success Indicators (pre-launch and post-launch)

**From tasks.md (Task Card format):**
- Layer-prefixed IDs (`BE-T-`, `FE-T-`, `DO-T-`, `CC-T-`)
- Task Card fields: Type, Priority, Estimate, Source, Depends On, Parallel, Story, Milestone
- Description (following task formula), Expected Outputs, Acceptance Criteria, Risks, Technical Notes
- Quick Reference Checklist, Execution Summary (hours/layer, hours/phase)
- Milestone Mapping, Post-Generation Review results
- Quality Checklist (12 items)

**From constitution.md (27-section structure):**
- §3 — 10 immutable governing rules (MUST / MUST NOT)
- §5 — Unified ID system (12 prefixes)
- §6 — Mandated outputs checklist
- §11 — Functional Requirements registry (`FR-XXX`)
- §12 — 12 NFR categories (`NFR-XXX`)
- §13 — Business Rules (`BR-XXX`)
- §20 — 6 test levels + acceptance criteria (`AC-XXX`)
- §21 — Assumptions (`ASM-XXX`), constraints, dependencies
- §22 — Risk registry (`RK-XXX`) across 8 domains
- §26 — Cross-reference traceability matrix (RQ→OBJ→FR→BR→TC→AC)
- §27 — 16-item completion checklist + 5 numeric metrics

---

### Phase 3 — SCU Extraction and Modeling

> **Internal step** — do not dump raw content into the output.

For every discrete unit found across the three artifacts, construct an SCU record using the full SCU schema defined in the Goal section.

**Extraction rules:**
- From sys.md: each `FR-XXX`, each Use Case Scenario, each `NFR-XXX`, each `BR-XXX`
- From plan.md: each architectural component, each phase/milestone, each `ADR-XXX`, each risk (`RK-XXX`)
- From tasks.md: each Task Card (`BE-T-XXX`, `FE-T-XXX`, `DO-T-XXX`, `CC-T-XXX`)
- Map task Source field back to its origin SCU in sys/plan

**Atomicity gate** (per SCU):
- Count the number of primary verbs → if >1, flag for split consideration
- Count the number of independent outcomes → if >1, flag for split
- An SCU must express ONE capability. If it mixes concerns, record a split recommendation.

**Entity & constraint extraction** (per SCU):
- Extract all entity names referenced → populate `entities` field
- Extract all hard limits, invariants, or constraints → populate `constraints` field
- Extract all assumptions referenced → populate `assumptions` field with `ASM-XXX` IDs
- Assign `bounded_context` based on the dominant entity/service domain

**Completeness Rubric (per SCU):**

| Attribute | Points |
|-----------|--------|
| Has trigger | 10 |
| Has actor | 5 |
| Has action | 10 |
| Has measurable outcome | 15 |
| Has ≥1 acceptance criterion | 15 |
| ACs are testable (Given/When/Then or equivalent) | 10 |
| Has explicit priority | 5 |
| Has scope/entities defined | 10 |
| Has dependencies listed (or explicitly none) | 5 |
| Has bounded_context assigned | 5 |
| Has constraints or "none" documented | 5 |
| Has assumptions linked or "none" documented | 5 |
| **Total** | **100** |

Assign a **completeness score** (0–100) to each SCU.

---

### Phase 4 — Domain 1: Unit Definition Analysis

Run 6 sub-analyses on each SCU:

#### 4A. Behavioral Completeness Check

For each SCU of type `requirement` or `story`, verify the **behavioral tuple**:

| Check | Pass | Failure Signal |
|-------|------|----------------|
| Trigger defined? | SCU states *when* or *what* initiates it | Action without trigger → missing start condition |
| Actor defined? | SCU states *who* performs the action | Orphan action with no responsible party |
| Action defined? | SCU states *what happens* | Trigger without effect |
| Outcome measurable? | Outcome is verifiable, no vague adjectives | "fast", "good", "appropriate" without metric |
| Success AND failure paths? | Both happy path and at least one failure case | Only happy path defined |

Flag: **MEDIUM** (missing 1 element) or **HIGH** (missing 2+).

#### 4B. Atomicity / Granularity Analysis

For each SCU:
1. Count primary verbs → if >1 → recommend **split**
2. Count independent outcomes → if >1 → recommend **split**
3. Check if SCU is too small to be independently testable → recommend **merge** with parent
4. Output: `split` / `merge` / `ok` decision per SCU with rationale

#### 4C. Acceptance Criteria Completeness

For each SCU with acceptance criteria:
1. Check: are ACs in **Given/When/Then** format or equivalent testable conditions?
2. Check: do ACs cover both success AND failure scenarios?
3. Check: is the verification scope clear (unit/integration/acceptance level)?
4. Flag: ACs that only cover happy path → **MEDIUM**
5. Flag: ACs missing entirely for a requirement/story SCU → **HIGH**

#### 4D. Ambiguity & Terminology Drift Detection

Scan all SCU text for:
1. **Vague adjectives** without metric: *fast, scalable, secure, intuitive, robust, good, nice, easy, flexible, appropriate, suitable, adequate*
2. **Unresolved placeholders**: `TODO`, `TKTK`, `???`, `<placeholder>`, `TBD`, `[NEEDS CLARIFICATION]`
3. **Missing actor**: requirement has action but no defined actor
4. **Pronoun without referent**: "it", "they", "this" without clear antecedent in same SCU
5. **Metric drift**: same quality attribute measured differently across SCUs (e.g., "latency <200ms" vs "latency <500ms" for same endpoint)
6. Output: list of ambiguous terms with suggested replacements

#### 4E. Ontology Building

Extract the **domain glossary** from all artifacts:
1. Collect all domain entity names, key verbs, and domain-specific terms
2. Build: `term → canonical definition → source → bounded_context`
3. Detect:
   - **Synonym drift**: same concept named differently (e.g., "User" vs "Customer" vs "Account")
   - **Polysemy**: same term with different meanings in different contexts
   - **Ghost entities**: referenced in tasks/plan but never defined in sys
   - **Dead entities**: defined in sys but never referenced in plan/tasks
   - **Definition instability**: entity definition changes between SCUs
4. Compute **terminology consistency score** (0–100):
   `(unique terms with consistent usage / total unique terms) × 100`

#### 4F. SCU Model Integrity

Validate each SCU as a standalone comprehensible unit:
1. Can the SCU be understood without reading other SCUs? If not → flag dependency gap
2. Does the SCU mix more than one stakeholder need? If so → flag for split
3. Is the SCU ID stable? Rerunning without artifact changes must produce identical IDs

---

### Phase 5 — Domain 2: Quality & Logic Analysis

Run 9 sub-analyses:

#### 5A. Correctness Validation

For each SCU, verify that the **cause-effect relationship** described is logically correct:
1. Does the trigger actually lead to the stated outcome via the described action?
2. Is the behavior consistent with the constitution's governing rules (§3)?
3. Cross-check against the original source (sys, plan, or policy) for factual correctness
4. Output: correctness verdict per SCU + confidence level (High/Medium/Low)

**Failure signal**: The requirement is clear but describes wrong logic, contradicts a policy, or contradicts what domain experts know is correct.

#### 5B. Consistency Check

Compare each SCU against:
1. **Adjacent SCUs**: Do any two SCUs impose contradictory outcomes for the same trigger/state?
2. **Source document**: Does the SCU contradict its origin (sys vs plan vs constitution)?
3. **Cross-artifact**: Does a task contradict its source requirement?
4. Output: list of contradiction pairs with exact references

**Failure signal**: Two units force different results for the same condition, or an SCU violates its parent source.

#### 5C. Determinism / Outcome Predictability

For each SCU:
1. Given the same initial state and inputs, will the outcome always be the same?
2. Are there judgment-based steps ("when appropriate", "as needed") without decision criteria?
3. Can a **decision table** be constructed? If not, the SCU is non-deterministic.
4. Output: decision table or determinism flag per SCU

**Failure signal**: Same inputs could yield different outcomes, or a step relies on undefined judgment.

#### 5D. Invariant Extraction

From SCUs belonging to the same entity/aggregate:
1. Extract rules that must ALWAYS hold (uniqueness, state bounds, referential integrity)
2. Verify no valid operation sequence can break an invariant
3. Output: invariant list per entity/aggregate with violation risk rating

**Failure signal**: A valid operation can break a fundamental rule, or maintaining consistency requires >1 transaction.

#### 5E. Assumption Register Analysis

Collect all assumptions (explicit `ASM-XXX` + implicit):
1. Scan SCU text for implicit assumptions (e.g., "users will always have internet" without stating it)
2. Classify each: `confirmed` / `pending` / `rejected`
3. For each pending assumption: assess impact if wrong
4. Output: assumption register table

**Failure signal**: A requirement appears correct only under undocumented assumptions about data, timing, permissions, or environment.

#### 5F. Feasibility Analysis

For each SCU, assess implementability:
1. Is the requirement technically feasible within the stated constraints (plan.md §2 Technical Context)?
2. Is the time estimate in the corresponding task realistic?
3. Are there prototype/spike recommendations needed?
4. Output: feasibility rating (Feasible / Needs Spike / Infeasible) per SCU

**Failure signal**: Requirement is correct from business perspective but impractical within stated constraints.

#### 5G. Necessity / Value Analysis

For each SCU:
1. Can it be traced back to a stakeholder need or business objective (`OBJ-XXX`)?
2. Does it have a clear value justification?
3. If removed, would any acceptance criterion fail?
4. Output: necessity verdict (Essential / Useful / Questionable) per SCU

**Failure signal**: SCU has no identifiable stakeholder, no impact on outcomes, or cannot be traced to any objective.

#### 5H. Modifiability Check

For each SCU:
1. If this SCU changes, how many other SCUs are affected?
2. Compute: `affected_SCUs / total_SCUs` ratio
3. Flag SCUs where a small change cascades across >5 other SCUs or >2 bounded contexts
4. Output: modifiability score per SCU + fragility hotspots

**Failure signal**: Any small modification requires rewriting many units or crosses multiple context boundaries.

#### 5I. Redundancy / Duplication Analysis

Across all SCUs:
1. Detect **near-duplicates**: same trigger+action, different wording
2. Detect **functional duplicates**: different trigger, same outcome on same entity
3. Detect **AC duplication**: same acceptance criterion across multiple SCUs
4. Output: duplicate clusters with `consolidate` / `reference` recommendation

**Failure signal**: Same rule written multiple times in different forms, risking divergence over time.

---

### Phase 6 — Domain 3: Boundaries & Dependencies Analysis

Run 9 sub-analyses:

#### 6A. Dependency Graph Construction

Build a directed dependency graph across all SCUs:
1. **Forward edges**: SCU A → SCU B means "A depends on B"
2. Detect **cycles** (circular dependencies between SCUs) → CRITICAL
3. Detect **orphaned SCUs** (no incoming or outgoing edges, unexpectedly isolated)
4. Identify the **critical path** (longest dependency chain to implementation)
5. Detect **priority inversions**: HIGH-priority SCU depending on LOW-priority SCU with no rationale
6. Output: adjacency summary (top 10 dependency chains only, not full graph dump)

**Inputs**: SCU dependency fields, task `Depends On` fields, plan phase ordering
**Failure signal**: Circular dependency, orphaned critical SCU, or priority inversion with no documented rationale.

#### 6B. Context Boundary Analysis

Identify bounded contexts across the system:
1. Group SCUs by their `bounded_context` field
2. Validate that each context has a clear responsibility and domain entity ownership
3. Detect **boundary violations**: SCU in context A directly manipulates entities owned by context B
4. Detect **missing context definitions**: SCUs without a clear bounded_context assignment
5. Output: bounded context map with entity ownership and violation list

**Inputs**: SCU entities, bounded_context fields, plan architecture section
**Failure signal**: An SCU crosses contexts without a defined interface, or an entity appears in >1 context with no translation.

#### 6C. Interface Contract Analysis

For each cross-context dependency:
1. Is there an explicit interface contract (API, event, shared schema)?
2. Does the contract specify: input format, output format, error cases, SLA?
3. Are failure modes documented with fallback plans (per plan.md architecture)?
4. Cross-reference with `INT-XXX` entries from sys.md Level 4
5. Output: contract completeness table per cross-context edge

**Inputs**: SCU dependencies crossing bounded contexts, `INT-XXX` entries, plan integrations section
**Failure signal**: Two contexts communicate but no contract defines the protocol, or contract lacks error handling.

#### 6D. Cross-Context Translation Map

When the same real-world concept appears in multiple bounded contexts:
1. Document how the concept is named and shaped in each context
2. Verify a translation/mapping mechanism exists (anti-corruption layer, adapter, shared kernel)
3. Flag cases where translation is implicit or missing
4. Output: translation map table

**Inputs**: Ontology map (from 4E), bounded context map (from 6B)
**Failure signal**: Same concept name used in two contexts with different meanings, or no adapter/mapping documented.

#### 6E. Context Transition Analysis

For entities that traverse multiple bounded contexts during their lifecycle:
1. Map the entity's state transitions across contexts (e.g., Order: Created→Paid→Shipped→Delivered)
2. Identify which context owns each transition
3. Detect ownership gaps (no context owns a particular transition)
4. Detect ownership conflicts (multiple contexts claim the same transition)
5. Output: entity lifecycle map with context ownership per state

**Inputs**: Key Entities from sys, Data Model from plan, bounded context map
**Failure signal**: An entity reaches a state nobody defined responsibility for, or two services compete for the same write.

#### 6F. Read/Write Separation Analysis

For each entity/aggregate:
1. Identify which SCUs read vs write the entity
2. Check if read-heavy entities are separated from write-heavy ones (CQRS pattern check)
3. Detect mixed-concern SCUs that both query and command in the same operation
4. Output: read/write matrix per entity with separation recommendation

**Inputs**: SCU actions, entity list, plan architecture
**Failure signal**: A query requirement silently triggers writes, or a command pathway is optimized for reads.

#### 6G. Reporting Leakage Check

Detect analytics/reporting logic leaking into core domain:
1. Identify SCUs whose primary purpose is reporting, dashboards, or analytics
2. Check if these SCUs directly access domain entity internals vs using read models/projections
3. Flag reporting SCUs that impose constraints on domain entity structure
4. Output: leakage incidents with separation recommendation

**Inputs**: SCU types, entity access patterns
**Failure signal**: A reporting requirement forces changes to domain entity schema, or analytics queries couple directly to transactional tables.

#### 6H. Cohesion / Coupling Metrics

Measure the quality of the system's division:
1. **Cohesion per context**: ratio of intra-context dependencies to total dependencies of that context's SCUs
2. **Coupling between contexts**: ratio of cross-context dependencies to total dependencies
3. Ideal: high cohesion (>0.7), low coupling (<0.3)
4. Flag contexts with low cohesion or high coupling
5. Output: cohesion/coupling scores per bounded context

**Inputs**: Dependency graph (6A), bounded context map (6B)
**Failure signal**: A context has more external dependencies than internal ones, or two contexts are so tightly coupled they should be merged.

#### 6I. Impact Radius Estimation

For each SCU:
1. Compute the **blast radius**: how many other SCUs are transitively affected if this SCU changes
2. Categorize: Contained (≤3 affected), Moderate (4–10), Wide (11+)
3. Cross-reference with risk annotations: SCUs with Wide radius should be HIGH or CRITICAL risk
4. Output: impact radius per SCU, sorted by blast radius descending

**Inputs**: Dependency graph (6A), SCU risk_annotation field
**Failure signal**: An SCU with Wide impact radius has no risk annotation, or a "simple" change cascades across the entire system.

---

### Phase 7 — Domain 4: Execution & Governance Analysis

Run 8 sub-analyses:

#### 7A. Bidirectional Traceability Matrix

Build a full traceability chain: `sys ↔ plan ↔ tasks`

For every SCU in sys, track:

| SCU ID | In Plan? | Plan Section | In Tasks? | Task IDs | Trace Status |
|--------|----------|-------------|-----------|----------|-------------|

**Trace Status values:**

| Status | Meaning |
|--------|---------|
| ✅ Full | Appears in sys + plan + tasks |
| ⚠️ Partial | Missing from one artifact |
| ❌ Orphaned | In sys, no plan element or task |
| 🔁 Inverse | Task/plan element has no sys requirement |
| 🔀 Fragmented | Single sys SCU mapped to contradictory tasks |

**Coverage percentages:**
- Sys → Plan: X%
- Sys → Tasks: X%
- Plan → Tasks: X%
- Tasks → Sys back-trace: X%

**Cross-reference with constitution §26** traceability matrix (RQ→OBJ→FR→BR→TC→AC).

#### 7B. Evidence Linkage Analysis

For each claim or decision in the artifacts:
1. Is there supporting evidence (research.md finding, ADR-XXX, stakeholder confirmation)?
2. For each `ADR-XXX`: are rejected alternatives documented with rationale?
3. For each risk (`RK-XXX`): is the mitigation plan evidence-based?
4. Output: evidence coverage ratio + orphan claims list

**Inputs**: `ADR-XXX` entries (plan architecture), `RK-XXX` entries, research.md (if exists)
**Failure signal**: A critical architecture decision cites no evidence or rejected alternatives; a risk mitigation plan is vague.

#### 7C. Priority Alignment Analysis

Across all artifacts:
1. HIGH-priority sys SCUs mapped only to later task phases → **misalignment**
2. LOW-priority tasks scheduled in Phase 1 without rationale → **misalignment**
3. Priority inversions in dependency graph (HIGH depends on LOW without documented reason)
4. Task priorities vs sys scenario priorities (P1/P2/P3) consistency
5. Output: priority alignment table with misalignment count

**Inputs**: SCU priorities, task priorities, sys scenario priorities, task phase assignments
**Failure signal**: Critical requirements are deferred while nice-to-haves are in Phase 1, or task priority contradicts sys priority.

#### 7D. Test Scenario Coverage Analysis

Map test coverage across all SCU types:
1. For each `FR-XXX`: is there at least one `AC-XXX` linked?
2. For each `AC-XXX`: is there a corresponding task that implements the test?
3. For each task with acceptance criteria: are they verifiable at the stated test level (unit/integration/acceptance)?
4. Map against plan.md testing strategy (4 levels)
5. Output: test coverage matrix + gap list

**Inputs**: `FR-XXX`→`AC-XXX` links, task acceptance criteria, plan testing strategy
**Failure signal**: Requirement has no acceptance criterion, or acceptance criterion has no implementing task, or test level is undefined.

#### 7E. Negative Constraint Analysis

Extract all "must-not" rules:
1. From constitution §3: immutable governing rules (negatives)
2. From sys: out-of-scope declarations, banned patterns
3. From plan: security constraints, performance ceilings
4. Verify each negative constraint has a corresponding positive check or validation mechanism
5. Output: negative constraint register with enforcement status

**Inputs**: Constitution §3, sys scope (in/out), plan security & constraints
**Failure signal**: A "must-not" rule exists but no validation mechanism, test, or task enforces it.

#### 7F. CRUD / Lifecycle Coverage Analysis

For each Key Entity defined in sys/plan:
1. Map which SCUs cover Create, Read, Update, Delete operations
2. Identify missing CRUD operations (e.g., entity can be created but never deleted)
3. Map entity state transitions and verify all transitions have SCU coverage
4. Output: CRUD matrix per entity + lifecycle gap list

**Inputs**: Key Entities (sys Level 3), Data Model (plan), task expected outputs
**Failure signal**: An entity has Create/Read but no Delete/Archive, or a state transition has no SCU covering it.

#### 7G. Change-Control Readiness

Assess whether the artifact set is ready for controlled evolution:
1. Do all registries use sequential IDs (`FR-001`, `FR-002`, ...)?
2. Are versions tracked (plan version, constitution version)?
3. Is there a change log (plan §14, constitution §25)?
4. Are amendment processes defined?
5. Output: change-control readiness score (0–100) + gap list

**Inputs**: All artifact headers, version fields, change log sections
**Failure signal**: IDs are missing or non-sequential, no version tracking, no change log, or no amendment process defined.

#### 7H. Criticality / Risk Annotation

For each SCU:
1. Assign risk annotation based on: dependency count, blast radius (6I), assumption count, feasibility rating (5F)
2. Cross-reference with Risk Registry (`RK-XXX`) — are high-risk SCUs reflected in the registry?
3. Flag SCUs with CRITICAL/HIGH risk but no corresponding `RK-XXX` entry
4. Output: risk annotation table per SCU + registry gap list

**Inputs**: All Phase 5-6 outputs, `RK-XXX` entries from sys and plan
**Failure signal**: An SCU is objectively high-risk (many dependencies, unverified assumptions, wide blast radius) but has no risk entry.

---

### Phase 8 — Constitution Alignment Pass

Dedicated pass for constitution compliance:

1. Load all normative statements from constitution §3 (10 immutable rules)
2. For each MUST rule: verify at least one SCU or artifact section satisfies it
3. For each MUST NOT rule: verify no SCU violates it
4. Check mandated outputs (§6) against actual artifact contents
5. Verify ID system compliance (§5): all entries use correct prefixes
6. Check traceability matrix (§26) completeness
7. Check completion checklist (§27) accuracy

**Output**: Constitution compliance report with:
- Rules satisfied ✅
- Rules violated ❌ → CRITICAL findings
- Rules partially met ⚠️ → HIGH findings

---

### Phase 9 — Severity Assignment

| Severity | Trigger | Domain Source |
|----------|---------|-------------|
| **CRITICAL** | Constitution MUST/MUST NOT violation (8); cycle in dependency graph (6A); zero-coverage sys requirement blocking baseline (7A); missing core artifact (1); invariant violation confirmed (5D); cross-context boundary breach with no contract (6C) | All |
| **HIGH** | Conflicting requirements (5B); incomplete behavioral tuple missing 2+ (4A); orphaned SCU (6A/7A); priority inversion (7C); ghost entity in tasks/plan (4E); completeness < 30 (3); non-deterministic critical SCU (5C); Wide blast radius with no risk annotation (6I/7H); CRUD gap for core entity (7F); negative constraint without enforcement (7E); infeasible requirement (5F) | All |
| **MEDIUM** | Terminology drift (4D/4E); missing non-functional task coverage (7D); incomplete behavioral tuple missing 1 (4A); completeness 30–60 (3); partial traceability (7A); untestable AC (4C); pending assumption for non-critical SCU (5E); moderate coupling between contexts (6H); evidence gap for non-critical decision (7B); questionable necessity (5G) | All |
| **LOW** | Wording improvements (4D); minor redundancy (5I); completeness 61–79 (3); dead entity in sys (4E); merge recommendation for overly granular SCU (4B); reporting leakage in non-critical path (6G); change-control gap for optional fields (7G) | All |

---

### Phase 10 — Structured Analysis Report

Output a Markdown report (**no file writes**) with the following structure:

---

## Sys Analysis Report

### 1. Executive Summary

| Metric | Value |
|--------|-------|
| **Analysis Domains Executed** | 4 |
| **Total Analysis Types Run** | 32 |
| **Total SCUs Extracted** | |
| **Overall Health** | CRITICAL / NEEDS WORK / HEALTHY / EXCELLENT |
| **Blocking Issues** | N (must resolve before `/syskit.implement`) |
### 2. SCU Inventory Summary

| ID | Type | Source | Bounded Context | Completeness | Priority | Trace Status | Behavioral Tuple | Risk |
|----|------|--------|----------------|-------------|----------|-------------|-----------------|------|
| user-upload-file | requirement | sys | file-management | 85 | P1 | ✅ Full | ✅ | MEDIUM |
| ... | | | | | | | | |

### 3. Findings Table

| ID | Domain | Analysis | Severity | SCU ID(s) | Location(s) | Summary | Recommendation |
|----|--------|----------|----------|-----------|-------------|---------|----------------|
| UD-01 | Unit Definition | 4A Behavioral | HIGH | user-login | sys.md:L45 | Missing failure path | Add error scenario |
| QL-01 | Quality & Logic | 5B Consistency | CRITICAL | order-create / order-validate | sys:L78, plan:L22 | Contradictory outcome | Resolve conflict |
| BD-01 | Boundaries | 6A Dependency | CRITICAL | payment-process | tasks.md:L120 | Circular dependency | Break cycle |
| EG-01 | Execution | 7A Traceability | HIGH | FR-005 | sys.md:L90 | No implementing task | Add task |
| CA-01 | Constitution | 8 Alignment | CRITICAL | — | constitution §3.4 | Untestable requirement accepted | Fix or remove |

**Finding ID convention**: `[Domain prefix]-[sequence]`
- `UD-` Unit Definition, `QL-` Quality & Logic, `BD-` Boundaries & Dependencies, `EG-` Execution & Governance, `CA-` Constitution Alignment

Limit to **60 findings**; aggregate remainder in overflow summary.

### 4. Domain 1: Unit Definition Report

**4.1 Behavioral Completeness:**

| SCU ID | Trigger | Actor | Action | Outcome | Failure Path | Score |
|--------|---------|-------|--------|---------|-------------|-------|
| ... | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | X/100 |

**4.2 Atomicity Decisions:** (split/merge recommendations)

**4.3 AC Completeness:** (Given/When/Then coverage, happy+failure path coverage)

**4.4 Ambiguity Register:** (vague terms found with suggested replacements)

**4.5 Ontology Report:**

| Term | Canonical Definition | Source | Bounded Context | Conflicts |
|------|---------------------|--------|----------------|-----------|

- **Terminology Consistency Score:** X/100
- **Ghost Entities:** (in plan/tasks, undefined in sys)
- **Dead Entities:** (in sys, unreferenced in plan/tasks)

### 5. Domain 2: Quality & Logic Report

**5.1 Correctness Issues:** (cause-effect violations)

**5.2 Consistency Conflicts:** (contradiction pairs with references)

**5.3 Determinism Flags:** (non-deterministic SCUs with decision table gaps)

**5.4 Invariant Register:**

| Entity/Aggregate | Invariant | Violation Risk | Source SCUs |
|-----------------|-----------|---------------|------------|

**5.5 Assumption Register:**

| ID | Assumption | Status | Impact if Wrong | Source SCU |
|----|-----------|--------|----------------|-----------|

**5.6 Feasibility Summary:** (Feasible / Needs Spike / Infeasible per SCU)

**5.7 Necessity Summary:** (Essential / Useful / Questionable per SCU)

**5.8 Modifiability Hotspots:** (top fragile SCUs by cascade ratio)

**5.9 Duplication Clusters:** (near-duplicates with consolidation recommendations)

### 6. Domain 3: Boundaries & Dependencies Report

**6.1 Dependency Graph:**
- Top 10 longest chains
- Cycles detected (CRITICAL)
- Priority inversions
- Orphaned SCUs

**6.2 Bounded Context Map:**

| Context | Entities Owned | SCU Count | Cohesion | Coupling |
|---------|---------------|-----------|----------|---------|

**6.3 Interface Contracts:** (completeness per cross-context edge)

**6.4 Translation Map:** (cross-context concept mappings)

**6.5 Entity Lifecycle Map:** (state transitions with context ownership)

**6.6 Read/Write Matrix:** (per entity, with separation recommendation)

**6.7 Reporting Leakage Incidents:** (if any)

**6.8 Impact Radius:** (top SCUs by blast radius)

### 7. Domain 4: Execution & Governance Report

**7.1 Traceability Matrix:**

| SCU ID | In Plan? | Plan Section | In Tasks? | Task IDs | Trace Status |
|--------|----------|-------------|-----------|----------|-------------|

**Coverage Percentages:**
- Sys → Plan: X%
- Sys → Tasks: X%
- Plan → Tasks: X%
- Tasks → Sys back-trace: X%

**7.2 Evidence Linkage:** (orphan claims, ADR without alternatives)

**7.3 Priority Alignment:** (misalignment count, inversions)

**7.4 Test Coverage Matrix:**

| FR-XXX | AC-XXX Linked? | Task Implementing Test? | Test Level | Status |
|--------|---------------|----------------------|-----------|--------|

**7.5 Negative Constraint Register:**

| Constraint | Source | Enforcement Mechanism | Status |
|-----------|--------|----------------------|--------|

**7.6 CRUD Matrix:**

| Entity | Create | Read | Update | Delete | Lifecycle Gaps |
|--------|--------|------|--------|--------|---------------|

**7.7 Change-Control Readiness Score:** X/100

**7.8 Risk Annotation vs Registry:**

| SCU ID | Computed Risk | RK-XXX Entry? | Gap? |
|--------|--------------|--------------|------|

### 8. Constitution Alignment Report

| Rule # | Rule Text | Status | Violating SCU(s) |
|--------|-----------|--------|-----------------|
| §3.1 | ... | ✅/❌/⚠️ | — |
| ... | | | |

- **ID System Compliance:** X/X entries use correct prefixes
- **Mandated Outputs (§6):** X/X present
- **Traceability Matrix (§26):** Complete / Gaps
- **Completion Checklist (§27):** X/16 items accurate

### 9. Metrics Dashboard

| Metric | Value |
|--------|-------|
| Total SCUs | |
| Requirements (sys) | |
| Plan Components | |
| Tasks | |
| Bounded Contexts Identified | |
| Sys → Tasks Coverage % | |
| Average SCU Completeness | |
| Terminology Consistency | |
| Behavioral Tuple Complete % | |
| AC Coverage (FR→AC) % | |
| Cohesion Average | |
| Coupling Average | |
| Change-Control Readiness | |
| Ambiguity Count | |
| Duplication Clusters | |
| Invariants Extracted | |
| Assumptions (pending) | |
| Negative Constraints (unenforced) | |
| Critical Issues | |
| High Issues | |
| Medium Issues | |
| Low Issues | |

---

### Phase 11 — Next Actions Block

At end of report, output a **Next Actions** block:

- If CRITICAL issues exist:
  - **Block** `/syskit.implement` until resolved
  - List exact commands to fix: `/syskit.systematize`, `/syskit.clarify`, `/syskit.plan`, `/syskit.tasks`, `/syskit.constitution`
  - Group fixes by domain and priority
- If only HIGH issues exist:
  - **Recommend** resolving before implementation, with specific remediation targets
  - Estimate effort per fix
- If only LOW/MEDIUM issues:
  - User may proceed; provide ordered improvement suggestions
- Always include:
  - Exact command suggestions with inline parameters
  - Which domain(s) need the most attention
  - Suggested re-analysis scope after fixes (full or partial)

---

### Phase 12 — Remediation Offer

Ask the user:

> "Would you like me to generate a prioritized remediation plan for the top N findings?
> (I will list edits for your approval — nothing is applied automatically.)"

If user accepts, structure the remediation plan as:

| # | Finding ID | Fix Description | Target File | Command | Effort |
|---|-----------|----------------|-------------|---------|--------|
| 1 | CA-01 | Fix untestable requirement | sys.md | `/syskit.systematize` | 10 min |
| 2 | BD-01 | Break circular dependency | tasks.md | `/syskit.tasks` | 15 min |

---

## Operating Principles

### Context Unit Integrity
- Each SCU must have a **stable ID** across runs — never regenerate IDs unless the unit's imperative phrase changes
- Rerunning without artifact changes must produce **identical IDs, scores, and counts**
- SCU boundaries must be **atomic**: one trigger, one actor, one action, one primary outcome

### Analysis Discipline
- **NEVER modify files** (read-only)
- **NEVER hallucinate** missing sections — if absent, report accurately
- **NEVER silently ignore** a constitution violation
- **Prioritize actionability**: every finding must have a concrete recommendation
- **Use examples over exhaustive rules**: cite specific SCU IDs and line numbers
- **Report zero issues gracefully**: emit success report with full metrics
- **Domain completeness**: all 4 domains must be executed; if a domain produces zero findings, report "No issues detected" explicitly

### Token Efficiency
- Load artifacts progressively — do not dump raw content into analysis
- Limit findings table to 60 rows; aggregate remainder into overflow summary
- Report dependency graph as top-10 chains, not full adjacency matrix
- Ontology table: show conflicts only (not full glossary dump)
- Omit empty report sections — if a sub-analysis has no findings, collapse to one-liner

### Severity Non-Negotiability
- Constitution MUST violations are always CRITICAL — no exceptions
- Dependency cycles are always CRITICAL — they block implementation
- Cross-context boundary breaches without contracts are always CRITICAL
- Invariant violations are always at least HIGH
- Incomplete traceability is always at least MEDIUM
- Unenforced negative constraints are always at least HIGH

### Cross-Domain Coherence
- Findings from different domains referencing the same SCU must be **consolidated** in the report
- Domain 3 (Boundaries) depends on Domain 1 (Unit Definition) outputs — execute in order
- Domain 4 (Governance) depends on Domains 1–3 outputs — execute last
- Phase 8 (Constitution) validates the combined output of all 4 domains

## Context

$ARGUMENTS

## Output

- **Primary format**: Read-only multi-domain analysis report in Markdown.
- **Files created or updated**: None.
- **Success result**: SCU inventory, findings table, domain-specific diagnostics, constitution alignment, metrics dashboard, and next-action recommendations.
- **Exit status**: `0` when all analysis domains complete successfully; `1` when any required core artifact is missing or the analysis context cannot be initialized.
- **Failure conditions**: Missing `sys.md`, `plan.md`, or `tasks.md`; unreadable constitution; or inability to establish traceable analysis inputs.
