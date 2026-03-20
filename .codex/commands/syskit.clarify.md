---
description: Run the clarification phase — resolve ambiguity in the feature sys using targeted questions, document assumptions, produce a mandatory Clarification Contract, and verify readiness for planning.
handoffs: 
  - label: Generate Constitution
    agent: syskit.constitution
    prompt: Generate the project constitution based on the clarified sys
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Goal: Detect and reduce ambiguity or missing decision points in the active feature systematize document, produce a mandatory **Clarification Contract**, and record everything directly in the sys file.

Note: This clarification workflow is mandatory and must complete BEFORE invoking `/syskit.constitution`. The enforced workflow is: `/syskit.systematize` → `/syskit.clarify` → `/syskit.constitution` → `/syskit.research` → `/syskit.plan`.

### Governing Principles

These principles are **non-negotiable** and govern every decision in this phase:

1. **Clarification is for resolving ambiguity that blocks correct execution** — not for collecting information randomly or extending dialogue.
2. **Only ask about what changes an engineering decision** — a question is valid ONLY if its answer materially impacts design, architecture, behavior, constraints, or priorities.
3. **Never ask about what can be inferred** — if the answer can be reliably derived from the task description, attached context, existing system, or known technical conventions, do NOT ask.
4. **Convert vague ambiguity into specific decision points** — instead of "What do you want exactly?", extract concrete decisions like: "Is backward compatibility required?" or "What is the acceptable response time?"
5. **Distinguish critical unknowns from non-critical unknowns**:
   - **Critical**: Blocks execution or may produce a fundamentally wrong solution → MUST ask.
   - **Non-critical**: Can be resolved with a reasonable documented assumption → assume and document.
   - Work MUST NOT stop for non-critical unknowns.
6. **Use documented operational assumptions when possible** — if you can proceed without returning to the user, place explicit assumptions like: "Assuming production environment", "Assuming backward compatibility required", "Assuming functional correctness over cosmetic improvements".
7. **Questions must be directly answerable** — short, specific, no ambiguous interpretations, leading to one or a few clear decisions.
8. **Order questions by impact** — start from: Final goal → Scope boundaries → Mandatory constraints → Acceptance criteria → Secondary implementation details.
9. **Define what is OUT of scope** — one of the most important outputs is explicitly stating what will NOT be done, to prevent scope creep.
10. **Every answer must become an actionable artifact** — each clarification becomes: a design rule, an implementation constraint, an acceptance criterion, a priority decision, or an architectural decision.
11. **Detect contradictions before execution begins** — the clarification phase must expose conflicts like: high speed + no simplification allowed, lowest cost + highest reliability without tradeoff, limited change + fundamental architecture redesign.
12. **Good clarification reduces rework** — success is measured by reduction in: returning to user later, repeated modifications, misunderstandings, deviation from requirements.
13. **The phase ends with a mini execution contract** — the output must clearly define: what is required, what is not required, constraints, assumptions, and success criteria.

### Escalation Rule

> **MANDATORY**: If answering a question would change the architecture, threaten functional safety, or invalidate a mandatory constraint — you MUST NOT assume. You MUST escalate to the user immediately regardless of the question quota.

### Execution Steps

