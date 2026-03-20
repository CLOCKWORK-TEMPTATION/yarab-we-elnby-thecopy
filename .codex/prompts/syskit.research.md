---
description: "Generate a deep, structured research plan and execute research for a feature concept — covering problem validation, user behavior, market analysis, technical feasibility, risk assessment, and go/no-go recommendation. Produces research.md using the 13-section research template with 5-phase methodology (Decompose → Survey → Deepen → Synthesize → Recommend)."
handoffs:
  - label: Create Implementation Plan
    agent: syskit.plan
    prompt: Create the implementation plan based on research findings
  - label: Update Sys
    agent: syskit.systematize
    prompt: Update the sys based on research findings
  - label: Run Clarification
    agent: syskit.clarify
    prompt: Clarify unknowns discovered during research
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

---

## Goal

Generate a **deep research plan** for a feature concept, then **execute the research** following a 5-phase methodology, and produce a complete `research.md` document that enables an informed go/no-go decision before proceeding to `/syskit.plan`.

The research covers 7 question categories:
1. **Problem Questions** — Is the problem real, significant, and worth solving?
2. **User & Behavior Questions** — Who is affected, how do they behave today?
3. **Market & Alternatives Questions** — What exists, what's the competitive landscape?
4. **Solution & Value Questions** — Does our approach create real value?
5. **Technical Feasibility Questions** — Can we build this within constraints?
6. **Risk & Constraint Questions** — What could go wrong, what limits us?
7. **Decision Questions** — What must be true for us to proceed?

The research follows 5 methodology phases:
- **Phase A**: Question Decomposition — break down the core question into research axes
- **Phase B**: Initial Survey — build a landscape map, discover gaps
- **Phase C**: Evidence Deepening — collect direct evidence, test hypotheses
- **Phase D**: Synthesis — convert findings into conclusions linked to questions
- **Phase E**: Final Recommendation — clear verdict with reasoning

This command runs **after** `/syskit.constitution` in the standard workflow: `/syskit.systematize` → `/syskit.clarify` → `/syskit.constitution` → `/syskit.research` → `/syskit.plan`. It requires the active `sys.md` and a completed constitution.

---

## Operating Constraints

**Constitution Authority**: `.Systematize/memory/constitution.md` is non-negotiable. Research must not contradict constitution governing rules.

**Evidence-Based Only**: Every claim must cite a source or be explicitly marked as inference/assumption. No unsourced assertions.

**Honest Confidence**: Unknown is better than false certainty. Always state confidence levels (High/Medium/Low) for conclusions.

**Source Hierarchy**: Primary sources > Strong secondary > Supporting only. Never rely on weak sources when primary sources exist.

**No Implementation Drift**: Research must not drift into implementation details or detailed design. Stay at the problem/feasibility/decision level.

**Conflict Transparency**: When sources conflict, report the conflict explicitly. Never hide contradictions.

**ID System Compliance**: Use project ID system where applicable (`ASM-XXX` for assumptions, `RK-XXX` for risks discovered).

---

## Execution Steps

### Phase 1 — Initialize Research Context

Run the prerequisites check script from repo root. Parse JSON for `FEATURE_DIR` and `AVAILABLE_DOCS`. Derive absolute paths:
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`

- `SYS`          = FEATURE_DIR/sys.md
- `PLAN`         = FEATURE_DIR/plan.md (may not exist yet)
- `RESEARCH`     = FEATURE_DIR/research.md (target output)
- `CONSTITUTION` = .Systematize/memory/constitution.md
- `TEMPLATE`     = .Systematize/templates/research-template.md

Use `sys.md` as the primary input. If it is missing, stop and direct the user to `/syskit.systematize`.

For arguments with single quotes, use escape syntax: `'I'\''m Groot'` or double-quote: `"I'm Groot"`.

---

### Phase 2 — Extract Research Inputs

**If sys.md exists, extract:**
- Problem Statement (§1.2)
- Target Users (§2.1)
- Use Case Scenarios (§2.2) — to understand what the concept aims to do
- Scope in/out (§1.5) — to bound the research
- Clarification Contract — especially Assumptions (`ASM-XXX`) and unresolved questions
- Key Entities (§3.4) — to understand the domain
- Non-Functional Requirements (§3.2) — to bound technical feasibility
- Risk Registry (§5.2) — existing known risks
- NEEDS CLARIFICATION markers — these become research questions

