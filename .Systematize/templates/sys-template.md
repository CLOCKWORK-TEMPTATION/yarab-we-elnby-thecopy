# Feature Systematize (PRD): [FEATURE NAME]

<!--
  This document is a GOVERNING CONTRACT — not a feature description.
  It translates product vision into commitments that are executable, measurable, and reviewable.
  
  A good sys answers five questions:
  1. WHAT are we building?
  2. WHY are we building it?
  3. WHO are we building it for?
  4. HOW will we know we succeeded?
  5. WHAT are we NOT building?
  
  BANNED WORDS — never use these without a measurable replacement:
  ❌ "fast"        → ✅ "≤ 2 seconds"
  ❌ "easy to use" → ✅ "completed in ≤ 3 clicks"
  ❌ "secure"      → ✅ "AES-256 encryption + MFA"
  ❌ "flexible"    → ✅ "supports 3 payment methods, extensible"
  ❌ "robust"      → ✅ "99.9% uptime with automatic failover"
  ❌ "intuitive"   → ✅ "90% task completion on first attempt"
-->

## Product Card

| Field | Value |
|-------|-------|
| **Feature Branch** | `[###-feature-name]` |
| **Created** | [DATE] |
| **Status** | Draft |
| **Owner** | [OWNER] |
| **Version** | 0.1.0 |
| **Maturity Level** | Level 1: Initial |
| **PRD Depth** | ☐ Lite ☐ Standard ☐ Comprehensive |
| **Input** | User description: "$ARGUMENTS" |

<!--
  Maturity Levels:
  - Level 1: Initial PRD — problem and scope defined
  - Level 2: Reviewable — requirements complete, team can review
  - Level 3: Executable — clarifications resolved, ready for implementation
  - Level 4: Approved — all stakeholders signed off, ready for launch

  PRD Depth Levels:
  Determines the expected depth and mandatory sections based on feature complexity.

  | Depth | When to use | Sections | Detail Level |
  |-------|-------------|----------|-------------|
  | Lite | Bug fix, minor enhancement, ≤1 week | Levels 1+3+5 only. Skip: Level 2 scenarios (use 1-liner), Level 4 integrations, Risk Registry, Clarification Contract (assume clear). Keep ≤2 pages. | Tables only, no prose |
  | Standard | Typical feature, 1–4 weeks | All 5 levels. Optional sections included when relevant. | Tables + brief rationale |
  | Comprehensive | Large feature, multi-team, regulatory, >4 weeks | All 5 levels mandatory. All optional sections mandatory. Traceability matrix fully cross-linked. | Full prose, edge cases exhaustive, all NFR categories filled |

  Rules:
  - If no depth selected, default to Standard.
  - Lite PRDs still require: Problem Statement, Scope, Functional Requirements, Acceptance Criteria, Quality Audit.
  - Comprehensive PRDs must have ≥3 use case scenarios, all 5 NFR categories with numeric targets, and complete traceability.
-->

---

## Level 1: Identity & Context

### 1.1 Context *(⚠️ stable — should NOT change)*

<!--
  What is the marketing message for this feature? Why are we building it now?
  Why do we have the opportunity to win? This section is for a broad audience.
  If this section changes, we must reconsider the entire feature.
-->

[Describe the positioning, timing, and strategic opportunity]

### 1.2 Problem Statement *(mandatory)*

<!--
  Start with the PROBLEM, not the solution. This is the most important section.
  ❌ "We need a notification system"
  ✅ "Users miss 30% of appointments due to lack of timely alerts"
-->

| Aspect | Description |
|--------|-------------|
| **What is broken?** | [Describe the specific dysfunction or gap] |
| **Who is affected?** | [Identify the affected users/stakeholders] |
| **What is the impact?** | [Quantify the business/user impact] |

### 1.3 Expected Value *(mandatory)*

| Dimension | Value |
|-----------|-------|
| **User Value** | [What users gain] |
| **Organization Value** | [Business benefit] |
| **Strategic Value** | [Long-term positioning] |

### 1.4 Measurable Objectives (SMART Goals) *(mandatory)*

<!--
  Each objective must be Specific, Measurable, Achievable, Relevant, Time-bound.
-->

- **OBJ-001**: [SMART objective]
- **OBJ-002**: [SMART objective]

### 1.5 Scope *(mandatory)*

