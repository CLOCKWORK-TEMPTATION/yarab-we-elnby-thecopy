# Deep Research Plan: [CONCEPT_NAME]

<!--
  This document is a DEEP RESEARCH PLAN AND DELIVERY CONTRACT.
  It defines WHAT to research, WHY, HOW, and what the research output must contain.
  
  This is NOT the research report itself — it is the research brief that governs
  the research process and defines the acceptance criteria for the research output.
  
  The research report (sections 12-13) is filled AFTER the research is complete.
  
  RULES:
  - Every claim must cite a source or be marked as inference/assumption
  - Distinguish clearly between: FACT, CONCLUSION, and SPECULATION
  - When sources conflict, report the conflict — never hide it
  - Prioritize newer sources ONLY when recency matters
  - No drifting into implementation or detailed design before research concludes
  - No repeating general knowledge that doesn't serve a decision
  - No relying on weak sources when primary sources exist
  
  RESEARCH DEPTH LEVELS:
  | Depth | When to use | Expected output | Timeframe |
  |-------|-------------|-----------------|-----------|
  | Surface | Quick validation, minor feature | 1-2 page summary, key findings only | Hours |
  | Medium | Standard feature, known domain | Full report, key questions answered | 1-2 days |
  | Deep | New domain, high-risk, multi-team | Comprehensive report, all hypotheses tested | 3-5 days |
  | Very Deep | Regulatory, novel technology, pivotal decision | Exhaustive report, external validation | 1-2 weeks |
  
  Sections marked (mandatory) must always be completed.
  Sections marked (conditional) depend on research type or depth.
  Sections marked (output) are filled by the research agent after execution.
-->

## Research Card

| Field | Value |
|-------|-------|
| **Concept / Feature** | [CONCEPT_NAME] |
| **Version** | 1.0 |
| **Created** | [DATE] |
| **Author** | [AUTHOR_OR_AGENT] |
| **Source** | [sys.md / validate output / user request] |
| **Research Readiness** | ☐ Ready ☐ Ready with Assumptions ☐ Not Ready |
| **Research Type** | ☐ Exploratory ☐ Validation ☐ Comparative ☐ Market ☐ Technical ☐ Behavioral ☐ Operational ☐ Legal ☐ Multi-axis |
| **Research Depth** | ☐ Surface ☐ Medium ☐ Deep ☐ Very Deep |
| **Time Priority** | ☐ High ☐ Medium ☐ Low |
| **Timeframe** | [TIMEFRAME] |
| **Geography** | [GEOGRAPHY or N/A] |
| **Domain / Sector** | [DOMAIN] |
| **Linked Sys** | [link to sys.md if exists] |
| **Feature Branch** | `[###-feature-name]` |

---

## 1. Executive Summary from Source *(mandatory)*

<!--
  Extract from sys.md or validate output. This grounds the research in context.
  If no sys exists yet, fill from user's concept description.
-->

### 1.1 Core Problem
[PROBLEM_STATEMENT]

### 1.2 Primary User
[PRIMARY_USER]

### 1.3 Pain / Need / Current Impact
[PAIN_OR_IMPACT]

### 1.4 Current Alternative or Status Quo
[CURRENT_ALTERNATIVE]

### 1.5 Value Proposition
[VALUE_PROPOSITION]

### 1.6 Why This Concept is Better
[WHY_BETTER]

### 1.7 Initial Scope Boundary
[INITIAL_SCOPE_BOUNDARY]

### 1.8 Riskiest Assumption
[RISKIEST_ASSUMPTION]

### 1.9 Initial Success Metric
[INITIAL_SUCCESS_METRIC]

---

## 2. Research Decision: Why Research? *(mandatory)*

<!--
  Justify why research is needed before proceeding.
  Link to unknowns in sys.md Technical Context or plan.md NEEDS CLARIFICATION markers.
-->

**Research Purpose:**
[RESEARCH_PURPOSE]

**Core Research Question:**
[CORE_RESEARCH_QUESTION]

---

## 3. Research Goal *(mandatory)*

<!--
  What decision will this research enable?
  The research must produce ACTIONABLE knowledge, not just information.
-->

**Decision Target:**
[DECISION_TARGET — what knowledge is needed to make a decision]

**Expected Decision After Research:**
- ☐ Proceed to Define / Plan
- ☐ Modify the concept
- ☐ Narrow the scope
- ☐ Change the target user segment
- ☐ Change the core hypothesis
- ☐ Stop the idea
- ☐ Other: [OTHER_DECISION]

