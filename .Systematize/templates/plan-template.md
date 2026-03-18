# Implementation Plan: [FEATURE]

<!--
  This plan is the GOVERNING EXECUTION REFERENCE for building this feature.
  Golden Rule: No implementation starts before this plan is approved.
  No significant change is accepted without updating this plan.
  
  The sys (PRD) defines WHAT to build. This plan defines HOW to build it.
  Sections marked (mandatory) must be completed before execution.
  Sections marked (conditional) are required based on project type.
  Sections marked (optional) are included when relevant.
-->

## Plan Card

| Field | Value |
|-------|-------|
| **Branch** | `[###-feature-name]` |
| **Date** | [DATE] |
| **Sys** | [link to sys.md] |
| **Plan Version** | 1.0 |
| **Status** | ☐ Draft ☐ Under Review ☐ Approved |
| **Readiness** | ☐ Not Ready ☐ Preliminary ☐ Ready for Execution |
| **Product Manager** | [Name] |
| **Technical Lead** | [Name] |
| **Target Launch** | [DATE] |
| **Project Profile** | ☐ S (Small) ☐ M (Medium) ☐ L (Large) |

<!--
  PROJECT PROFILE GUIDE:
  Determines which conditional sections are required and the expected depth of mandatory sections.

  | Profile | Criteria | Conditional Sections | Mandatory Section Depth |
  |---------|----------|---------------------|------------------------|
  | S (Small) | Internal tool, ≤3 screens, 1–2 devs, ≤2 weeks | Skip: 3, 13, Appendices. Simplify: 9, 10 | Concise — tables only, minimal prose |
  | M (Medium) | Standard feature, small team, 2–8 weeks | Default — all mandatory + relevant conditional | Standard — full tables + brief rationale |
  | L (Large) | Multi-team, external integrations, regulatory, >8 weeks | ALL sections required including all conditional | Comprehensive — full prose, diagrams, alternatives |

  Rules:
  - If no profile selected, default to M.
  - Profile S still requires: Summary, Technical Context, Architecture, Security, Phased Plan, Testing, Risks, Readiness Gate, Quality Checklist.
  - Profile L adds: Appendices become mandatory, Complexity Tracking always filled, all risk domains must have explicit entries.
-->

---

## 1. Summary *(mandatory)*

[Extract from feature sys: primary requirement + technical approach from research]

---

## 2. Technical Context *(mandatory)*

<!--
  Replace all NEEDS CLARIFICATION markers during Phase 0 research (/syskit.research).
  Every field must have a concrete value before Phase 1 starts.
  Research findings are documented in research.md (13-section deep research document).
-->

| Field | Value |
|-------|-------|
| **Language/Version** | [e.g., Python 3.11, TypeScript 5.x, or NEEDS CLARIFICATION] |
| **Primary Dependencies** | [e.g., Next.js, FastAPI, or NEEDS CLARIFICATION] |
| **Storage** | [e.g., PostgreSQL, Redis, or N/A] |
| **Testing Framework** | [e.g., Vitest, pytest, or NEEDS CLARIFICATION] |
| **Target Platform** | [e.g., Web, iOS 15+, Linux server, or NEEDS CLARIFICATION] |
| **Project Type** | [e.g., web-service, library, cli, mobile-app, or NEEDS CLARIFICATION] |
| **Performance Goals** | [measurable, e.g., ≤ 500ms p95, 1000 req/s, or NEEDS CLARIFICATION] |
| **Constraints** | [e.g., < 200ms p95, offline-capable, or NEEDS CLARIFICATION] |
| **Scale/Scope** | [e.g., 10K users, 50 screens, or NEEDS CLARIFICATION] |

---

## 3. Stakeholders & Decision Rights *(mandatory)*

<!--
  Who makes decisions during execution? This prevents bottlenecks and ambiguity.
-->

