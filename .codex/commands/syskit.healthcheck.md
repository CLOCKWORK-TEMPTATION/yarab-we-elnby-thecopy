---
description: Run a quick advisory health check on feature documentation — heuristic signals for consistency, completeness, and traceability. Not an authoritative production verdict; use `npm run verify` for the authoritative verification chain.
command_name: healthcheck
command_family: Inspection
command_stage: inspection
command_requirement_level: mandatory
command_visibility: operational
command_execution_mode: runtime-backed
runtime_command: healthcheck
handoffs:
  - label: Full Analysis
    agent: syskit.analyze
    prompt: Run a comprehensive cross-artifact analysis
    send: true
  - label: Fix Issues
    agent: syskit.sync
    prompt: Sync and fix the detected issues
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run the prerequisites check script to get FEATURE_DIR and paths.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`

2. Run the healthcheck script to get automated check results.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/run-healthcheck.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs healthcheck --json`

3. **Enhance with AI analysis** — perform these additional checks that require understanding:
   - **FR↔AC completeness**: Read sys.md and verify each FR has a meaningful (not boilerplate) AC
   - **Placeholder detection**: Search for `[NEEDS CLARIFICATION]`, `[TBD]`, bracket placeholders in all docs
   - **Consistency check**: Verify terminology consistency across sys.md, plan.md, tasks.md
   - **Scope alignment**: Check that tasks.md tasks align with plan.md phases

4. **Combine scores**: Merge automated checks with AI analysis into a unified report.

5. **Produce Health Report**:
   ```
   🏥 Health Score: [X]/100

   Top Issues:
   1. ❌ [critical issue] (-[points])
   2. ⚠️ [warning] (-[points])
   3. ℹ️ [info] (-0, info only)

   Advisory Status: [ADVISORY_PASS ✅ | ADVISORY_FAIL ❌] (threshold: 70)
   Note: This is a heuristic quick-check. For authoritative verification use: npm run verify

   💡 Suggested Actions:
   1. [action with specific command]
   2. [action with specific command]
   ```

6. If `auto_healthcheck` is enabled in syskit-config.yml, mention that this check runs automatically after document modifications.

## Rules

- This is a QUICK check — do not perform the deep cross-analysis of /syskit.analyze
- Focus on structural integrity, not content quality
- Always provide actionable suggestions for each issue found
- Score deductions must be transparent and justified

## Output

- **Primary format**: Compact advisory health report in Markdown, plus optional machine-readable JSON from the runtime script.
- **Scope**: Heuristic signals only — all checks are regex-based and structural. This is not an authoritative production verdict. For the authoritative verification chain use `npm run verify`.
- **Files created or updated**: None.
- **Success result**: Advisory health score, top issues, advisory status, and ordered remediation actions.
- **Exit status**: `0` when checks complete; `1` when prerequisite artifacts are missing or the health script cannot evaluate the feature.
- **Failure conditions**: Missing `sys.md`, unreadable plan or tasks files, or invalid healthcheck payloads.
