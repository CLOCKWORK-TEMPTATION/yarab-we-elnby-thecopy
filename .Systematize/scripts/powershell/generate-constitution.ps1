#!/usr/bin/env pwsh
# Generate a project constitution from the constitution template
#
# This script resolves the constitution-template via the standard priority stack
# (overrides → presets → extensions → core), replaces placeholders with project
# metadata, and writes the result to .Systematize/memory/constitution.md.
#
# Usage:
#   ./generate-constitution.ps1 [-ProjectName <name>] [-Version <ver>] [-Json] [-Help]
#
# Examples:
#   ./generate-constitution.ps1 -ProjectName "My Platform"
#   ./generate-constitution.ps1 -ProjectName "My Platform" -Version "1.0.0" -Json

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$ProjectName,

    [string]$Version = '1.0.0',

    [string]$Owner,
    [string]$ProductManager,
    [string]$TechLead,
    [string]$Description,

    [switch]$Json,
    [switch]$Force,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

# Show help if requested
if ($Help) {
    Write-Output @"
Usage: generate-constitution.ps1 [OPTIONS]

Generate a project constitution from the constitution template.

OPTIONS:
  -ProjectName <name>    Project name (defaults to repo folder name)
  -Version <ver>         Constitution version (default: 1.0.0)
  -Owner <name>          Project owner name
  -ProductManager <name> Product manager name
  -TechLead <name>       Technical lead name
  -Description <text>    Short project description
  -Json                  Output result in JSON format
  -Force                 Overwrite existing constitution without prompting
  -Help                  Show this help message

EXAMPLES:
  ./generate-constitution.ps1 -ProjectName "My Platform"
  ./generate-constitution.ps1 -ProjectName "My Platform" -Version "1.0.0" -Owner "Team Lead"

OUTPUT:
  Creates .Systematize/memory/constitution.md from the constitution template
  with project-specific placeholders filled in.

"@
    exit 0
}

# Load common functions (includes Resolve-Template)
. "$PSScriptRoot/common.ps1"

# Resolve repository root
$repoRoot = Get-RepoRoot

# Default project name to repo folder name
if (-not $ProjectName) {
    $ProjectName = Split-Path $repoRoot -Leaf
}

# Resolve the constitution template using the priority stack
$templatePath = Resolve-Template -TemplateName 'constitution-template' -RepoRoot $repoRoot

if (-not $templatePath -or -not (Test-Path $templatePath)) {
    Write-Error "ERROR: Constitution template not found. Expected at .Systematize/templates/constitution-template.md"
    Write-Output "Run 'node .Systematize/scripts/node/cli.mjs init' or 'pwsh -File .Systematize/scripts/powershell/init-syskit.ps1' to scaffold .Systematize/templates, or create constitution-template.md manually."
    exit 1
}

# Target output path
$memoryDir = Join-Path $repoRoot '.Systematize/memory'
$outputFile = Join-Path $memoryDir 'constitution.md'

# Check if output already exists
if ((Test-Path $outputFile) -and -not $Force) {
    $existingContent = Get-Content -LiteralPath $outputFile -Raw -Encoding utf8
    # Check if it's not just the raw template (has actual project data)
    if ($existingContent -notmatch '\[PROJECT_NAME\]') {
        Write-Warning "Constitution already exists at $outputFile with project data."
        Write-Warning "Use -Force to overwrite."
        if ($Json) {
            [PSCustomObject]@{
                Status  = 'skipped'
                Path    = $outputFile
                Reason  = 'Constitution already exists with project data. Use -Force to overwrite.'
            } | ConvertTo-Json -Compress
        }
        exit 0
    }
}

# Ensure memory directory exists
New-Item -ItemType Directory -Path $memoryDir -Force | Out-Null

# Read template content
$content = Get-Content -LiteralPath $templatePath -Raw -Encoding utf8

# Prepare date
$today = (Get-Date).ToString('yyyy-MM-dd')

# Replace placeholders
$replacements = @{
    '[PROJECT_NAME]'          = $ProjectName
    '[CONSTITUTION_VERSION]'  = $Version
    '[CONSTITUTION_DATE]'     = $today
    '[LAST_AMENDED_DATE]'     = $today
    '[PROJECT_DESCRIPTION]'   = if ($Description) { $Description } else { '[PROJECT_DESCRIPTION]' }
    '[PROJECT_OWNER]'         = if ($Owner) { $Owner } else { '[PROJECT_OWNER]' }
    '[PRODUCT_MANAGER]'       = if ($ProductManager) { $ProductManager } else { '[PRODUCT_MANAGER]' }
    '[TECH_LEAD]'             = if ($TechLead) { $TechLead } else { '[TECH_LEAD]' }
}

foreach ($key in $replacements.Keys) {
    $content = $content -replace [Regex]::Escape($key), $replacements[$key]
}

# Write output
Set-Content -LiteralPath $outputFile -Value $content -NoNewline -Encoding utf8

# Count sections filled vs placeholder
$totalPlaceholders = ([regex]::Matches($content, '\[[A-Z_]{3,}\]')).Count
$totalSections = ([regex]::Matches($content, '^## ', [System.Text.RegularExpressions.RegexOptions]::Multiline)).Count

# Output results
if ($Json) {
    [PSCustomObject]@{
        Status             = 'generated'
        OutputFile         = $outputFile
        TemplatePath       = $templatePath
        ProjectName        = $ProjectName
        Version            = $Version
        Date               = $today
        TotalSections      = $totalSections
        RemainingPlaceholders = $totalPlaceholders
    } | ConvertTo-Json -Compress
} else {
    Write-Output "=== Constitution Generated ==="
    Write-Output "  Template:     $templatePath"
    Write-Output "  Output:       $outputFile"
    Write-Output "  Project:      $ProjectName"
    Write-Output "  Version:      $Version"
    Write-Output "  Date:         $today"
    Write-Output "  Sections:     $totalSections"
    Write-Output "  Placeholders: $totalPlaceholders remaining"
    Write-Output ""
    if ($totalPlaceholders -gt 0) {
        Write-Output "Next step: Open $outputFile and fill in the remaining [$totalPlaceholders] placeholders."
        Write-Output "Sections to prioritize (minimum viable constitution):"
        Write-Output "  1. Section 7  - Project identity and problem definition"
        Write-Output "  2. Section 8  - Stakeholders and governance"
        Write-Output "  3. Section 9  - User requests registry"
        Write-Output "  4. Section 11 - Functional requirements"
        Write-Output "  5. Section 12 - Non-functional requirements"
        Write-Output "  6. Section 13 - Business rules"
        Write-Output "  7. Section 22 - Risk registry"
        Write-Output "  8. Section 26 - Traceability matrix"
        Write-Output "  9. Section 27 - Completion checklist"
    } else {
        Write-Output "All placeholders filled. Constitution is ready for review."
    }
}
