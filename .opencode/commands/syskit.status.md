---
description: Show comprehensive status overview of a feature — phase progress, health score, and next recommended step.
handoffs:
  - label: Run Next Step
    agent: ""
    prompt: ""
    send: false
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run the prerequisites check script to get FEATURE_DIR.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`

2. Run the feature status script to get detailed status.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/get-feature-status.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs feature-status --json`

3. **Display status report**:
   ```
   📊 Project Status: [branch-name]

   Phase Progress:
   ✅ Systematize (sys.md)     — Complete, Maturity Level [X]
   ✅ Clarify                   — [X]/[Y] questions resolved
   🔶 Constitution              — [X]% complete
   ⬜ Research                  — Not started
   ⬜ Plan                      — Not started
   ⬜ Tasks                     — Not started
   ⬜ Checklist                 — Not started
   ⬜ Implementation            — Not started

   Health Score: [X]/100
   Last Activity: [DATE]
   Next Step: [/syskit.command]
   ```

4. **Provide contextual guidance**: Based on the current phase, briefly explain what the next step does and why it's important.

5. If there are alerts (run `check-alerts.ps1 -Json` / `node cli.mjs check-alerts --json`), show them below the status.

## Rules

- This is a READ-ONLY command — it never modifies any files
- Always show all 8 phases even if not started
- Health score of "—" means healthcheck couldn't run (missing files)
- Keep the output compact and scannable

## Output

- **Primary format**: Compact Markdown status board for the active feature.
- **Files created or updated**: None.
- **Success result**: All eight phases, health score, last activity, alerts, and the next recommended command.
- **Exit status**: `0` when status data is collected successfully; `1` when the feature context cannot be resolved.
- **Failure conditions**: Missing feature directory, unreadable status payload, or failed alert lookup.
