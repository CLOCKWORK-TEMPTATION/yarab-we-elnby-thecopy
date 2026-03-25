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

$nodeArgs = @()
if ($ProjectName) { $nodeArgs += @('--project-name', $ProjectName) }
if ($Version) { $nodeArgs += @('--version', $Version) }
if ($Owner) { $nodeArgs += @('--owner', $Owner) }
if ($ProductManager) { $nodeArgs += @('--pm', $ProductManager) }
if ($TechLead) { $nodeArgs += @('--tech-lead', $TechLead) }
if ($Description) { $nodeArgs += @('--description', $Description) }
if ($Force) { $nodeArgs += '--force' }
if ($Json) { $nodeArgs += '--json' }
Invoke-NodeSyskitCommand -CommandName 'generate-constitution' -NodeArgs $nodeArgs
exit $LASTEXITCODE