---

## 4. Research Questions *(mandatory)*

<!--
  These are the questions the research agent must answer.
  Organize by category. Minimum 3 questions per applicable category.
  Skip categories not relevant to this research type.
-->

### 4.1 Problem Questions
1. [RQ_PROBLEM_1]
2. [RQ_PROBLEM_2]
3. [RQ_PROBLEM_3]

### 4.2 User & Behavior Questions
1. [RQ_USER_1]
2. [RQ_USER_2]
3. [RQ_USER_3]

### 4.3 Market & Alternatives Questions
1. [RQ_MARKET_1]
2. [RQ_MARKET_2]
3. [RQ_MARKET_3]

### 4.4 Solution & Value Questions
1. [RQ_SOLUTION_1]
2. [RQ_SOLUTION_2]
3. [RQ_SOLUTION_3]

### 4.5 Technical Feasibility Questions *(conditional — if research type includes technical)*
1. [RQ_TECH_1]
2. [RQ_TECH_2]
3. [RQ_TECH_3]

### 4.6 Risk & Constraint Questions
1. [RQ_RISK_1]
2. [RQ_RISK_2]
3. [RQ_RISK_3]

### 4.7 Decision Questions
1. [RQ_DECISION_1]
2. [RQ_DECISION_2]
3. [RQ_DECISION_3]

---

## 5. Hypotheses & Assumptions *(mandatory)*

<!--
  Explicit separation between:
  - Hypotheses: claims to be VALIDATED or INVALIDATED by research
  - Assumptions: things taken as true that must be TESTED not assumed
  - Anti-patterns: things to actively RULE OUT or warn against
-->

### 5.1 Hypotheses to Validate
- [HYPOTHESIS_TO_VALIDATE_1]
- [HYPOTHESIS_TO_VALIDATE_2]
- [HYPOTHESIS_TO_VALIDATE_3]

### 5.2 Assumptions to Test (not to accept blindly)
- [ASSUMPTION_TO_TEST_1]
- [ASSUMPTION_TO_TEST_2]
- [ASSUMPTION_TO_TEST_3]

### 5.3 Things to Rule Out or Warn Against
- [THING_TO_RULE_OUT_1]
- [THING_TO_RULE_OUT_2]
- [THING_TO_RULE_OUT_3]

---

## 6. Research Boundaries *(mandatory)*

### 6.1 In Scope
- [IN_SCOPE_1]
- [IN_SCOPE_2]
- [IN_SCOPE_3]

### 6.2 Out of Scope
- [OUT_OF_SCOPE_1]
- [OUT_OF_SCOPE_2]
- [OUT_OF_SCOPE_3]

### 6.3 Prohibitions
- No drifting into implementation or detailed design before research concludes
- No repeating general knowledge that doesn't serve the decision
- No relying on weak sources when primary sources exist
- No hiding contradictions between sources

---

## 7. Required Sources & Priority *(mandatory)*

<!--
  Order sources by reliability. Primary sources always take precedence.
-->

### 7.1 Primary Sources (highest priority)
- Official documentation
- Research papers
- Original company/product websites
- Published data from original entities
- Technical contract details
- Original financial/operational reports (if relevant)

### 7.2 Strong Secondary Sources
- Trusted technical analyses
- Specialized comparisons
- Expert reviews
- Reputable market reports

### 7.3 Supporting Sources Only (lowest priority)
- Interviews
- Community discussions
- User experiences
- Specialized forums

### 7.4 Citation Rules
- Cite the source for every non-obvious claim
- Clearly distinguish between: **FACT**, **CONCLUSION**, and **SPECULATION**
- When sources conflict, report the conflict explicitly
- Prioritize newer sources only when recency actually matters

---

## 8. Research Methodology *(mandatory)*

<!--
  The research agent must follow these phases in order.
-->

### Phase A: Question Decomposition
- Convert the core research question into research axes
- Extract key terms and synonyms
- Identify what needs surface vs deep research

### Phase B: Initial Survey
- Build an initial landscape map of the domain
- Collect major trends, players, and alternatives
- Discover knowledge gaps
- Update sub-questions if needed

### Phase C: Evidence Deepening
- Collect direct evidence for each main research question
- Compare alternatives and existing solutions
- Test core hypotheses against evidence
- Extract challenges, constraints, and opportunities

