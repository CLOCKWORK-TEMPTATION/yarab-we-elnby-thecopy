---
description: Fast-track for small projects — combines systematize, clarify, and plan in one streamlined pass.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Check

1. Count words in `$ARGUMENTS`. If > 500 words, inform the user:
   "This description is quite detailed. Consider using the full workflow (/syskit.systematize → /syskit.clarify → /syskit.plan) for better results."
   Ask if they want to proceed with quickstart anyway.

2. Check if a feature already exists (sys.md present). If so, warn and ask before overwriting.

## Outline

1. **Create feature** (equivalent to `/syskit.systematize` in Lite mode):
   - Run `create-new-feature.ps1` / `node cli.mjs create-feature` if no feature exists
   - Generate a Lite PRD in sys.md:
     - Level 1 (Identity): Problem + Scope only
     - Level 3 (Requirements): FR table + NFR table (top 3 categories)
     - Level 5 (Verification): AC table + 2-3 KPIs
   - Skip: Level 2 scenarios (use 1-liner), Level 4 integrations, Risk Registry

2. **Quick clarify** (3-5 essential questions only):
   - What is the primary user action?
   - What is the expected output?
   - Are there any hard constraints?
   - Fill the Clarification Contract in sys.md

3. **Generate plan** (S profile — concise):
   - Run `setup-plan.ps1` / `node cli.mjs check-prerequisites`
   - Fill plan.md with:
     - Summary (2-3 sentences)
     - Technical Context table
     - Simplified Architecture (single component diagram)
     - 2-phase execution plan (Build + Test)
     - 3-item risk checklist

4. **Output summary**:
   ```
   ⚡ Quickstart Complete!

   Created:
   ├── sys.md (Lite PRD)
   ├── plan.md (S Profile)

   Next steps:
   1. /syskit.tasks — break into task cards
   2. /syskit.implement — start building
   ```

## Rules

- Maximum 500-word feature descriptions
- Lite PRD = ≤2 pages
- S Profile plan = ≤3 pages
- Skip all optional/conditional sections
- This is for prototypes and small features only

## Output

- **Primary format**: Quickstart completion summary in Markdown.
- **Files created or updated**: New feature branch context, `sys.md`, and `plan.md` in streamlined form.
- **Success result**: Created artifact paths, reduced-scope assumptions, and the immediate next commands.
- **Exit status**: `0` when the Lite PRD and concise plan are created; `1` when the input is too ambiguous, bootstrap prerequisites fail, or plan generation cannot complete.
- **Failure conditions**: Existing feature overwrite not approved, missing templates, or unresolved blockers after the quick clarification pass.
