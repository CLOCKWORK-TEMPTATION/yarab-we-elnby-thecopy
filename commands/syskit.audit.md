---
description: Execute the platform multi-layer code audit across the official target registry or a user-scoped subset, then write an executive audit report with enforced review-mode and confidence controls.
handoffs:
  - label: Quick Healthcheck
    agent: syskit.healthcheck
    prompt: Re-run the quick health check after fixing audit findings
    send: true
  - label: Sync Workflow Docs
    agent: syskit.sync
    prompt: Sync the workflow artifacts after applying audit-driven fixes
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Governing Principle

> This command audits the actual project code and runtime boundaries.
> It does **not** limit itself to `sys.md`, `plan.md`, or `tasks.md`, although those artifacts remain governing scope and contract references.

## Pre-Execution Checks

**Check for extension hooks (before audit)**:
- Check if `.Systematize/config/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_audit` key
- If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
- Filter to only hooks where `enabled: true`
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
- For each executable hook, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Outline.
    ```
- If no hooks are registered or `.Systematize/config/extensions.yml` does not exist, skip silently

## Outline

1. Run the prerequisites check script from repo root and parse `FEATURE_DIR` and `AVAILABLE_DOCS`.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`

2. Verify the audit contract inputs exist before any review work starts:
   - `FEATURE_DIR/sys.md`
   - `FEATURE_DIR/plan.md`
   - `FEATURE_DIR/contracts/confidence-policy-contract.md`
   - `FEATURE_DIR/contracts/heterogeneous-scope-rules.md`
   - `FEATURE_DIR/contracts/layer-review-rubric.md`
   - `.Systematize/templates/review-template.md`
   - If any required artifact is missing, stop and tell the user which prerequisite command must run first.

3. Determine the audit scope:
   - If `$ARGUMENTS` contains existing paths, audit only that subset after normalizing each path.
   - If `$ARGUMENTS` is empty, load the official platform registry from `.Systematize/scripts/node/lib/audit-target-registry.mjs`.
   - Never invent extra targets outside the registry unless the user explicitly passed a real existing path.
   - Report the final scoped target count before starting the review.

4. Load the governing local sources before inspecting the project:
   - `.Systematize/scripts/node/lib/audit-target-registry.mjs`
   - `.Systematize/scripts/node/lib/check-catalog.mjs`
   - `.Systematize/scripts/node/lib/target-scope-classifier.mjs`
   - `.Systematize/scripts/node/lib/confidence-policy.mjs`
   - `.Systematize/scripts/node/lib/confidence-statement-builder.mjs`
   - `.Systematize/scripts/node/lib/finding-normalizer.mjs`
   - `.Systematize/scripts/node/lib/audit-report-builder.mjs`
   - PowerShell equivalents when validating parity
   - `FEATURE_DIR/contracts/confidence-policy-contract.md`
   - `FEATURE_DIR/contracts/heterogeneous-scope-rules.md`
   - `FEATURE_DIR/contracts/layer-review-rubric.md`

5. Determine the review mode **before** collecting findings and keep it synchronized with evidence:
   - Allowed review modes only:
     - `Static Analysis Only`
     - `Partial Execution Review`
     - `Full Execution Review`
   - Allowed confidence levels only:
     - `Low`
     - `Medium`
     - `High`
   - Do **not** assign `High` confidence if any required automated check is blocked, failed, or only partially covers the scoped targets.

6. Execute the audit in the exact ordered stages defined by the layer review rubric:
   - **Stage 0**: determine review mode, confidence baseline, detected layers, and execution constraints
   - **Stage 1**: audit `package.json`, workspace scripts, toolchain configuration, `tsconfig`, lint configuration, Next.js configuration, and build wiring
   - **Stage 2**: run `lint`, `type-check`, `test`, and `build` when scripts exist and the environment allows execution
   - **Stage 3**: interpret automated check results structurally, not cosmetically
   - **Stage 4**: inspect development versus production boundaries, environment usage, local-only assumptions, and deployment fragility
   - **Stage 5**: inspect `server/API` layers or confirm them as `out_of_scope`
   - **Stage 6**: inspect shared logic, domain utilities, types, schemas, and reusable services
   - **Stage 7**: inspect frontend routes, components, hooks, state handling, and rendering behavior
   - **Stage 8**: inspect frontend-backend integration contracts and cross-layer assumptions
   - **Stage 9**: inspect security and runtime validation boundaries
   - **Stage 10**: inspect performance and production readiness
   - **Stage 11**: merge duplicate root causes, preserve highest severity, and produce the final prioritized set

