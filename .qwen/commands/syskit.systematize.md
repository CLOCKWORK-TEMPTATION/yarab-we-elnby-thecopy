---
description: Create a feature systematize document (PRD) from a natural language description — follows 5-level PRD structure with traceability, maturity levels, and quality audit.
command_name: systematize
command_family: Gate
command_stage: phase-01
command_requirement_level: mandatory
command_visibility: primary
command_execution_mode: strong-hybrid
runtime_command: setup-systematize
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

## Command Role

This command is the orchestration surface for producing the governing `sys.md` document for a feature.

- **المسار الكامل**: هذا الأمر هو نقطة الدخول الافتراضية بعد اكتمال التهيئة.
- المدخل الرسمي على الأسطح الظاهرة للمستخدم يبقى `/syskit.guide`.
- استخدم هذا الأمر عندما تكون التهيئة مكتملة ولا يكون **المسار السريع** مطلوبًا صراحة.

The heavy PRD policy, quality rules, checklist logic, and clarification contract have been extracted to:

```text
docs/policies/systematize-policy.md
```

Treat this command file as orchestration only. Treat the policy file as the normative source for PRD structure and quality validation.

## Runtime Bridge

Use the canonical Node feature bootstrap once to establish the active feature workspace and output paths:

```text
node .Systematize/scripts/node/cli.mjs create-feature --json --short-name "<short-name>" "<description>"
```

PowerShell remains a compatibility shell only.

## Execution Flow

1. Load and follow the extracted systematize policy before drafting the PRD.
2. Derive a short branch name, run the canonical feature bootstrap once, and capture the resolved `SYS_FILE` and workspace paths.
3. Fill the PRD using the official template and the policy-defined structure, then create the companion quality checklist.
4. Re-validate the PRD against the extracted policy before handing off to the clarification gate.
5. If the user input is empty, stop and ask for the missing feature description instead of inventing one.

## Output

- Deliver the resolved branch or feature workspace path and the generated `sys.md` path.
- Report the PRD depth, remaining clarification markers, and checklist status.
- Cite the extracted policy file used for the run.