### Phase D: Synthesis
- Convert findings into clear conclusions
- Link each conclusion to a specific research question
- State what was validated, what was invalidated, and what remains unknown
- Assess impact on the proceed/stop decision

### Phase E: Final Recommendation
- Clear, reasoned verdict
- Does the concept deserve to proceed?
- What must change before Define/Plan?
- What must be deferred?
- What requires caution?

---

## 9. Quality Criteria *(mandatory)*

### Research is REJECTED if:
- It is descriptive with no decision
- It confuses opinion with fact
- It ignores current alternatives
- It does not test the riskiest assumption
- It does not define scope boundaries
- It does not link findings to an actionable decision
- It does not state confidence levels for conclusions

### Research is ACCEPTED if:
- It answers the core research question clearly
- It tests critical hypotheses
- It reveals real risks
- It compares alternatives usefully
- It ends with an actionable decision or recommendation

---

## 10. Declared Assumptions from Source *(mandatory)*

<!--
  Any information not yet confirmed but temporarily accepted.
  These come from sys.md Clarification Contract (ASM-XXX) or validate output.
-->

- [DECLARED_ASSUMPTION_1]
- [DECLARED_ASSUMPTION_2]
- [DECLARED_ASSUMPTION_3]

---

<!--
  ============================================================================
  SECTIONS BELOW ARE FILLED BY THE RESEARCH AGENT AFTER EXECUTION
  ============================================================================
-->

## 11. Research Report *(output — filled after research execution)*

### 11.1 Executive Summary

<!--
  1-2 paragraph summary of findings and recommendation.
-->

[EXEC_SUMMARY]

### 11.2 Domain Landscape Map

<!--
  Key players, trends, technologies, and market state.
-->

[LANDSCAPE]

### 11.3 Research Question Answers

<!--
  Answer each question from Section 4, citing sources.
  Format: Question → Answer → Source → Confidence (High/Medium/Low)
-->

| # | Question | Answer | Source | Confidence |
|---|----------|--------|--------|-----------|
| 4.1.1 | [question] | [answer] | [source] | High/Med/Low |

### 11.4 Evidence & Sources

<!--
  Full citation list with reliability assessment.
-->

| # | Source | Type | Reliability | Date | URL/Reference |
|---|--------|------|------------|------|---------------|
| 1 | [source] | Primary/Secondary/Supporting | High/Med/Low | [date] | [ref] |

### 11.5 Hypotheses: Validated vs Invalidated

| # | Hypothesis | Status | Evidence | Confidence |
|---|-----------|--------|----------|-----------|
| H1 | [hypothesis] | ✅ Validated / ❌ Invalidated / ⚠️ Inconclusive | [evidence] | High/Med/Low |

### 11.6 Risks & Constraints Discovered

| # | Risk/Constraint | Severity | Impact | Mitigation |
|---|----------------|----------|--------|-----------|
| 1 | [risk] | CRITICAL/HIGH/MEDIUM/LOW | [impact] | [mitigation] |

### 11.7 Opportunities for Improvement or Repositioning

- [OPPORTUNITY_1]
- [OPPORTUNITY_2]

### 11.8 Final Recommendation

[RECOMMENDATION — clear, actionable, with reasoning]

### 11.9 Readiness for Define/Plan

- ☐ Ready
- ☐ Ready with conditions
- ☐ Not ready

**Explanation:** [clear reasoning]

---

## 12. Final Judgment *(output — filled after research execution)*

<!--
  This is the formal verdict that gates the next phase.
-->

| Field | Value |
|-------|-------|
| **Verdict** | [PROCEED / PROCEED WITH CHANGES / STOP / PIVOT] |
| **Confidence Level** | [HIGH / MEDIUM / LOW] |

**Reasons:**
1. [REASON_1]
2. [REASON_2]
3. [REASON_3]

**Required Actions Before Define/Plan:**
1. [PRE_DEFINE_ACTION_1]
2. [PRE_DEFINE_ACTION_2]
3. [PRE_DEFINE_ACTION_3]

---

## 13. Delivery Notes *(mandatory)*

- This document contains both the research plan (sections 1-10) and the research results (sections 11-12)
- The research agent must stay focused on the core research question — no drifting
- Any critical gap discovered during research must be flagged explicitly
- Any change in problem definition or target user must be raised as an early warning
- Source conflicts must be reported, never hidden
- Confidence levels must be honest — unknown is better than false certainty
