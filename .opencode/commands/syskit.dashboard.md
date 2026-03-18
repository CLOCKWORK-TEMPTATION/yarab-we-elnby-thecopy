---
description: Display a unified dashboard showing status of ALL features in the project — with conflict detection and team overview.
---

## User Input

```text
$ARGUMENTS
```

## Outline

1. Run `Get-AllFeatureDirs` (from common.ps1 via a script) to discover all features.
   - If no features exist, inform the user and suggest `/syskit.systematize`.

2. For each feature, run the feature status script:
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/get-feature-status.ps1 -Branch <name> -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs feature-status --branch <name> --json`

3. **Display unified dashboard**:
   ```
   📊 Active Features Dashboard

   | Branch              | Phase      | Health | Progress | Owner        | Last Activity |
   |---------------------|-----------|--------|----------|-------------|--------------|
   | 001-user-auth       | Implement | 92/100 | 75%      | [OWNER]     | 2025-03-15   |
   | 002-notifications   | Plan      | 85/100 | 30%      | [OWNER]     | 2025-03-14   |
   | 003-reports         | Research  | —      | 10%      | [OWNER]     | 2025-03-10   |

   Summary:
   ├── Total features: [X]
   ├── Average health: [X]/100
   └── Features needing attention: [X]
   ```

4. **Conflict detection**:
   - Scan all sys.md files for shared entity names
   - Check for dependency references between features
   - Report any overlaps:
     ```
     ⚠️ Potential Conflicts:
     ├── Entity "User" referenced in: 001-user-auth, 002-notifications
     └── 003-reports depends on 001-user-auth (mentioned in plan.md)
     ```

5. **Run alerts** across all features: `check-alerts.ps1 -Branch <name> -Json` / `node cli.mjs check-alerts --branch <name> --json` for each.

## Rules

- This is a READ-ONLY overview command
- Show ALL features regardless of state
- Sort by progress (most complete first) or by last activity
- Highlight stale features (>14 days inactive)

## Output

- **Primary format**: Unified dashboard table covering all detected features.
- **Files created or updated**: None.
- **Success result**: Per-feature phase, health score, progress, owner, last activity, conflict notes, and alert highlights.
- **Exit status**: `0` when feature inventory and dashboard synthesis complete; `1` when feature discovery or status collection fails.
- **Failure conditions**: No readable feature directories, unreadable status payloads, or alert collection failures.
