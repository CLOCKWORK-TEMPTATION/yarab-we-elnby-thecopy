---
description: Bootstrap a repository with Systematize KIT assets, templates, scripts, commands, and platform-specific guidance files before any feature workflow starts.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Initialize the current repository as a Systematize-enabled workspace.

This command is the **first step** before `/syskit.systematize`, `/syskit.plan`, or `/syskit.tasks`.

## Outline

1. **Resolve bootstrap scope** from `$ARGUMENTS`:
   - Optional target path
   - Optional platform list
   - Whether overwrite/force mode is required

2. **Detect repository context**:
   - Confirm the target path exists or can be created
   - Detect whether bootstrap artifacts are already installed using install state first, then legacy file markers
   - If bootstrap artifacts already exist, warn before overwriting managed files
   - On reinstall, present the full platform catalog for selection unless the user already supplied a platform subset
   - Treat platform selection as the source of truth for creating both official files and any mirrored platform directories such as `.claude/`

3. **Run the bootstrap installer**:
   - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/init-syskit.ps1`
   - **Node.js**: `node .Systematize/scripts/node/cli.mjs init`
   - Pass `-TargetPath` / `--target-path` if the user specified a different repository
   - Pass `-Platforms` / `--platforms` if the user wants a subset of providers
   - If reinstall is approved, allow the installer to create a snapshot before rewriting managed outputs
   - In interactive reinstall mode, keep the prompt stage in English and use arrow-key multi-select navigation with Space to toggle and Enter to confirm

4. **Verify bootstrap outputs**:
   - `commands/`
   - `.Systematize/config/`
   - `.Systematize/templates/`
   - `.Systematize/scripts/`
   - `.Systematize/presets/`
   - platform-specific files such as `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/*`, `.github/copilot-instructions.md`, `.continue/rules/*`, `.amazonq/rules/*`, `.vscode/*`

5. **Report next step**:
   - If bootstrap succeeded, guide the user to `/syskit.guide` or `/syskit.systematize`
   - If some files were skipped because they already existed, summarize the skipped set clearly
   - If reinstall happened, summarize whether installation was detected, which platforms were selected, and where the snapshot was written

## Rules

- Treat bootstrap as repository-level initialization, not feature-level setup
- Prefer non-destructive behavior unless the user explicitly asks to overwrite managed files
- Respect platform differences: Agent CLI, IDE-based assistants, and tool/editor outputs are not interchangeable
- Do not require mirrored directories such as `.claude/` to exist before bootstrap; create them automatically when the selected platform declares them
- Do not require `plan.md`, `tasks.md`, or an existing feature branch for bootstrap

## Output

- **Primary format**: Bootstrap summary in Markdown, plus optional JSON from the installer script.
- **Files created or updated**: `commands/`, `.Systematize/`, presets, templates, scripts, and platform guidance files such as `AGENTS.md` or `CLAUDE.md`.
- **Success result**: Target root, installation detection state, selected platforms, created and overwritten counts, skipped count, optional snapshot path, and the next recommended command.
- **Exit status**: `0` when initialization completes or safely skips existing managed files; `1` when the target path is invalid, a platform key is unknown, or a managed write fails.
- **Failure conditions**: Missing bootstrap assets, unreadable platform catalog, or filesystem write errors.