**If plan.md exists, also extract:**
- Technical Context fields with NEEDS CLARIFICATION → mandatory research targets
- Architecture decisions that need validation
- Integration unknowns

If `sys.md` is missing or the constitution is incomplete, fail instead of inventing a parallel path.

---

### Phase 3 — Generate Research Plan (Sections 1–10)

Read `.Systematize/templates/research-template.md` and fill sections 1–10:

**3.1 — Fill Research Card:**
- Concept name, version, date, author
- Determine research type based on unknowns:
  - Many NEEDS CLARIFICATION in tech → Technical
  - New market/domain → Market + Exploratory
  - Uncertain user need → Behavioral + Validation
  - Multiple types → Multi-axis
- Determine research depth:
  - ≤3 unknowns, known domain → Surface
  - 4–8 unknowns, familiar domain → Medium
  - 9+ unknowns or new domain → Deep
  - Regulatory, novel tech, pivotal decision → Very Deep
- Set readiness status

**3.2 — Fill Executive Summary (§1):**
- Extract from sys.md or concept description
- All 9 sub-sections must have content

**3.3 — Fill Research Decision (§2):**
- Articulate WHY research is needed
- State the CORE research question — one sentence that captures the central unknown

**3.4 — Fill Research Goal (§3):**
- What decision will this enable?
- Mark the expected decision type

**3.5 — Generate Research Questions (§4):**
- Minimum 3 questions per applicable category (7 categories)
- Each question must be:
  - Specific enough to research
  - Linked to a decision or hypothesis
  - Answerable with available research methods
- Questions from NEEDS CLARIFICATION markers are mandatory
- Questions from ASM-XXX assumptions are mandatory

**3.6 — Fill Hypotheses & Assumptions (§5):**
- Convert sys.md assumptions (`ASM-XXX`) to testable hypotheses
- Extract implicit assumptions from the concept
- Identify things that should be actively ruled out

**3.7 — Fill Research Boundaries (§6):**
- In scope: aligned with sys.md scope
- Out of scope: aligned with sys.md exclusions
- Prohibitions: always include the 4 standard prohibitions

**3.8 — Fill Required Sources (§7):**
- Customize based on domain and research type
- Maintain the 3-tier hierarchy

**3.9 — Fill Methodology (§8):**
- Use the 5-phase methodology (A–E)
- Customize phase details based on research type

**3.10 — Fill Quality Criteria (§9) and Declared Assumptions (§10):**
- Import ASM-XXX from sys.md
- Add any research-specific assumptions

---

### Phase 4 — Execute Research (Methodology Phases A–E)

Execute the research following the methodology defined in §8:

**Phase A — Question Decomposition:**
1. Convert the core research question into research axes
2. Extract key terms, synonyms, and search strategies
3. Identify what needs surface vs deep research
4. Prioritize: riskiest assumption questions first

**Phase B — Initial Survey:**
1. Build an initial landscape map of the domain
2. Collect major trends, players, and alternatives
3. Discover knowledge gaps not anticipated in the plan
4. Update sub-questions if new unknowns emerge

**Phase C — Evidence Deepening:**
1. Collect direct evidence for each research question (§4)
2. Compare alternatives and existing solutions
3. Test each hypothesis (§5.1) against evidence
4. Test each assumption (§5.2) — do not accept blindly
5. Extract challenges, constraints, and opportunities

**Phase D — Synthesis:**
1. Convert findings into clear conclusions
2. Link EVERY conclusion to a specific research question
3. State for each hypothesis: ✅ Validated / ❌ Invalidated / ⚠️ Inconclusive
4. State confidence level for each conclusion
5. Identify what remains UNKNOWN
6. Assess impact on proceed/stop decision

**Phase E — Final Recommendation:**
1. Clear, reasoned verdict: PROCEED / PROCEED WITH CHANGES / STOP / PIVOT
2. What must change before Define/Plan?
3. What must be deferred?
4. What requires caution?
5. Confidence level for the overall recommendation