| In Scope | Out of Scope |
|----------|-------------|
| [Feature/capability included] | [Feature/capability explicitly excluded] |
| [Feature/capability included] | [Feature/capability explicitly excluded] |

---

## Level 2: Users & Use Cases

### 2.1 Target Users *(mandatory)*

| User Type | Description | Key Needs |
|-----------|-------------|-----------|
| [User type 1] | [Who they are] | [What they need] |
| [User type 2] | [Who they are] | [What they need] |

### 2.2 Use Case Scenarios *(mandatory — mostly stable, refined over time)*

<!--
  Present REAL narrative scenarios we expect to happen once this feature launches.
  Tie them to real users at a real point in time.
  Each scenario must be INDEPENDENTLY TESTABLE — implementing just ONE
  should deliver a viable MVP slice.
  Prioritize by importance (P1 = most critical).
-->

#### Scenario 1 — [Brief Title] (Priority: P1)

[Describe this user journey as a real narrative — who, what, when, where, why]

**Why this priority**: [Explain the value and why P1]

**Independent Test**: [How this can be tested and demonstrated independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

#### Scenario 2 — [Brief Title] (Priority: P2)

[Describe this user journey as a real narrative]

**Why this priority**: [Explain the value and why P2]

**Independent Test**: [How this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more scenarios as needed, each with an assigned priority]

### 2.3 Edge Cases

<!--
  Negative scenarios, boundary conditions, error states.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

---

## Clarification Contract *(mandatory — filled by /syskit.clarify)*

<!--
  This section is the mandatory output of the clarification phase.
  It must be completed BEFORE moving to /syskit.constitution.
  Each sub-section must have at least one entry or an explicit "N/A — [reason]".
-->

### What Is Required

- [Concrete deliverable or behavior — one per bullet]

### What Is NOT Required

- [Explicitly excluded item — one per bullet]

### Constraints

- [Technical, organizational, or business constraint — one per bullet]

### Assumptions

<!--
  Each assumption must state: what is assumed, why, and what changes if wrong.
  Only non-critical unknowns become assumptions. Critical unknowns must be resolved via questions.
-->

- **ASM-001**: [Assumption] — Reason: [why assumed] — If wrong: [impact]

### Critical Questions Resolved

<!--
  Filled automatically by /syskit.clarify sessions.
  Format: Q: <question> → A: <answer> → Impact: <what changed in the sys>
-->

- Q: [question] → A: [answer] → Impact: [section/decision affected]

### Clarification Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Is the required scope defined? | ☐ Yes / ☐ No |
| 2 | Is the excluded scope defined? | ☐ Yes / ☐ No |
| 3 | Are all constraints documented? | ☐ Yes / ☐ No |
| 4 | Are assumptions documented with impact? | ☐ Yes / ☐ No |
| 5 | Are all critical unknowns resolved? | ☐ Yes / ☐ No |
| 6 | Can execution begin without recurring user queries? | ☐ Yes / ☐ No |

---

## Level 3: Requirements

### 3.1 Functional Requirements *(mandatory)*

<!--
  RULES:
  - Each requirement describes ONE clear behavior
  - Each requirement MUST be testable — if you can't write a test, rewrite the requirement
  - Use trigger/input/output format
  - Use FR-XXX IDs for traceability
  - NEVER use banned vague words (fast, easy, secure, flexible, robust, intuitive)
-->

| ID | Description | Trigger | Inputs | Outputs |
|----|-------------|---------|--------|---------|
| FR-001 | [Specific behavior] | [What triggers it] | [What goes in] | [What comes out] |
| FR-002 | [Specific behavior] | [What triggers it] | [What goes in] | [What comes out] |

*Example of marking unclear requirements:*

| ID | Description | Trigger | Inputs | Outputs |
|----|-------------|---------|--------|---------|
| FR-00X | Authenticate users via [NEEDS CLARIFICATION: auth method?] | User clicks "Login" | Credentials | Session token |

### 3.2 Non-Functional Requirements *(mandatory — all 5 categories)*

<!--
  Each category below is MANDATORY. If not applicable, state "N/A — [reason]".
  Every NFR must include a measurable target.
-->

| Category | Governing Question | Target | ID |
|----------|-------------------|--------|-----|
| **Performance** | What is the acceptable response time? | [e.g., ≤ 500ms for 95% of requests] | NFR-001 |
| **Scalability** | What is the expected growth? | [e.g., 100K users in year 1] | NFR-002 |
| **Availability** | What uptime is required? | [e.g., 99.9% SLA] | NFR-003 |
| **Security** | What controls are required? | [e.g., OWASP Top 10 compliance] | NFR-004 |
| **Compliance** | What standards are mandatory? | [e.g., GDPR, PCI-DSS, or N/A] | NFR-005 |

### 3.3 Business Rules *(include if applicable)*

<!--
  Logic that governs system behavior regardless of implementation.
-->

| ID | Rule | Condition | Action |
|----|------|-----------|--------|
| BR-001 | [Business rule description] | [When this applies] | [What must happen] |

### 3.4 Key Entities *(include if feature involves data)*

| Entity | Description | Key Attributes | Relationships |
|--------|-------------|----------------|---------------|
| [Entity 1] | [What it represents] | [Critical fields] | [Related entities] |
| [Entity 2] | [What it represents] | [Critical fields] | [Related entities] |

---

## Level 4: Integrations *(include if applicable)*

| ID | External System | Purpose | Failure Plan |
|----|----------------|---------|-------------|
| INT-001 | [System name] | [Why integrated] | [What happens if it fails] |

---

## Level 5: Verification & Launch

### 5.1 Acceptance Criteria *(mandatory)*

<!--
  Each FR must have at least one AC. Link them via IDs.
-->

| ID | Linked FR | Criterion | Verification Method |
|----|-----------|-----------|-------------------|
| AC-001 | FR-001 | [What proves this requirement is met] | [How to test] |
| AC-002 | FR-002 | [What proves this requirement is met] | [How to test] |

### 5.2 Risk Registry *(include if applicable)*

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|-----------|
| RK-001 | [Risk description] | High/Med/Low | High/Med/Low | [Mitigation plan] |

### 5.3 Milestones *(🔄 living section — changes frequently)*

<!--
  This is the LIVING part of the sys. It changes as we build, design, and discover.
  Define checkpoints, releases, and incremental features.
  What do we need to de-risk early? What do we defer to the end?
-->

| Milestone | Scope | Entry Criteria | Exit Criteria |
|-----------|-------|---------------|---------------|
| MS1: [Name] | [What's included] | [What must be true to start] | [What must be true to finish] |
| MS2: [Name] | [What's included] | [What must be true to start] | [What must be true to finish] |

### 5.4 Success Metrics (KPIs) *(mandatory)*

<!--
  Measurable, technology-agnostic, user-focused, verifiable.
-->

- **KPI-001**: [Measurable metric, e.g., "Users complete checkout in under 3 minutes"]
- **KPI-002**: [Measurable metric, e.g., "System supports 10,000 concurrent users"]
- **KPI-003**: [User satisfaction metric, e.g., "90% task completion on first attempt"]
- **KPI-004**: [Business metric, e.g., "Reduce support tickets by 50%"]

---

## Traceability Matrix

<!--
  Links objectives → requirements → acceptance criteria → tests → risks.
  Every FR must trace back to an OBJ. Every AC must link to an FR.
-->

| OBJ | FR | NFR | BR | AC | RK | KPI |
|-----|----|-----|----|----|----|----|
| OBJ-001 | FR-001 | NFR-001 | BR-001 | AC-001 | RK-001 | KPI-001 |
| OBJ-002 | FR-002 | — | — | AC-002 | — | KPI-002 |

---

## Quality Audit

### PRD Readiness Checklist

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Is the problem clearly defined? | ☐ | |
| 2 | Is the expected value known and measurable? | ☐ | |
| 3 | Is scope (in/out) documented? | ☐ | |
| 4 | Does every requirement have an acceptance criterion? | ☐ | |
| 5 | Are business rules explicitly written? | ☐ | |
| 6 | Are integrations and failure plans documented? | ☐ | |
| 7 | Are risks identified with mitigation plans? | ☐ | |
| 8 | Can a new team read this and work without guesswork? | ☐ | |

### Maturity Assessment

| Level | Name | Criteria | Current? |
|-------|------|----------|----------|
| 1 | Initial | Problem + scope defined | ☐ |
| 2 | Reviewable | Requirements complete, team can review | ☐ |
| 3 | Executable | Clarifications resolved, ready for implementation | ☐ |
| 4 | Approved | All stakeholders signed off, ready for launch | ☐ |

---

## Changelog
<!-- يتملي تلقائياً مع كل تعديل -->
| التاريخ | الإصدار | التغيير | المؤلف |
|---------|---------|--------|--------|