7. Apply heterogeneous-scope classification to every target:
   - Use `.Systematize/scripts/node/lib/target-scope-classifier.mjs` or the PowerShell equivalent as the contract source.
   - For `web` targets, missing `server` findings inside the target folder are `out_of_scope`, not defects.
   - For `backend` targets, missing `frontend` findings inside the target folder are `out_of_scope`, not defects.
   - For expected layers with no usable evidence, record `not_present`.
   - For blocked inspection, record `blocked` with the direct reason.

8. Record automated checks only through the official check catalog:
   - `lint`
   - `type-check`
   - `test`
   - `build`
   - Each check must end as `executed`, `failed`, or `blocked`.
   - Each `failed` or `blocked` check must include:
     - direct cause
     - affected scope
     - confidence impact
     - output reference when available

9. Record findings with the mandatory normalized fields:
   - type: `خطأ مؤكد` / `خطر محتمل` / `ضعف تصميمي` / `تحسين مقترح`
   - severity: `حرج` / `عالٍ` / `متوسط` / `منخفض`
   - layer: `config` / `toolchain` / `server` / `shared` / `frontend` / `integration` / `security` / `performance` / `production`
   - location
   - problem
   - evidence
   - impact
   - fix
   - `mergedFrom` when the same root cause appears across more than one stage

10. Build the final executive audit report from the local report contract:
    - Use `.Systematize/templates/review-template.md` as the heading contract.
    - Use `.Systematize/scripts/node/lib/audit-report-builder.mjs` or the PowerShell equivalent as the structure source of truth.
    - The final report **must** preserve this exact section order:
      - `## Executive Summary`
      - `## Critical Issues Table`
      - `## Layer-by-Layer Findings`
      - `## Confidence and Coverage`
      - `## Repair Priority Map`
      - `## Action Plan`
    - Save the final report to `{FEATURE_DIR}/audit.md`.
    - Do **not** overwrite `{FEATURE_DIR}/review.md`, because that file remains reserved for the documentation review gate.

11. The final audit report must include:
    - review mode
    - confidence level
    - executed checks
    - blocked checks
    - uncovered areas
    - top five issues
    - critical issues table
    - layer-by-layer findings ordered by the official stages
    - deduplicated repair priority map
    - five-phase repair plan without timeline promises

12. If `auto_changelog` is enabled, add a changelog entry for the audit artifact only after the report is written successfully.

13. **Check for extension hooks (after audit)**:
    - Check if `.Systematize/config/extensions.yml` exists in the project root.
    - If it exists, read it and look for entries under the `hooks.after_audit` key
    - If the YAML cannot be parsed or is invalid, skip hook checking silently and continue normally
    - Filter to only hooks where `enabled: true`
    - For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
      - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
      - If the hook defines a non-empty `condition`, skip the hook and leave condition evaluation to the HookExecutor implementation
    - For each executable hook, output the following based on its `optional` flag:
      - **Optional hook** (`optional: true`):
        ```
        ## Extension Hooks

        **Optional Hook**: {extension}
        Command: `/{command}`
        Description: {description}

        Prompt: {prompt}
        To execute: `/{command}`
        ```
      - **Mandatory hook** (`optional: false`):
        ```
        ## Extension Hooks

        **Automatic Hook**: {extension}
        Executing: `/{command}`
        EXECUTE_COMMAND: {command}
        ```
    - If no hooks are registered or `.Systematize/config/extensions.yml` does not exist, skip silently

## Rules

- This command is an engineering code audit, not a documentation-only review.
- `sys.md`, `plan.md`, `research.md`, and contracts guide scope and interpretation, but the primary review target is the actual code and runtime surface.
- If a check cannot run, say exactly what blocked it, where it was blocked, and how that lowered confidence.
- Do not treat `lint`, `type-check`, `test`, or `build` success as proof that the project is production-ready.
- Do not praise the project without direct evidence tied to a file, path, or execution result.
- Merge repeated root causes instead of reporting the same defect multiple times with different wording.
- Distinguish strictly between `خطأ مؤكد`, `خطر محتمل`, `ضعف تصميمي`, and `تحسين مقترح`.
- Distinguish strictly between `حرج`, `عالٍ`, `متوسط`, and `منخفض`.
- Do not modify source code during the audit unless the user explicitly asks for remediation after the report.
- The report must remain directly actionable as a repair plan input.

## Output

- **Primary format**: Executive audit report in Markdown.
- **Files created or updated**: `{FEATURE_DIR}/audit.md` and optional changelog entries when enabled.
- **Success result**: Review mode, confidence level, scoped targets, executed and blocked checks, prioritized findings, and the full repair plan.
- **Exit status**: `0` when the audit completes and the report is written successfully; `1` when prerequisites are missing, scope cannot be resolved, or the report cannot be produced.
- **Failure conditions**: Missing feature contracts, invalid target paths, unreadable audit contract files, failure to establish review mode, or write failure for `audit.md`.
