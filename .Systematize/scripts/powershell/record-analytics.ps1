#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$Event,
    [hashtable]$Data = @{},
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: record-analytics.ps1 [-Branch <name>] [-Event <type>] [-Data @{}] [-Json] [-Help]"
    Write-Host ""
    Write-Host "Events: feature_created, phase_completed, feature_completed, rework, hook_executed, custom_command_used, command_lifecycle"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($Event) { $nodeArgs += @('--event', $Event) }
if ($Data -and $Data.Count -gt 0) { $nodeArgs += @('--data', ($Data | ConvertTo-Json -Compress -Depth 10)) }
if ($Json) { $nodeArgs += '--json' }
Invoke-NodeSyskitCommand -CommandName 'record-analytics' -NodeArgs $nodeArgs
exit $LASTEXITCODE
