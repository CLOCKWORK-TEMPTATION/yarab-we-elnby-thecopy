---
description: Convert the implementation plan into atomic, traceable, layer-typed tasks organized by user story with time estimates and acceptance criteria.
command_name: tasks
command_family: Gate
command_stage: phase-06
command_requirement_level: mandatory
command_visibility: primary
command_execution_mode: runtime-backed
runtime_command: setup-tasks
handoffs:
  - label: Generate Quality Checklist
    agent: syskit.checklist
    prompt: Generate a quality checklist for the tasks and requirements
    send: true
  - label: Analyze For Consistency
    agent: syskit.analyze
    prompt: Run a project analysis for consistency
  - label: Implement Project
    agent: syskit.implement
    prompt: Start the implementation in phases
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Command Role

This command is the orchestration surface for generating traceable implementation task cards.

The heavy task-generation policy, decomposition rules, hook behavior, and post-generation review contract have been extracted to:

```text
docs/policies/tasks-policy.md
```

Treat this command file as orchestration only. Treat the policy file as the normative source for task structure and validation.

## Runtime Bridge

Use the canonical Node runtime helper to resolve the active feature workspace and prerequisites:

```text
node .Systematize/scripts/node/cli.mjs setup-tasks --json
```

PowerShell remains a compatibility shell only.

## Execution Flow

1. Load and follow the extracted tasks policy before generating or rewriting `tasks.md`.
2. Run the canonical runtime bootstrap once to resolve `FEATURES_DIR`, active feature paths, and prerequisite status.
3. Read `plan.md` and `sys.md` from the active feature workspace, plus any optional design artifacts called for by the policy.
4. Generate atomic Task Cards only after the prerequisite gates pass and write the result into the active feature workspace.
5. Execute the policy-defined post-generation review before finalizing the file.

## Output

- Deliver the completed `tasks.md` path.
- Report total tasks, layer distribution, estimate totals, and major dependencies.
- State whether all post-generation checks passed.