---

### Phase 5 — Fill Research Report (Sections 11–12)

Fill the output sections of research.md:

**§11 Research Report:**
- §11.1 Executive Summary — 1-2 paragraphs of findings + recommendation
- §11.2 Domain Landscape Map — key players, trends, technologies
- §11.3 Research Question Answers — answer each §4 question with source and confidence
- §11.4 Evidence & Sources — full citation list with reliability assessment
- §11.5 Hypotheses Results — validated/invalidated/inconclusive for each
- §11.6 Risks & Constraints — discovered during research, with severity
- §11.7 Opportunities — improvements or repositioning possibilities
- §11.8 Final Recommendation — clear, actionable
- §11.9 Readiness Assessment — Ready / Ready with conditions / Not ready

**§12 Final Judgment:**
- Verdict + Confidence Level
- 3+ reasons for the verdict
- 3+ required actions before Define/Plan

**§13 Delivery Notes** — always filled

---

### Phase 6 — Write and Report

1. Write the complete research.md to FEATURE_DIR/research.md
2. Report to user:
   - Research type and depth used
   - Number of questions researched
   - Number of hypotheses tested (validated/invalidated/inconclusive)
   - Number of risks discovered
   - Final verdict and confidence
   - Readiness status
   - Next step recommendation:
     - If Ready: `/syskit.plan`
     - If Ready with conditions: list conditions, then `/syskit.plan`
     - If Not ready: list blockers, suggest `/syskit.clarify` or more research

---

## Rules

### Research Plan Quality
- Every research question must be specific and answerable
- Every hypothesis must be testable
- Scope boundaries must be explicit
- The core research question must be ONE sentence

### Research Execution Quality
- Every claim must have a source citation or be marked as inference
- Distinguish between FACT, CONCLUSION, and SPECULATION
- When sources conflict, report the conflict
- Prioritize primary sources over secondary
- State confidence levels honestly

### Report Quality
- Every research question from §4 must have an answer in §11.3
- Every hypothesis from §5 must have a result in §11.5
- The verdict must be justified with specific evidence
- The recommendation must be actionable
- Unknown gaps must be explicitly stated

### Integration Rules
- `ASM-XXX` assumptions from sys.md become testable hypotheses
- `RK-XXX` risks from sys.md are validated or updated
- NEEDS CLARIFICATION markers from sys.md and constitution-derived assumptions become mandatory research targets
- Research findings feed directly into `/syskit.plan` drafting decisions
- New risks discovered → feed into sys.md Risk Registry and plan.md Risk Registry

### Token Efficiency
- Do not dump raw source material — synthesize
- Limit evidence table to top 20 most relevant sources
- Research question answers should be concise (2-4 sentences each)
- Landscape map: key findings only, not exhaustive

---

## Operating Principles

### Evidence Integrity
- **NEVER fabricate sources** — if you can't find evidence, say so
- **NEVER hide contradictions** between sources
- **NEVER overstate confidence** — "I don't know" is a valid and valuable finding
- **ALWAYS cite sources** for non-obvious claims

### Research Discipline
- **NEVER drift into implementation** during research
- **NEVER accept assumptions blindly** — test them
- **ALWAYS answer the core research question** — don't get sidetracked
- **ALWAYS test the riskiest assumption** — this is the highest priority

### Decision Focus
- Research exists to ENABLE A DECISION, not to collect information
- Every finding must connect to a research question
- Every conclusion must state its confidence level
- The final verdict must be clear and actionable

## Context

$ARGUMENTS

## Output

- **Primary format**: Research execution summary in Markdown.
- **Files created or updated**: `research.md`.
- **Success result**: Research type and depth, questions answered, hypotheses evaluated, risks discovered, verdict, confidence, and next-step recommendation.
- **Exit status**: `0` when the full research document is written; `1` when the concept cannot be scoped well enough, evidence collection fails, or the research template cannot be completed.
- **Failure conditions**: Missing baseline context, unsupported concept vagueness after clarification, unresolved mandatory research questions, or write failure for `research.md`.
