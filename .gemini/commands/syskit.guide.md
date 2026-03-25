---
description: Official guidance entry that recommends one clear next command based on the current repository and feature state.
command_name: guide
command_family: Admin
command_stage: onboarding
command_requirement_level: optional
command_visibility: primary
command_execution_mode: hybrid
runtime_command: setup-guide
---

## User Input

```text
$ARGUMENTS
```

## Command Role

- **المدخل التوجيهي الرسمي**: هذا الأمر هو نقطة البدء الرسمية على الأسطح الظاهرة للمستخدم.
- هو طبقة إرشاد فقط.
- ليس طبقة حوكمة جديدة.
- ليس محرك قرار مستقل.
- لا يكتب حالة جديدة.
- لا يغير العقود.
- يستخدم فقط فحوصًا قرائية موجودة أصلًا لتقديم توصية واحدة واضحة.

## Outline

1. **Resolve initialization status** using existing read-only signals:
   - Prefer `.Systematize/memory/install-state.json`
   - Fall back to the current bootstrap markers already used by the framework

2. **If initialization is not detected**:
   - Recommend `/syskit.init` only
   - Explain that this is the path for **التهيئة الأولى**
   - Stop without expanding the rest of the workflow

3. **If initialization is detected and there is no active feature context**:
   - Recommend `/syskit.quickstart` only when the user explicitly asks for a quick path, a prototype, or a very small feature
   - Otherwise recommend `/syskit.systematize` as the default **المسار الكامل**

4. **If an active feature context exists**:
   - Run the feature status script in read-only mode
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/get-feature-status.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs feature-status --json`
   - Recommend the first missing mandatory gate only

5. **Explain the single recommended next command**:
   - What it does
   - What input it needs
   - What it produces
   - Example invocation

6. **Offer to continue with that one command**: "Would you like me to run `[next command]` now?"

## Rules

- Keep one clear next step
- Do not present this command as a governance gate
- Do not create or mutate files unless the user explicitly asks to run the recommended command
- Push heavy documents to the reference layer instead of front-loading them
- Be conversational and helpful, not technical
- Always end with a clear, actionable next step

## Output

- **Primary format**: Conversational Markdown guidance tailored to the current workflow stage.
- **Files created or updated**: None unless the user explicitly asks to run the suggested next command.
- **Success result**: Current state summary, recommended next step, required inputs, expected outputs, and an example invocation.
- **Exit status**: `0` when the guide is produced; `1` when project state cannot be determined well enough to recommend a safe next step.
- **Failure conditions**: Missing repository context or unreadable prerequisite status data.
