---
description: Compare current artifacts against a previous snapshot to detect changes and their impact across the feature documentation.
command_name: diff
command_family: Inspection
command_stage: change-control
command_requirement_level: optional
command_visibility: optional
command_execution_mode: runtime-backed
runtime_command: setup-diff
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run the prerequisites check script from repo root to get FEATURE_DIR and paths.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json`

2. Run the snapshot script to get the current state and latest snapshot.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/snapshot-artifacts.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs snapshot --json`

3. **Load comparison data**:
   - If the user specified a snapshot timestamp in `$ARGUMENTS`, use that snapshot
   - Otherwise, load the previous hashes from `.Systematize/memory/sync-state.json`
   - Read current artifacts and extract all tracked IDs using regex patterns for: FR-XXX, AC-XXX, NFR-XXX, RK-XXX, ASM-XXX, TC-XXX, BR-XXX, INT-XXX, ADR-XXX, OBJ-XXX, KPI-XXX

4. **Compare and analyze**:
   - For each artifact file (sys.md, plan.md, tasks.md, etc.):
     - Compare file hashes to detect changes
     - Extract IDs from both versions
     - Identify: added IDs, removed IDs, modified sections
   - Analyze cross-artifact impact:
     - New FR without corresponding tasks
     - Changed NFR that affects architecture
     - Removed assumptions that need review

5. **Produce Diff Report** in this format:
   ```
   📋 Diff Report: [filename]
   Snapshot: [old_timestamp] → Current

   ➕ Added:    [list of new IDs]
   ✏️ Modified: [list of changed IDs with brief description]
   ➖ Removed:  [list of removed IDs]

   ⚠️ Impact Analysis:
   ├── [affected file] → [what needs review and why]
   └── [affected file] → [what needs update]

   💡 Suggested Commands:
   1. [command] ([reason])
   2. [command] ([reason])
   ```

6. If `auto_changelog` is enabled in syskit-config.yml, suggest adding changelog entries for the detected changes.

## Rules

- Always show the full diff even if changes are small
- Sort IDs numerically within each category
- Impact analysis must be specific — not generic warnings
- Suggested commands must be actionable and ordered by priority

## Output

- **Primary format**: Markdown diff report with impact analysis and follow-up commands.
- **Files created or updated**: None.
- **Success result**: Added, modified, and removed IDs by artifact, plus downstream update recommendations.
- **Exit status**: `0` when current artifacts and baseline state are comparable; `1` when prerequisite paths, snapshots, or sync state are unavailable.
- **Failure conditions**: Missing feature artifacts, missing baseline hashes, or unreadable snapshot data.
