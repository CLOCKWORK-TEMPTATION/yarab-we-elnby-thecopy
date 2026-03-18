# the copy Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-18
Supported platforms: Claude Code


## Active Technologies

- Bootstrap stage: no plan-derived technologies yet

## Project Structure

```text
commands/
.Systematize/
specs/
```

## Commands

PowerShell:
pwsh -File .Systematize/scripts/powershell/create-new-feature.ps1 "Feature description" -Json

Node.js:
node .Systematize/scripts/node/cli.mjs create-feature "Feature description" --json

Bootstrap:
pwsh -File .Systematize/scripts/powershell/init-syskit.ps1
node .Systematize/scripts/node/cli.mjs init

## Code Style

Follow repository conventions and update these instructions after plan.md is created.
Prefer the Systematize workflow: sys -> clarify -> constitution -> research -> plan -> tasks -> implement.

## Recent Changes
- 001-v-formation-split-entry: Updated agent context


- bootstrap: Installed Systematize KIT

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Supported Platforms
- Claude Code
