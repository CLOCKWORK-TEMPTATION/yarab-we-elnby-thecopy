---
description: Create a feature systematize document (PRD) from a natural language description — follows 5-level PRD structure with traceability, maturity levels, and quality audit.
handoffs:
  - label: Clarify Sys Requirements
    agent: syskit.clarify
    prompt: Clarify systematize requirements
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/syskit.systematize` in the triggering message **is** the feature description. Do not ask the user to repeat it unless they provided an empty command.

### Governing Principle

> **The sys (PRD) is NOT a feature description — it is a governing contract** that translates product vision into commitments that are executable, measurable, and reviewable.

A good sys answers five questions:
1. **WHAT** are we building?
2. **WHY** are we building it?
3. **WHO** are we building it for?
4. **HOW** will we know we succeeded?
5. **WHAT** are we NOT building?

### PRD Creation Rules

1. **Problem before solution** — ALWAYS define the problem before describing features.
2. **Every requirement must be testable** — if you can't write a test for it, rewrite it.
3. **Scope must be explicit** — both in-scope AND out-of-scope must be documented.
4. **No vague words** — banned words must be replaced with measurable alternatives:

   | ❌ Banned | ✅ Replace with |
   |-----------|----------------|
   | "fast" | "≤ 2 seconds" |
   | "easy to use" | "completed in ≤ 3 clicks" |
   | "secure" | "AES-256 encryption + MFA" |
   | "flexible" | "supports 3 methods, extensible" |
   | "robust" | "99.9% uptime with failover" |
   | "intuitive" | "90% task completion on first attempt" |

5. **Requirements use trigger/input/output format** — each FR row must specify what triggers it, what goes in, and what comes out.
6. **All 5 NFR categories are mandatory** — Performance, Scalability, Availability, Security, Compliance. Use "N/A — [reason]" only if truly inapplicable.
7. **Traceability from day one** — every FR must link to an OBJ, every AC must link to an FR.
8. **Context section must NOT change** — it's the fundamental motivation. If it changes, the whole feature needs reassessment.
9. **Milestones are the living section** — they change frequently as we build and discover.
10. **Start broad, then narrow** — broadest audience first, then specifics. Most stable content first, most volatile last.
11. **PRD Depth adapts to complexity** — classify the PRD as Lite / Standard / Comprehensive based on feature size and risk:
    - **Lite**: Bug fix or minor enhancement (≤1 week) → Levels 1+3+5 only, skip scenarios and integrations, keep ≤2 pages
    - **Standard**: Typical feature (1–4 weeks) → all 5 levels, optional sections when relevant (default)
    - **Comprehensive**: Large feature, multi-team, or regulatory (>4 weeks) → all sections mandatory, exhaustive edge cases, all NFR categories with numeric targets
    - Default to Standard if unclear. Lite PRDs still require: Problem Statement, Scope, FRs, ACs, Quality Audit.

### Execution Steps

1. **Generate a concise short name** (2-4 words) for the branch:
   - Use action-noun format (e.g., "add-user-auth", "analytics-dashboard")
   - Preserve technical terms and acronyms

2. **Create the feature branch** by running the script:
   - **PowerShell**:
     ```
     pwsh -File .Systematize/scripts/powershell/create-new-feature.ps1 "$ARGUMENTS" -Json -ShortName "<short-name>" "<description>"
     ```
   - **Node.js**:
     ```
     node .Systematize/scripts/node/cli.mjs create-feature "$ARGUMENTS" --json --short-name "<short-name>" "<description>"
     ```

   **IMPORTANT**:
   - Do NOT pass `--number` — the script auto-detects
   - Always include `-Json` for parseable output
   - Run this script only ONCE per feature
   - Parse `BRANCH_NAME` and `SYS_FILE` from JSON output
   - For single quotes: use `"I'm Groot"` (double-quote)

3. **Load** `.Systematize/templates/sys-template.md` to understand the 5-level PRD structure.

4. **Fill the sys** following this execution flow:

   **Phase A — Identity & Context (Level 1):**
   1. Parse user description → extract core problem, affected users, impact
   2. Fill **Product Card** (branch, date, status, owner, version, maturity = Level 1)
   3. Fill **1.1 Context** — positioning, timing, opportunity (⚠️ this should NOT change later)
   4. Fill **1.2 Problem Statement** — ALWAYS problem first, never features first
      - If empty: ERROR "No problem statement derivable from description"
   5. Fill **1.3 Expected Value** — user, organization, strategic
   6. Fill **1.4 Measurable Objectives** — SMART goals with OBJ-XXX IDs
   7. Fill **1.5 Scope** — in/out table (out-of-scope is as important as in-scope)

   **Phase B — Users & Use Cases (Level 2):**
   8. Fill **2.1 Target Users** — user types with needs
   9. Fill **2.2 Use Case Scenarios** — real narrative scenarios, prioritized (P1, P2, P3)
      - Each scenario must be independently testable (MVP slice)
      - Tie to real users at a real point in time when possible
      - If no clear user flow: ERROR "Cannot determine user scenarios"
   10. Fill **2.3 Edge Cases** — negative scenarios, boundary conditions

   **Phase C — Requirements (Level 3):**
   11. Fill **3.1 Functional Requirements** — trigger/input/output table with FR-XXX IDs
       - Each FR describes ONE clear behavior
       - Each FR MUST be testable
       - NEVER use banned vague words
       - For unclear aspects: mark [NEEDS CLARIFICATION] (max 3 total)
   12. Fill **3.2 Non-Functional Requirements** — ALL 5 mandatory categories with NFR-XXX IDs
       - Performance, Scalability, Availability, Security, Compliance
       - Each with measurable target
   13. Fill **3.3 Business Rules** — if applicable, with BR-XXX IDs
   14. Fill **3.4 Key Entities** — if data involved

   **Phase D — Integrations (Level 4):**
   15. Fill **Integrations** — if applicable, with INT-XXX IDs and failure plans

   **Phase E — Verification & Launch (Level 5):**
   16. Fill **5.1 Acceptance Criteria** — AC-XXX linked to FR-XXX (every FR needs at least one AC)
   17. Fill **5.2 Risk Registry** — if applicable, with RK-XXX IDs
   18. Fill **5.3 Milestones** — with entry/exit criteria (this is the "living" section)
   19. Fill **5.4 Success Metrics (KPIs)** — measurable, technology-agnostic, user-focused
   20. Fill **Traceability Matrix** — link OBJ→FR→NFR→BR→AC→RK→KPI
   21. Fill **Quality Audit** — mark PRD Readiness Checklist + Maturity Assessment

   **For unclear aspects** throughout all phases:
   - Make informed guesses based on context and industry standards
   - Only mark [NEEDS CLARIFICATION: specific question] if:
     - The choice significantly impacts scope, architecture, or user experience
     - Multiple reasonable interpretations exist with different implications
     - No reasonable default exists
   - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
   - Priority: scope > security/privacy > user experience > technical details
   - Document all assumptions in Clarification Contract → Assumptions (ASM-XXX format)

5. **Write** the systematize document to SYS_FILE, preserving section order and headings.

6. **Systematize Quality Validation**:

   a. **Create Sys Quality Checklist** at `FEATURE_DIR/checklists/requirements.md`:

      ```markdown
      # Systematize Quality Checklist: [FEATURE NAME]
      
      **Purpose**: Validate PRD completeness and quality before proceeding
      **Created**: [DATE]
      **Feature**: [Link to sys.md]
      **Maturity Target**: Level 2 (Reviewable)
      
      ## PRD Structure (5-Level)
      
      - [ ] Level 1: Problem statement is specific (not a feature wish)
      - [ ] Level 1: Expected value has all 3 dimensions (user/org/strategic)
      - [ ] Level 1: Scope table has both in-scope AND out-of-scope entries
      - [ ] Level 1: Objectives are SMART with OBJ-XXX IDs
      - [ ] Level 2: Target users identified with key needs
      - [ ] Level 2: Use cases are real narratives (not abstract)
      - [ ] Level 3: All FRs use trigger/input/output format
      - [ ] Level 3: All 5 NFR categories addressed
      - [ ] Level 5: Every FR has at least one linked AC
      - [ ] Traceability matrix links OBJ→FR→AC
      
      ## Content Quality
      
      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] No banned vague words (fast, easy, secure, flexible, robust, intuitive)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      
      ## Requirement Completeness
      
      - [ ] No [NEEDS CLARIFICATION] markers remain (or max 3 critical ones)
      - [ ] Requirements are testable and unambiguous
      - [ ] Success metrics are measurable and technology-agnostic
      - [ ] Edge cases identified
      - [ ] Assumptions documented with ASM-XXX IDs
      
      ## PRD Readiness
      
      - [ ] PRD Readiness Checklist (8 items) filled
      - [ ] Maturity Level assessed
      - [ ] Can a new team read this and work without guesswork?
      
      ## Notes
      
      - Items marked incomplete require sys updates before `/syskit.clarify`
      ```

   b. **Run Validation Check**: Review sys against each checklist item. For each:
      - Determine pass/fail
      - Document specific issues (quote relevant sections)
      - **Scan for banned vague words** and replace with measurable alternatives

   c. **Handle Validation Results**:

      - **If all pass**: Mark complete, assess maturity level, proceed to step 7

      - **If items fail (excluding [NEEDS CLARIFICATION])**:
        1. List failing items with specific issues
        2. Update sys to address each
        3. Re-validate (max 3 iterations)
        4. If still failing after 3: document in notes, warn user

      - **If [NEEDS CLARIFICATION] markers remain**:
        1. Extract all markers
        2. **LIMIT CHECK**: Keep max 3 most critical, make informed guesses for rest
        3. Present each as:

           ```markdown
           ## Question [N]: [Topic]
           
           **Context**: [Quote relevant sys section]
           **What we need to know**: [Specific question]
           
           **Suggested Answers**:
           
           | Option | Answer | Implications |
           |--------|--------|--------------|
           | A      | [Answer] | [Impact on feature] |
           | B      | [Answer] | [Impact on feature] |
           | C      | [Answer] | [Impact on feature] |
           | Custom | Your own answer | [How to provide] |
           
           **Your choice**: _[Wait for response]_
           ```

        4. Number Q1, Q2, Q3 — present all together
        5. After answers: update sys, re-validate

   d. **Update Quality Audit section** in the sys itself:
      - Fill PRD Readiness Checklist (8 items) with current status
      - Set Maturity Level (typically Level 1 or 2 after initial creation)

   e. **Update Checklist file** with pass/fail status

7. **Report completion**:
   - Branch name and sys file path
   - PRD maturity level achieved
   - Checklist results (X/Y items passing)
   - Traceability status (complete/gaps)
   - Number of [NEEDS CLARIFICATION] markers remaining (if any)
   - Readiness for next phase (`/syskit.clarify`)

**NOTE:** The script creates and checks out the new branch before writing.

### Quick Guidelines

- Focus on **WHAT** users need and **WHY** — never HOW to implement.
- Written for business stakeholders, not developers.
- DO NOT create checklists embedded in the sys — use the separate checklist file.
- **Mandatory sections**: Must be completed for every feature.
- **Optional sections**: Include only when relevant. Remove entirely if not applicable (don't leave "N/A" placeholders in optional sections).

### For AI Generation

1. **Problem first**: Extract the core problem from the user's description. If they describe a solution, reverse-engineer the problem.
2. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps.
3. **Document assumptions**: Use ASM-XXX format in Clarification Contract → Assumptions.
4. **Limit clarifications**: Max 3 [NEEDS CLARIFICATION] — only for critical decisions.
5. **Think like a tester**: Every vague requirement should fail validation.
6. **Enforce banned words**: Scan output for banned vague words and auto-replace with measurable alternatives.
7. **Traceability**: Ensure every FR links to an OBJ, every AC links to an FR.

**Reasonable defaults** (don't ask about these):
- Data retention: Industry-standard for the domain
- Performance: Standard web/mobile expectations unless specified
- Error handling: User-friendly messages with fallbacks
- Authentication: Standard session-based or OAuth2 for web apps
- Integration patterns: Project-appropriate (REST/GraphQL for web, etc.)

### Common PRD Failures to Avoid

These are antipatterns — if you catch yourself doing any of these, stop and fix:

1. ❌ **Describing the solution before proving the problem** — always fill 1.2 Problem Statement first
2. ❌ **PRD with no scope boundaries** — always fill 1.5 Scope with both columns
3. ❌ **Untestable requirements** — every FR must have trigger/input/output
4. ❌ **Claimed success with no indicators** — every KPI must be measurable
5. ❌ **Missing traceability** — orphaned FRs or ACs break the audit

### Success Metrics Guidelines

Must be: **Measurable**, **Technology-agnostic**, **User-focused**, **Verifiable**.

| ✅ Good | ❌ Bad (implementation-focused) |
|---------|-------------------------------|
| "Users complete checkout in under 3 minutes" | "API response under 200ms" |
| "System supports 10,000 concurrent users" | "Database handles 1000 TPS" |
| "95% of searches return results in under 1 second" | "React components render efficiently" |
| "Task completion rate improves by 40%" | "Redis cache hit rate above 80%" |

Context for generation: $ARGUMENTS

## Output

- **Primary format**: PRD generation summary in Markdown.
- **Files created or updated**: New feature `sys.md` and `checklists/requirements.md`.
- **Success result**: Branch name, sys file path, PRD maturity level, checklist status, traceability status, and remaining clarification markers.
- **Exit status**: `0` when the PRD validates and is written; `1` when branch creation fails, the problem statement cannot be derived, or validation cannot reach an acceptable state.
- **Failure conditions**: Empty feature description, missing template, unresolved critical validation failures after retry, or write failure for the generated PRD.
