---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
handoffs:
  - label: Convert Tasks to GitHub Issues
    agent: syskit.taskstoissues
    prompt: Convert the implemented tasks to GitHub issues
    send: true
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Pre-Execution Checks

**Check for extension hooks (before implementation)**:
- Check if `.Systematize/config/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_implement` key
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

1. Run the prerequisites check script from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs check-prerequisites --json --require-tasks --include-tasks`

2. **Check checklists status** (if FEATURE_DIR/checklists/ exists):
   - Scan all checklist files in the checklists/ directory
   - For each checklist, count:
     - Total items: All lines matching `- [ ]` or `- [X]` or `- [x]`
     - Completed items: Lines matching `- [X]` or `- [x]`
     - Incomplete items: Lines matching `- [ ]`
   - Create a status table:

     ```text
     | Checklist | Total | Completed | Incomplete | Status |
     |-----------|-------|-----------|------------|--------|
     | ux.md     | 12    | 12        | 0          | ✓ PASS |
     | test.md   | 8     | 5         | 3          | ✗ FAIL |
     | security.md | 6   | 6         | 0          | ✓ PASS |
     ```

   - Calculate overall status:
     - **PASS**: All checklists have 0 incomplete items
     - **FAIL**: One or more checklists have incomplete items

   - **If any checklist is incomplete**:
     - Display the table with incomplete item counts
     - **STOP** and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
     - Wait for user response before continuing
     - If user says "no" or "wait" or "stop", halt execution
     - If user says "yes" or "proceed" or "continue", proceed to step 3

   - **If all checklists are complete**:
     - Display the table showing all checklists passed
     - Automatically proceed to step 3

3. Load and analyze the implementation context:
   - **REQUIRED**: Read tasks.md for the complete task list and execution plan
   - **REQUIRED**: Read plan.md for tech stack, architecture, and file structure
   - **IF EXISTS**: Read AGENTS.md for entities and relationships
   - **IF EXISTS**: Read contracts/ for API specifications and test requirements
   - **IF EXISTS**: Read research.md for technical decisions and constraints
   - **IF EXISTS**: Read quickstart.md for integration scenarios

4. **Project Setup Verification**:
   - **REQUIRED**: Create/verify ignore files based on actual project setup:

   **Detection & Creation Logic**:
   - Check if the following command succeeds to determine if the repository is a git repo (create/verify .gitignore if so):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Check if Dockerfile* exists or Docker in plan.md → create/verify .dockerignore
   - Check if .eslintrc* exists → create/verify .eslintignore
   - Check if eslint.config.* exists → ensure the config's `ignores` entries cover required patterns
   - Check if .prettierrc* exists → create/verify .prettierignore
   - Check if .npmrc or package.json exists → create/verify .npmignore (if publishing)
   - Check if terraform files (*.tf) exist → create/verify .terraformignore
   - Check if .helmignore needed (helm charts present) → create/verify .helmignore

   **If ignore file already exists**: Verify it contains essential patterns, append missing critical patterns only
   **If ignore file missing**: Create with full pattern set for detected technology

   **Common Patterns by Technology** (from plan.md tech stack):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `*.dll`, `autom4te.cache/`, `config.status`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Tool-Specific Patterns**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. **Smart Task Ordering** (enhanced):
   - Parse tasks.md structure and extract all task cards
   - Analyze `Depends On` field in each task card to build a dependency graph (DAG)
   - Identify tasks that can run in parallel (no shared dependencies)
   - Apply **fail-fast ordering**: tasks with highest risk or most dependents execute first
   - Group tasks into execution waves:
     ```
     Wave 1: [tasks with no dependencies — can all run in parallel]
     Wave 2: [tasks depending only on Wave 1 — can run in parallel]
     Wave 3: [tasks depending on Wave 1+2]
     ...
     ```
   - Display the execution plan before starting:
     ```
     📋 Execution Plan:
     Wave 1 (parallel): DO-T-001, DO-T-002, DO-T-003
     Wave 2 (parallel): BE-T-001, BE-T-002
     Wave 3 (sequential): BE-T-003 → BE-T-004 → FE-T-001
     Wave 4 (parallel): CC-T-001, CC-T-002
     ```

6. **Implementation Checkpoints** (enhanced):
   - After completing each Phase/Wave:
     a. Verify the code builds without errors
     b. Run related tests (if applicable)
     c. Update progress in tasks.md — mark completed tasks with `[X]`
     d. Run quick healthcheck:
        - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/run-healthcheck.ps1 -Json`
        - **Node.js**: `node .Systematize/scripts/node/cli.mjs healthcheck --json`
     e. If `auto_commit` is enabled in syskit-config.yml, run `auto-commit.ps1` / `node cli.mjs auto-commit`
     f. If `auto_changelog` is enabled, add changelog entry via `Export-ChangelogEntry`
   - Display checkpoint summary:
     ```
     ✅ Phase 2 Checkpoint:
     ├── Tasks completed: 3/3
     ├── Build: ✅ passing
     ├── Tests: ✅ 12/12 passing
     ├── Health: 85/100
     └── Committed: docs(specs): implement — phase 2 complete [001-user-auth]
     ```

