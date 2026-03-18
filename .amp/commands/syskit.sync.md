---
description: Analyze changes across feature artifacts and suggest required updates to maintain consistency and traceability.
handoffs:
  - label: Update Plan
    agent: syskit.plan
    prompt: Update the implementation plan based on the sync analysis
    send: true
  - label: Update Tasks
    agent: syskit.tasks
    prompt: Update tasks based on the sync analysis
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

2. Run the snapshot script to capture current state.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/snapshot-artifacts.ps1 -Json`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs snapshot --json`

3. **Load sync state**: Read `.Systematize/memory/sync-state.json` to get previous hashes.

4. **Detect changes**: For each artifact (sys.md, plan.md, tasks.md):
   - Compare current hash with stored hash
   - If changed, extract:
     - IDs added since last sync
     - IDs removed since last sync
     - Sections modified

5. **Analyze impact**: For each change detected:
   - New FR in sys.md → check if plan.md and tasks.md have corresponding entries
   - Changed NFR → check if architecture section in plan.md needs review
   - New/changed RK → check if mitigation is documented
   - Removed elements → check for orphan references in other docs

6. **Produce Sync Report**:
   ```
   📋 Sync Analysis for: [branch-name]

   Changed artifacts:
   ├── [file] (modified) — [N] changes detected
   │   ├── [change 1]
   │   └── [change 2]
   ├── [file] (unchanged)
   └── [file] (unchanged)

   Required updates:
   ├── [file] → [what needs updating and why]
   └── [file] → [what needs updating and why]

   Suggested commands (in order):
   1. [command] → [reason]
   2. [command] → [reason]
   3. /syskit.healthcheck → verify consistency
   ```

7. **Update sync state**: Run the update sync state script to record new hashes.
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/update-sync-state.ps1`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs update-sync-state`

## Rules

- Never modify artifacts automatically — only report and suggest
- Impact analysis must trace specific IDs, not generic warnings
- Suggested commands must be ordered by dependency
- Always end with a healthcheck suggestion

## Output

- **Primary format**: Sync analysis report in Markdown, backed by an updated sync-state snapshot.
- **Files created or updated**: `.Systematize/memory/sync-state.json`.
- **Success result**: Changed artifacts, impact assessment, ordered remediation commands, and refreshed hashes.
- **Exit status**: `0` when comparison and state refresh complete; `1` when prerequisite artifacts or sync storage are unavailable.
- **Failure conditions**: Missing feature documents, unreadable previous state, or failure while writing refreshed hashes.
