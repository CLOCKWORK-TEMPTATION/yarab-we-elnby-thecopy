---
description: "Perform a non-destructive, 4-domain 30+ analysis-type deep-context cross-artifact analysis across constitution.md, AGENTS.md, sys.md, plan.md, and tasks.md — covering Unit Definition (SCU modeling, behavioral completeness, atomicity, acceptance criteria, ambiguity), Quality & Logic (correctness, consistency, determinism, invariants, assumptions, feasibility, necessity, modifiability, redundancy), Boundaries & Dependencies (dependency graph, context boundaries, interface contracts, translation maps, transitions, read/write separation, cohesion/coupling, impact radius), and Execution & Governance (traceability, evidence linkage, priority alignment, test coverage, negative constraints, CRUD/lifecycle, change-control, criticality/risk)."
command_name: analyze
command_family: Inspection
command_stage: deep-inspection
command_requirement_level: optional
command_visibility: optional
command_execution_mode: hybrid
runtime_command: setup-analyze
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

## Command Role

This command is the orchestration surface for deep governance inspection.

The heavy policy, rubric, SCU model, and analysis workflow have been extracted to:

```text
docs/policies/analyze-policy.md
```

Treat this command file as orchestration only. Treat the policy file as the normative source for the analysis method.

## Execution Flow

1. Load and follow the complete policy in the extracted policy document before reading artifacts or producing findings.
2. Resolve artifact paths from the repository root using the canonical Node prerequisite check when path discovery is needed.
3. Keep the run strictly read-only unless the user explicitly approves a separate remediation step.
4. Produce findings ordered by severity, with evidence, affected artifacts, and actionable remediation guidance.
5. If a prerequisite artifact is missing, stop and direct the user to the required prior governance gate instead of inventing a parallel path.

## Output

- Deliver the structured analysis report defined by the policy file.
- State which artifacts were inspected and which were missing.
- Mark all remediation as optional follow-up work unless the user explicitly asks for edits.
