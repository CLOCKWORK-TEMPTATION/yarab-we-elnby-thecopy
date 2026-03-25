---
description: Fast-track for small projects — combines systematize and clarify in one streamlined pass, then hands off to the mandatory workflow gates.
command_name: quickstart
command_family: Admin
command_stage: onboarding
command_requirement_level: optional
command_visibility: optional
command_execution_mode: hybrid
runtime_command: setup-quickstart
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Surface Role

- **المسار السريع**: هذا الأمر هو المسار المختصر للميزات الصغيرة والنماذج الأولية.
- ليس هو نقطة البداية الافتراضية.
- المدخل الرسمي على الأسطح الظاهرة للمستخدم يبقى `/syskit.guide`.
- استخدمه فقط عندما يكون تقليل النطاق والسرعة مطلوبين صراحة.

## Pre-Check

1. Count words in `$ARGUMENTS`. If > 500 words, inform the user:
   "This description is quite detailed. Consider using the full workflow (/syskit.systematize → /syskit.clarify → /syskit.constitution → /syskit.research → /syskit.plan) for better results."
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

3. **Stop before planning**:
   - Do NOT generate `plan.md`
   - Do NOT bypass constitution or research
   - Report the exact mandatory next sequence:
     1. `/syskit.constitution`
     2. `/syskit.research`
     3. `/syskit.plan`

4. **Output summary**:
   ```
   ⚡ Quickstart Complete!

   Created:
   ├── sys.md (Lite PRD)
   Next steps:
   1. /syskit.constitution
   2. /syskit.research
   3. /syskit.plan
   ```

## Rules

- Maximum 500-word feature descriptions
- Lite PRD = ≤2 pages
- Skip all optional/conditional sections
- This is for prototypes and small features only

## Output

- **Primary format**: Quickstart completion summary in Markdown.
- **Files created or updated**: New feature branch context and `sys.md` with a streamlined Clarification Contract.
- **Success result**: Created artifact paths, reduced-scope assumptions, and the immediate next commands.
- **Exit status**: `0` when the Lite PRD and streamlined clarification output are created; `1` when the input is too ambiguous, bootstrap prerequisites fail, or clarification cannot complete.
- **Failure conditions**: Existing feature overwrite not approved, missing templates, or unresolved blockers after the quick clarification pass.
