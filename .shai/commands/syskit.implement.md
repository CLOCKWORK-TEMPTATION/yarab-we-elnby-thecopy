---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
command_name: implement
command_family: Gate
command_stage: phase-09
command_requirement_level: mandatory
command_visibility: primary
command_execution_mode: strong-hybrid
runtime_command: setup-implement
handoffs:
  - label: Convert Tasks to GitHub Issues
    agent: syskit.taskstoissues
    prompt: Convert the implemented tasks to GitHub issues
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Command Role

This command is the orchestration surface for plan implementation execution.

The heavy extension hooks protocol, ignore-file patterns, task ordering algorithm, checkpoint protocol, rollback support, and progress tracking have been extracted to:

```text
docs/policies/implement-policy.md
```

Treat this command file as orchestration only. Treat the policy file as the normative source for detailed implementation procedures.

## Execution Flow

1. **Pre-execution hooks**: Follow the Extension Hooks Protocol in the policy file for the `hooks.before_implement` key.

2. **Prerequisites**: Run the prerequisites check script from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json --require-tasks --include-tasks`

3. **Checklist gate**: Follow the Checklist Gate Protocol in the policy file. If any checklist is incomplete and user declines to proceed, halt.

4. **Load context**: Read tasks.md (required), plan.md (required), and if they exist: AGENTS.md, contracts/, research.md, quickstart.md.

5. **Project setup**: Follow Project Setup Verification in the policy file to create/verify ignore files based on detected technologies.

6. **Task ordering**: Follow Smart Task Ordering in the policy file. Build the dependency DAG, group into execution waves, display the plan.

7. **Execute waves**: For each wave, implement tasks following the Implementation Checkpoints and Rollback Support protocols in the policy file. Mark completed tasks as `[X]` in tasks.md immediately.

8. **Progress tracking**: Follow Progress Tracking in the policy file. Report after each task, halt on blocking failures, continue parallel tasks on non-blocking failures.

9. **Completion validation**: Verify all required tasks are completed, implemented features match the sys, tests pass and coverage meets requirements, and implementation follows the technical plan.

10. **Post-execution hooks**: Follow the Extension Hooks Protocol in the policy file for the `hooks.after_implement` key.

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/syskit.tasks` first to regenerate the task list.

## Output

- **Primary format**: Incremental implementation progress report in Markdown.
- **Files created or updated**: Source files, `tasks.md` progress marks, snapshots, optional changelog entries, analytics events, and optional commits.
- **Success result**: Executed waves, completed and failed tasks, build and test status, checkpoint health, and final completion summary.
- **Exit status**: `0` when the requested implementation scope completes or reaches a user-approved stop point; `1` when mandatory prerequisites fail, a blocking task fails without a safe recovery path, or the user aborts after a critical failure.
- **Failure conditions**: Missing `tasks.md`, unresolved checklist gate, build or test failures on blocking tasks, rollback failure, or snapshot failure before a risky task.