| Decision Type | Decision Maker | Consulted | Informed |
|---------------|---------------|-----------|----------|
| Product decisions | [Name] | [Names] | [Names] |
| Technical decisions | [Name] | [Names] | [Names] |
| Budget decisions | [Name] | [Names] | [Names] |
| Launch decisions | [Name] | [Names] | [Names] |

---

## 4. Architecture *(mandatory)*

### 4.1 Component Overview

<!--
  High-level architecture diagram. Use ASCII art or describe components and their relationships.
-->

```text
┌──────────────────────────────────────────┐
│              Client Layer                 │
│         [Web App / Mobile App]            │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│              API Layer                    │
│          [REST / GraphQL]                 │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│           Business Logic Layer            │
│      [Controllers / Services / Rules]     │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│              Data Layer                   │
│        [Database / Storage / Cache]       │
└──────────────────────────────────────────┘
```

### 4.2 Architectural Decisions

| Decision | Context | Rejected Alternatives | Rationale |
|----------|---------|----------------------|-----------|
| [Decision 1] | [Why needed] | [What else considered] | [Why chosen] |

---

## 5. Security & Privacy *(mandatory)*

| Domain | Requirement | Implementation |
|--------|-------------|---------------|
| **Authentication** | [How users prove identity] | [JWT / OAuth / Session / etc.] |
| **Authorization** | [How permissions are managed] | [RBAC / ABAC / etc.] |
| **Encryption** | [What is encrypted] | [AES-256 / TLS 1.3 / etc.] |
| **Audit Logging** | [What events are logged] | [Logging system] |

---

## 6. Data Model & Controls *(conditional — include if feature involves data)*

### 6.1 Entities

| Entity | Description | Key Fields | Sensitivity |
|--------|-------------|------------|-------------|
| [Entity 1] | [Description] | [Fields] | High / Medium / Low |

### 6.2 Data Controls

| Control | Details |
|---------|---------|
| **Data Source** | [Where data comes from] |
| **Deletion Policy** | [When and why data is deleted] |
| **Backup** | [Frequency and retention] |
| **Encryption** | [At rest / in transit] |

---

## 7. Phased Execution Plan *(mandatory)*

### 7.1 Phases

| Phase | Objective | Duration | Deliverables | Transition Criteria |
|-------|-----------|----------|-------------|-------------------|
| **Foundation** | Approve plan + initial design | [X] weeks | Approved plan + design | Stakeholder sign-off |
| **Build — Sprint 1** | [Goal] | [X] weeks | [Deliverables] | [Criteria] |
| **Build — Sprint 2** | [Goal] | [X] weeks | [Deliverables] | [Criteria] |
| **Testing** | Quality verification | [X] weeks | Test reports | Acceptance criteria pass |
| **Launch** | Deploy to users | [X] days | Live application | 48h stability |

### 7.2 Milestones

| Milestone | Target Date | Deliverable | Owner |
|-----------|------------|-------------|-------|
| Plan approved | [DATE] | Approved plan | [Name] |
| Design complete | [DATE] | UI/UX design | [Name] |
| MVP ready | [DATE] | Testable build | [Name] |
| Launch | [DATE] | Live application | [Name] |

---

## 8. Testing Strategy *(mandatory)*

### 8.1 Test Levels

| Level | Purpose | Owner | Success Criteria |
|-------|---------|-------|-----------------|
| Unit tests | Verify functions/modules | Developers | Coverage ≥ 80% |
| Integration tests | Verify component connections | QA team | All scenarios pass |
| Acceptance tests | Verify requirements | Product manager | User approval |
| Performance tests | Verify speed/load | DevOps | Within approved limits |

### 8.2 Feature Acceptance Criteria

| Feature | Must Work | Must Not Break | Edge Case |
|---------|-----------|---------------|-----------|
| [Feature 1] | [Expected behavior] | [What to protect] | [Boundary scenario] |

---

## 9. Risk Registry *(mandatory)*

| Risk | Probability | Impact | Score | Mitigation | Owner |
|------|-------------|--------|-------|-----------|-------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Score] | [Mitigation plan] | [Name] |

### Risk Domains Checklist

