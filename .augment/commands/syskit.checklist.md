---
description: Generate a custom checklist for the current feature based on user requirements.
command_name: checklist
command_family: Gate
command_stage: phase-07
command_requirement_level: conditional
command_visibility: optional
command_execution_mode: runtime-backed
runtime_command: setup-checklist
handoffs:
  - label: Analyze For Consistency
    agent: syskit.analyze
    prompt: Run a project analysis for consistency
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Command Role

This command is the orchestration surface for requirements-quality checklist generation.

The heavy writing guide, quality dimensions, clarify-intent algorithm, examples, and anti-examples have been extracted to:

```text
docs/policies/checklist-policy.md
```

Treat this command file as orchestration only. Treat the policy file as the normative source for checklist item construction and quality validation.

## Execution Flow

1. **Setup**: Run the prerequisites check script from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS list.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`
   - All file paths must be absolute.
   - For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

2. **Clarify intent**: Follow the Clarify Intent Algorithm in the policy file. Derive up to THREE contextual clarifying questions. After answers, up to TWO more follow-ups (max 5 total). Apply defaults when interaction impossible: Depth=Standard, Audience=Reviewer, Focus=Top 2 clusters.

3. **Understand user request**: Combine `$ARGUMENTS` + clarifying answers to derive checklist theme, must-have items, and category scaffolding. Infer missing context from sys/plan/tasks (no hallucination).

4. **Load feature context**: Read from FEATURE_DIR — sys.md (required), plan.md and tasks.md (if exist). Load only relevant portions; prefer summarizing long sections.

5. **Generate checklist**: Follow the Checklist Writing Guide in the policy file. Create `FEATURE_DIR/checklists/[domain].md`. If file exists, append (continue from last CHK ID); never delete existing content. Follow the canonical template in `.Systematize/templates/checklist-template.md` for structure and ID formatting.

6. **File handling**: Use short, descriptive filenames based on domain (e.g., `ux.md`, `api.md`, `security.md`). Multiple checklists of different types are allowed. Clean up obsolete checklists when done.

7. **Report**: Output full path to checklist file, item count, and summarize whether the run created a new file or appended to an existing one. Include focus areas, depth level, actor/timing, and any explicit user-specified must-have items incorporated.

## Output

- **Primary format**: Checklist generation summary in Markdown.
- **Files created or updated**: One checklist file under `{FEATURE_DIR}/checklists/`.
- **Success result**: Checklist path, number of items added, focus areas, depth level, and whether the run created or appended.
- **Exit status**: `0` when the checklist is generated successfully; `1` when prerequisite artifacts are missing or checklist synthesis cannot be grounded in project context.
- **Failure conditions**: Missing feature context, unreadable source artifacts, invalid checklist template, or write failure in `checklists/`.
