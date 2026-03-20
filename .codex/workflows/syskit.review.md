---
description: Peer review gate between task planning and implementation — analyzes sys.md, plan.md, and tasks.md from an external reviewer perspective to catch issues before coding begins.
handoffs:
  - label: Start Implementation
    agent: syskit.implement
    prompt: Proceed with implementation after review approval
    send: true
  - label: Update Plan
    agent: syskit.plan
    prompt: Update the plan based on review findings
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

1. Run the prerequisites check script to get FEATURE_DIR and paths.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`

2. **Verify artifacts exist**: sys.md + plan.md + tasks.md must ALL be present.
   - If any is missing, inform the user and suggest the appropriate command to create it.

## Outline

1. **Load all artifacts**:
   - Read sys.md (PRD), plan.md (implementation plan), tasks.md (task breakdown)
   - Optionally read: research.md, AGENTS.md, contracts/

2. **Review sys.md** (from external reviewer perspective):
   - Are all requirements clear and testable?
   - Are there missing edge cases?
   - Are NFRs measurable with specific numeric targets?
   - Are risks comprehensive and do they have mitigation strategies?
   - Is the scope well-bounded (clear in/out)?
   - Are acceptance criteria specific enough to test?

3. **Review plan.md**:
   - Is the architecture sound for the requirements?
   - Are there missing considerations (rollback, monitoring, security)?
   - Are phase transitions clearly defined?
   - Is the testing strategy adequate?
   - Are estimates realistic given the complexity?

4. **Review tasks.md**:
   - Are tasks atomic enough (≤4 hours each)?
   - Are dependencies correctly identified?
   - Are there missing tasks for requirements in sys.md?
   - Are parallel opportunities correctly identified?
   - Do task estimates add up to a reasonable total?

5. **Cross-artifact consistency**:
   - Every FR in sys.md has corresponding tasks
   - Every NFR has an architectural consideration in plan.md
   - Every risk has either a mitigation task or explicit acceptance
   - Task estimates align with plan.md phase durations

6. **Produce Review Report**:
   ```markdown
   ## Review Report: [branch-name]

   ### sys.md Review
   - ✅ [positive finding]
   - ⚠️ [concern with specific suggestion]
   - ❌ [blocking issue that must be fixed]

   ### plan.md Review
   - ✅ [positive finding]
   - ⚠️ [concern]
   - ❌ [blocking issue]

   ### tasks.md Review
   - ✅ [positive finding]
   - ⚠️ [concern]

   ### Cross-Artifact Consistency
   - [findings]

   ### Review Verdict
   - 🟢 APPROVED — Ready for implementation
   - 🟡 APPROVED WITH CONDITIONS — [list conditions]
   - 🔴 CHANGES REQUIRED — [list blockers]

   ### Recommended Actions
   1. [action with priority]
   2. [action with priority]
   ```

7. **Create Review Gate** in the feature directory:
   - Save the review report to `{FEATURE_DIR}/review.md`
   - Include a sign-off table:
     ```markdown
     ## Review Gate
     | Reviewer | Status | Date | Comments |
     |----------|--------|------|----------|
     | AI Review | [APPROVED/CONDITIONS/CHANGES_REQUIRED] | [DATE] | See report above |
     ```

8. If `auto_changelog` is enabled, add a changelog entry for the review.

## Rules

- Review MUST be objective and specific — not generic praise
- Every concern must include a concrete suggestion for resolution
- Blocking issues (❌) must be clearly justified
- The review should catch issues that would cause rework during implementation
- Cross-artifact checks are mandatory — not optional
- Be constructive, not just critical

## Output

- **Primary format**: Structured review report in Markdown.
- **Files created or updated**: `{FEATURE_DIR}/review.md`.
- **Success result**: Findings by artifact, verdict, review gate table, and prioritized remediation actions.
- **Exit status**: `0` when review completes and the report is written; `1` when required artifacts are missing or the review gate cannot be produced.
- **Failure conditions**: Missing `sys.md`, `plan.md`, or `tasks.md`; write failure for `review.md`; or unresolved prerequisite parsing.