- [ ] Scope risks (uncontrolled expansion)
- [ ] Technical risks (unproven technology)
- [ ] Resource risks (skill gaps)
- [ ] Integration risks (external system failure)
- [ ] Security risks (breach or leak)
- [ ] Budget risks (cost overrun)

---

## 10. Success Indicators *(mandatory)*

### 10.1 Pre-Launch Indicators

| Indicator | What It Proves | Target | Timing |
|-----------|---------------|--------|--------|
| Plan completeness | Execution readiness | 100% | Before start |
| Test pass rate | Build quality | ≥ 95% | Before launch |

### 10.2 Post-Launch Indicators

| Indicator | What It Proves | Target | Timing |
|-----------|---------------|--------|--------|
| Adoption rate | User acceptance | [X] active users | After [X] weeks |
| Retention rate | User satisfaction | ≥ [X]% | After [X] month |
| Response time | System performance | ≤ [X] seconds | Ongoing |

---

## 11. Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

---

## 12. Project Structure *(mandatory)*

### 12.1 Documentation (this feature)

```text
aminooof/[###-feature]/
├── plan.md              # This file (/syskit.plan output)
├── research.md          # Required research input (/syskit.research — 13-section deep research)
├── AGENTS.md            # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # /syskit.tasks output (NOT created by /syskit.plan)
```

### 12.2 Source Code (repository root)

<!--
  Replace the placeholder below with the concrete layout for this feature.
  Delete unused options. The delivered plan must not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [Selected structure and rationale]

---

## 13. Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |

---

## 14. Change Management *(mandatory)*

### 14.1 Change Request Process

Every change to this plan must answer:
1. **What** changed?
2. **Why** did it change?
3. **What** is the impact on scope, time, and cost?
4. **Who** approved it?

### 14.2 Change Log

| Version | Date | Change | Reason | Approved By |
|---------|------|--------|--------|-------------|
| 1.0 | [DATE] | Initial version | — | [Name] |

---

## 15. Readiness Gate *(mandatory)*

<!--
  This gate determines whether the plan is ready for execution.
  Fill after all sections are complete. All blocking items must be resolved.
-->

| Gate | Status | Blocking Items |
|------|--------|---------------|
| **Not Ready** | ☐ | [List blocking issues] |
| **Preliminary** | ☐ | [List remaining items] |
| **Ready for Execution** | ☐ | None |

### Reasons for Non-Readiness (if applicable)

- [Reason 1]
- [Reason 2]

---

## 16. Plan Quality Checklist

### 16.1 Pre-Approval Checklist *(mandatory)*

- [ ] Problem is clearly defined (in sys)
- [ ] Expected value is known and measurable (in sys)
- [ ] Scope (in/out) is documented (in sys)
- [ ] Stakeholders and decision rights are documented
- [ ] Functional requirements are written and testable (in sys)
- [ ] Non-functional requirements are approved (in sys)
- [ ] Business rules are explicitly written (in sys)
- [ ] Integrations and failure plans are documented
- [ ] Risks are identified with mitigation plans
- [ ] Acceptance criteria are defined
- [ ] Phased execution plan is ready

### 16.2 Pre-Launch Checklist *(fill before launch)*

- [ ] All tests pass
- [ ] Performance is within approved limits
- [ ] Documentation is complete
- [ ] Support team is ready
- [ ] Rollback plan is ready
- [ ] Monitoring and alerts are active

---

## 17. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | | | |
| Technical Lead | | | |
| Project Sponsor | | | |

---

## Appendices *(optional)*

### Appendix A: Glossary

| Term | Definition |
|------|-----------|
| [Term] | [Definition] |

### Appendix B: References

- [Reference 1]
- [Reference 2]

---

> **Reminder**: This plan is a living document updated as the project progresses. Any significant change must go through the Change Management process documented above.

---

## Changelog
<!-- يتملي تلقائياً مع كل تعديل -->
| التاريخ | الإصدار | التغيير | المؤلف |
|---------|---------|--------|--------|
