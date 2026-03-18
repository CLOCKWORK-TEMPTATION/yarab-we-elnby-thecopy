---
description: Export feature documentation in various formats — HTML dashboard, executive summary, Confluence/Notion-ready markdown, or combined PDF-ready document.
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

2. **Determine export format** from `$ARGUMENTS`:
   - `html` or `dashboard` → HTML Dashboard
   - `summary` or `executive` → Executive Summary
   - `confluence` or `notion` → Confluence/Notion-ready Markdown
   - `combined` or `pdf` → Combined PDF-ready Markdown
   - If not specified, use the `export_format` setting from `.Systematize/config/syskit-config.yml`
   - If still not clear, ask the user

3. **Load all feature artifacts**:
   - Read sys.md, plan.md, tasks.md (required)
   - Read constitution.md from `.Systematize/memory/` (if exists)
   - Run `run-healthcheck.ps1 -Json` / `node cli.mjs healthcheck --json` to get health score

4. **Generate export based on format**:

   **HTML Dashboard**:
   - Run the export dashboard script for the generated file:
     - **PowerShell**: `pwsh -File .Systematize/scripts/powershell/export-dashboard.ps1 -Json`
     - **Node.js**: `node .Systematize/scripts/node/cli.mjs export-dashboard --json`
   - If the script is not available, generate inline HTML with:
     - Project summary card from constitution/sys.md
     - Feature status with progress bars
     - Requirements table (FR count, AC coverage)
     - Risk matrix (open risks by severity)
     - Traceability overview
     - Health score badge

   **Executive Summary**:
   - Generate a single-page Markdown with:
     - Project name and one-line description
     - Current phase and overall progress
     - Top 3 risks with severity
     - Open decisions/blockers
     - Next steps with commands
   - Save to `.Systematize/exports/{branch}-executive-summary.md`

   **Confluence/Notion**:
   - Generate Markdown optimized for wiki platforms:
     - Table of contents at top
     - Collapsible sections using `<details>` tags
     - Clean table formatting
     - Relative links converted to headers
   - Save to `.Systematize/exports/{branch}-wiki.md`

   **Combined PDF-ready**:
   - Concatenate in order: constitution → sys → plan → tasks
   - Add page breaks between sections (`---`)
   - Add table of contents at beginning
   - Save to `.Systematize/exports/{branch}-combined.md`

5. **Output**: Report the export location and summary.

## Rules

- HTML Dashboard must be self-contained (inline CSS, no external dependencies)
- Executive Summary must fit on one page (≤500 words)
- All exports go to `.Systematize/exports/` directory
- Preserve all IDs and traceability links in exports

## Output

- **Primary format**: Export summary in Markdown and one generated artifact under `.Systematize/exports/`.
- **Files created or updated**: Format-specific export file such as HTML dashboard, executive summary, wiki Markdown, or combined Markdown.
- **Success result**: Export path, selected format, included source artifacts, and health snapshot.
- **Exit status**: `0` when the requested export is written; `1` when required source artifacts are missing or the export format cannot be resolved.
- **Failure conditions**: Missing feature documents, invalid export target, or write failure under `.Systematize/exports/`.