1. Run the prerequisites check script from repo root **once**. Parse:
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json --paths-only`
   - `FEATURE_DIR`
   - `FEATURE_SYS`
   - If JSON parsing fails, abort and instruct user to re-run `/syskit.systematize`.

2. **Load** the current sys file. Perform a structured ambiguity & coverage scan using this taxonomy. For each category, mark status: Clear / Partial / Missing.

   **Functional Scope & Behavior:**
   - Core user goals & success criteria
   - Explicit out-of-scope declarations
   - User roles / personas differentiation

   **Domain & Data Model:**
   - Entities, attributes, relationships
   - Identity & uniqueness rules
   - Lifecycle/state transitions
   - Data volume / scale assumptions

   **Interaction & UX Flow:**
   - Critical user journeys / sequences
   - Error/empty/loading states
   - Accessibility or localization notes

   **Non-Functional Quality Attributes:**
   - Performance (latency, throughput targets)
   - Scalability (horizontal/vertical, limits)
   - Reliability & availability (uptime, recovery expectations)
   - Observability (logging, metrics, tracing signals)
   - Security & privacy (authN/Z, data protection, threat assumptions)
   - Compliance / regulatory constraints (if any)

   **Integration & External Dependencies:**
   - External services/APIs and failure modes
   - Data import/export formats
   - Protocol/versioning assumptions

   **Edge Cases & Failure Handling:**
   - Negative scenarios
   - Rate limiting / throttling
   - Conflict resolution (e.g., concurrent edits)

   **Constraints & Tradeoffs:**
   - Technical constraints (language, storage, hosting)
   - Explicit tradeoffs or rejected alternatives

   **Terminology & Consistency:**
   - Canonical glossary terms
   - Avoided synonyms / deprecated terms

   **Completion Signals:**
   - Acceptance criteria testability
   - Measurable Definition of Done indicators

   **Misc / Placeholders:**
   - TODO markers / unresolved decisions
   - Ambiguous adjectives ("robust", "intuitive") lacking quantification

   For each Partial or Missing category, generate a candidate question ONLY if (per Principle 2) the answer would materially change an engineering decision. Skip if:
   - The answer can be inferred (Principle 3)
   - The unknown is non-critical and can be assumed (Principle 5/6)
   - Better deferred to planning phase

3. **Classify unknowns** before generating questions:

   | Unknown | Critical? | Reasoning | Action |
   |---------|-----------|-----------|--------|
   | [unknown] | Yes/No | [why] | Ask / Assume / Defer |

   - Critical unknowns → become questions (max 5).
   - Non-critical unknowns → become documented assumptions (written to `### Assumptions` in the Clarification Contract).
   - Deferred items → noted in final report.

4. **Generate question queue** (maximum 5, internally prioritized). Apply:
    - Maximum 5 total questions across the session.
    - Each question must be answerable with EITHER:
       - A short multiple-choice selection (2–5 options), OR
       - A one-word / short-phrase answer (≤5 words).
    - Priority by: (Impact × Uncertainty) heuristic.
    - Category balance: cover highest-impact unresolved categories first.
    - Exclude: already answered, trivial preferences, plan-level details (unless blocking correctness).
    - Favor: clarifications that reduce rework risk or prevent misaligned acceptance tests.

5. **Sequential questioning loop** (interactive):
    - Present EXACTLY ONE question at a time.
    - For multiple-choice:
       - **Analyze all options** and determine the best based on: best practices, common patterns, risk reduction, alignment with project goals.
       - Present recommendation: `**Recommended:** Option [X] - <reasoning>`
       - Render options as Markdown table:

       | Option | Description |
       |--------|-------------|
       | A | <description> |
       | B | <description> |
       | C | <description> |
       | Short | Provide a different short answer (≤5 words) |

       - After table: `Reply with the option letter, "yes"/"recommended" to accept, or your own short answer.`
    - For short-answer (no discrete options):
       - `**Suggested:** <answer> - <reasoning>`
       - `Format: Short answer (≤5 words). Say "yes"/"suggested" to accept, or provide your own.`
    - After user answers:
       - "yes"/"recommended"/"suggested" → use stated recommendation.
       - Validate answer maps to option or fits ≤5 word constraint.
       - If ambiguous → quick disambiguation (same question, not a new one).
       - Record in working memory, advance to next question.
    - **Stop when**:
       - All critical ambiguities resolved, OR
       - User signals completion ("done", "good", "no more"), OR
       - 5 questions reached.
    - **Escalation override** (Principle — Escalation Rule): if during the loop you discover an answer would change architecture or threaten safety → escalate immediately to user, even if it means exceeding the display of a single question. This does NOT count against the 5-question quota.

6. **Integration after EACH accepted answer**:
    - First answer in session → ensure `## Clarification Contract` section exists in sys. Under `### Critical Questions Resolved`, create `#### Session YYYY-MM-DD` if not present.
    - Append: `- Q: <question> → A: <answer> → Impact: <section/decision affected>`
    - Apply the clarification to the appropriate sys section:
       - Functional → update Functional Requirements
       - User interaction → update User Stories
       - Data → update Key Entities
       - Non-functional → add measurable criteria to NFR section
       - Edge case → add to Edge Cases
       - Terminology → normalize across sys
    - If clarification invalidates earlier text in sys → replace (no contradictions).
    - **Save after each integration** (atomic overwrite).
    - Keep heading hierarchy intact. Keep insertions minimal and testable.

