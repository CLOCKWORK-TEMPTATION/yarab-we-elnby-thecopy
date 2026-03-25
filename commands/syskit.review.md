---
description: Strict engineering repository review gate that audits workspace truth, execution evidence, documentation drift, editor reintegration, backend contracts, shared packages, integration paths, and production readiness before implementation proceeds.
command_name: review
command_family: Gate
command_stage: phase-08
command_requirement_level: mandatory
command_visibility: primary
command_execution_mode: strong-hybrid
runtime_command: setup-review
handoffs:
  - label: Start Implementation
    agent: syskit.implement
    prompt: Proceed with implementation after the strict review gate passes
    send: true
  - label: Update Plan
    agent: syskit.plan
    prompt: Update the plan based on review findings
    send: true
  - label: Re-run Clarification
    agent: syskit.clarify
    prompt: Clarify the blocking unknowns revealed by the strict review
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Command Role

This command is the orchestration surface for the strict engineering repository
review.

The review is not a peer-approval note, not a teaching summary, and not a
generic checklist. It must produce an executive readiness artifact grounded in
direct repository evidence.

## Runtime Bridge

Use the canonical runtime helper to resolve the active feature workspace and
bootstrap the review gate:

```text
node .Systematize/scripts/node/cli.mjs setup-review --json
```

PowerShell remains a compatibility shell only.

## Required Audit Order

Audit the repository in this order and do not skip a layer silently:

```text
Toolchain and Workspace
Automated Checks
Documentation Drift
Frontend
Editor Subtree
Backend
Shared Packages
Frontend–Backend Integration
Security and Production Readiness
```

When the active feature contains:

```text
contracts/review-report-contract.md
```

treat that contract as the normative output schema for:

```text
review.md
```

## Execution Flow

1. Run the canonical runtime bootstrap once to resolve the active feature paths
   and verify that:

   ```text
   sys.md
   plan.md
   tasks.md
   ```

   exist for the active feature.
2. Determine the review mode and confidence baseline from the real repository
   structure and from what can actually be executed.
3. Audit the repository in the enforced order above, collecting direct evidence
   for every non-obvious claim.
4. Normalize and deduplicate findings before writing:

   ```text
   review.md
   ```

   as an executive artifact.
5. Validate the resulting artifact through:

   ```text
   node .Systematize/scripts/node/cli.mjs setup-review --validate-existing --json
   ```

6. Fail if prerequisites are missing, the report remains incomplete, or the
   verdict cannot be derived deterministically from the evidence gathered.

## Output Requirements

The final `review.md` must contain, in order:

1. Executive Summary
2. Critical Issues Table
3. Layer-by-Layer Findings
4. Confidence and Coverage
5. Repair Priority Map
6. Action Plan

The `Executive Summary` must include bullet lines for:

- Scope
- Review Mode
- Confidence
- Executive Judgment
- **Verdict**

The `Layer-by-Layer Findings` section must include these subsections:

- Toolchain and Workspace
- Automated Checks
- Documentation Drift
- Frontend
- Editor Subtree
- Backend
- Shared Packages
- Frontend–Backend Integration
- Security and Production Readiness

## Output

- Deliver the completed `review.md` path and the review verdict.
- Summarize the review mode, confidence baseline, top blockers, and whether
  implementation should proceed.
- Treat missing evidence, execution failures, and uncovered layers as part of
  the final report rather than hiding them.