7. **Rollback Support** (new):
   - Before starting each task, save a snapshot:
     - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/snapshot-artifacts.ps1 -Tag "pre-{TASK_ID}"`
     - **Node.js**: `node .Systematize/scripts/node/cli.mjs snapshot --tag "pre-{TASK_ID}"`
   - If a task fails:
     a. Log the error with context
     b. Present options to the user:
        - **Retry**: Attempt the task again
        - **Skip**: Mark as skipped and continue with next non-dependent task
        - **Rollback**: Restore from the pre-task snapshot
        - **Abort**: Stop implementation entirely
     c. If rollback is chosen, restore the snapshot and recalculate remaining waves
   - Track failed/skipped tasks separately in the progress report

8. **Progress tracking and error handling** (enhanced):
   - Report progress after each completed task with running totals
   - Maintain a live progress display:
     ```
     📊 Implementation Progress: 12/24 tasks (50%)
     ├── ✅ Completed: 12
     ├── 🔄 In progress: 1 (BE-T-005)
     ├── ⏭️ Skipped: 0
     ├── ❌ Failed: 0
     └── ⬜ Remaining: 11
     ```
   - Halt execution if a blocking (non-parallel) task fails
   - For parallel tasks, continue with successful ones and report failures
   - **IMPORTANT**: Mark completed tasks as `[X]` in tasks.md immediately
   - If `analytics_enabled` is true, record events via `record-analytics.ps1` / `node cli.mjs record-analytics`

9. Completion validation:
   - Verify all required tasks are completed
   - Check that implemented features match the original systematize document
   - Validate that tests pass and coverage meets requirements
   - Confirm the implementation follows the technical plan
   - Report final status with summary of completed work

Note: This command assumes a complete task breakdown exists in tasks.md. If tasks are incomplete or missing, suggest running `/syskit.tasks` first to regenerate the task list.

10. **Check for extension hooks**: After completion validation, check if `.Systematize/config/extensions.yml` exists in the project root.
    - If it exists, read it and look for entries under the `hooks.after_implement` key
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

## Output

- **Primary format**: Incremental implementation progress report in Markdown.
- **Files created or updated**: Source files, `tasks.md` progress marks, snapshots, optional changelog entries, analytics events, and optional commits.
- **Success result**: Executed waves, completed and failed tasks, build and test status, checkpoint health, and final completion summary.
- **Exit status**: `0` when the requested implementation scope completes or reaches a user-approved stop point; `1` when mandatory prerequisites fail, a blocking task fails without a safe recovery path, or the user aborts after a critical failure.
- **Failure conditions**: Missing `tasks.md`, unresolved checklist gate, build or test failures on blocking tasks, rollback failure, or snapshot failure before a risky task.