7. **Populate the Clarification Contract** (after all questions or early termination):

   Fill the `## Clarification Contract` section in the sys with:

   - **What Is Required**: concrete deliverables/behaviors derived from clarifications.
   - **What Is NOT Required**: explicitly excluded items.
   - **Constraints**: technical, organizational, or business constraints surfaced.
   - **Assumptions**: all non-critical unknowns resolved by assumption (format: `ASM-XXX: [assumption] — Reason: [why] — If wrong: [impact]`).
   - **Critical Questions Resolved**: already filled incrementally in step 6.
   - **Success Criteria**: measurable criteria for "done".
   - **Clarification Checklist**: update each item to ☐ Yes or ☐ No.

   The Clarification Contract is the mandatory output of this phase. It is the "mini execution contract" (Principle 13). If any checklist item is ☐ No, warn that the sys is not ready for `/syskit.constitution`.

8. **Validation** (after each write + final pass):
   - Questions Resolved section has exactly one bullet per accepted answer.
   - Total asked questions ≤ 5 (escalations excluded).
   - No vague placeholders remain that an answer was meant to resolve.
   - No contradictory earlier statement left.
   - All assumptions have ID, reason, and impact.
   - Clarification Checklist accurately reflects current state.
   - Markdown structure valid; heading hierarchy preserved.
   - Terminology consistency across all updated sections.

9. **Write** the updated sys back to `FEATURE_SYS`.

10. **Report completion**:
    - Number of questions asked & answered.
    - Number of assumptions documented.
    - Path to updated sys.
    - Sections touched.
    - Clarification Contract status (complete / incomplete — list missing items).
    - Checklist results (X/6 items satisfied).
    - Coverage summary table:

    | Category | Status | Action Taken |
    |----------|--------|-------------|
    | [category] | Resolved / Assumed / Deferred / Clear / Outstanding | [what was done] |

    - If Outstanding or Deferred remain → recommend re-running `/syskit.clarify` or proceeding with documented risk.
    - Suggested next command. Default to `/syskit.constitution` only when the Clarification Contract is complete; otherwise recommend re-running `/syskit.clarify`.

### Behavior Rules

- If no meaningful ambiguities found → respond: "No critical ambiguities detected. Clarification Contract populated with inferred values." Fill the contract with inferred data and suggest proceeding.
- If sys file missing → instruct user to run `/syskit.systematize` first.
- Never exceed 5 asked questions (retries don't count; escalations don't count).
- Avoid speculative tech stack questions unless absence blocks functional clarity.
- Respect early termination signals ("stop", "done", "proceed").
- If quota reached with unresolved high-impact categories → flag under Deferred with rationale.
- Non-critical unknowns MUST become documented assumptions, never unanswered gaps.

### Before/After Examples

**Bad question** (violates Principle 3 — can be inferred):
> "What programming language should we use?" — when the repo is clearly TypeScript.

**Good question** (Principle 2 — changes engineering decision):
> "Should the search be real-time (WebSocket) or on-demand (REST)?" — directly impacts architecture.

**Bad assumption** (violates Escalation Rule):
> "Assuming no authentication needed" — when the sys mentions user roles.

**Good assumption** (Principle 6 — non-critical, documented):
> "ASM-001: Assuming PostgreSQL as database — Reason: existing project stack — If wrong: migration effort for data layer"

Context for prioritization: $ARGUMENTS

## Output

- **Primary format**: Interactive clarification flow followed by a completion summary in Markdown.
- **Files created or updated**: Active feature `sys.md`.
- **Success result**: Clarification Contract, resolved critical questions, documented assumptions, touched sections, and readiness status for planning.
- **Exit status**: `0` when the contract is updated successfully; `1` when `sys.md` is missing or critical ambiguity remains unresolved.
- **Failure conditions**: Missing feature context, invalid question answers after retry, contradictory requirements that cannot be reconciled, or save failures.
