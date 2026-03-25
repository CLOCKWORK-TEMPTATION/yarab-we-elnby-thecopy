#!/usr/bin/env pwsh
# Export a dashboard through the canonical Node runtime
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$OutputPath,
    [switch]$OpenInBrowser,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output "Usage: ./export-dashboard.ps1 [-Branch <name>] [-OutputPath <path>] [-OpenInBrowser] [-Json] [-Help]"
    Write-Output "  -Branch         Target feature branch"
    Write-Output "  -OutputPath     Output HTML path"
    Write-Output "  -OpenInBrowser  Open the generated dashboard after export"
    Write-Output "  -Json           Output results in JSON format"
    Write-Output "  -Help           Show this help message"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($OutputPath) { $nodeArgs += @('--output', $OutputPath) }
if ($OpenInBrowser) { $nodeArgs += '--open-in-browser' }
if ($Json) { $nodeArgs += '--json' }

Invoke-NodeSyskitCommand -CommandName 'export-dashboard' -NodeArgs $nodeArgs
exit $LASTEXITCODE
