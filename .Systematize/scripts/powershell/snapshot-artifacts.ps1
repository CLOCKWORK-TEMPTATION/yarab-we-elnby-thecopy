#!/usr/bin/env pwsh
# Snapshot artifacts through the canonical Node runtime
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$Tag,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output "Usage: ./snapshot-artifacts.ps1 [-Branch <name>] [-Tag <label>] [-Json] [-Help]"
    Write-Output "  -Branch   Target feature branch"
    Write-Output "  -Tag      Optional snapshot label"
    Write-Output "  -Json     Output results in JSON format"
    Write-Output "  -Help     Show this help message"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($Tag) { $nodeArgs += @('--tag', $Tag) }
if ($Json) { $nodeArgs += '--json' }

Invoke-NodeSyskitCommand -CommandName 'snapshot' -NodeArgs $nodeArgs
exit $LASTEXITCODE
