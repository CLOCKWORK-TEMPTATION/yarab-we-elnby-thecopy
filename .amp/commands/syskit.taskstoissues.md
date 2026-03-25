---
description: Convert existing Task Cards from tasks.md into structured, dependency-ordered GitHub issues with labels, milestones, and full context.
command_name: taskstoissues
command_family: Integration
command_stage: integration
command_requirement_level: optional
command_visibility: optional
command_execution_mode: hybrid
runtime_command: setup-taskstoissues
tools: ['github/github-mcp-server/issue_write']
handoffs:
  - label: Re-analyze After Conversion
    agent: syskit.analyze
    prompt: Re-analyze the feature after converting tasks to GitHub issues
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run the prerequisites check script from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json --require-tasks --include-tasks`

2. From the executed script, extract the path to **tasks.md**.

3. Get the Git remote by running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED TO NEXT STEPS IF THE REMOTE IS A GITHUB URL

4. **Parse tasks.md** — extract all Task Cards. Each Task Card contains:
   - **ID** (layer-prefixed: `BE-T-001`, `FE-T-001`, `DO-T-001`, `CC-T-001`)
   - **Type** (🗄️ Backend / 🎨 Frontend / 🔧 DevOps / 🔗 Cross-Cutting)
   - **Priority** (P0 / P1 / P2 / P3)
   - **Estimate** (hours)
   - **Source** (plan.md §X / sys.md FR-XXX)
   - **Depends On** (task IDs)
   - **Parallel** (Yes/No)
   - **Story** (US1/US2/... or Setup/Foundation/Polish)
   - **Milestone** (MS1/MS2/... or N/A)
   - **Description**
   - **Expected Outputs** (files/artifacts)
   - **Acceptance Criteria** (testable criteria)
   - **Risks / Attention Points**
   - **Technical Notes**

5. **Map Task Card fields to GitHub Issue**:

   **Issue Title**: `[ID] — [Task Title]`

   **Issue Labels** (create if not existing):
   - **Layer label**: `backend` / `frontend` / `devops` / `cross-cutting` (from Type)
   - **Priority label**: `P0-critical` / `P1-high` / `P2-medium` / `P3-low` (from Priority)
   - **Story label**: `US1` / `US2` / `setup` / `foundation` / `polish` (from Story)
   - **Phase label**: `phase-1-setup` / `phase-2-foundation` / `phase-3-us1` / etc.

   **Issue Body** (Markdown template):

   ```markdown
   ## Task Card

   | Field | Value |
   |-------|-------|
   | **ID** | [ID] |
   | **Type** | [Type] |
   | **Priority** | [Priority] |
   | **Estimate** | [X] hours |
   | **Source** | [Source reference] |
   | **Depends On** | [Task IDs or None] |
   | **Parallel** | [Yes/No] |
   | **Story** | [Story] |
   | **Milestone** | [Milestone] |

   ## Description

   [Description from Task Card]

   ## Expected Outputs

   [Expected Outputs list with checkboxes]

   ## Acceptance Criteria

   [Acceptance Criteria list with checkboxes]

   ## Risks / Attention Points

   [Risks or "None"]

   ## Technical Notes

   [Technical Notes or "None"]

   ---
   *Generated from tasks.md by /syskit.taskstoissues*
   ```

   **Issue Milestone**: If the task has a Milestone value (not N/A), assign to a GitHub milestone with that name. Create the milestone if it doesn't exist.

6. **Dependency linking**: After all issues are created, add a "Dependencies" section as a comment on each issue that has dependencies:

   ```markdown
   ## Dependencies
   - Depends on: #[issue-number] ([Task ID])
   - Blocks: #[issue-number] ([Task ID])
   ```

7. **Report**: Output summary:
   - Total issues created
   - Issues per layer (Backend / Frontend / DevOps / Cross-Cutting)
   - Issues per milestone
   - Dependency links created
   - Any errors encountered

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL

## Output

- **Primary format**: Conversion summary in Markdown plus created GitHub issues.
- **Files created or updated**: GitHub issues, optional milestones, labels, and dependency comments in the target repository.
- **Success result**: Total issues created, per-layer counts, milestone distribution, dependency links, and any skipped items.
- **Exit status**: `0` when all eligible task cards are converted; `1` when the remote is not GitHub, tasks cannot be parsed, or issue creation fails.
- **Failure conditions**: Missing `tasks.md`, non-GitHub remote, invalid issue permissions, or partial dependency-link failures that block integrity.
