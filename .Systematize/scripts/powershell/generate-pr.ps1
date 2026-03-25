#!/usr/bin/env pwsh
# Generate PR content through the canonical Node runtime
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$BaseBranch = 'main',
    [switch]$Draft,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output "Usage: ./generate-pr.ps1 [-Branch <name>] [-BaseBranch <name>] [-Draft] [-Json] [-Help]"
    Write-Output "  -Branch      Target feature branch"
    Write-Output "  -BaseBranch  Base branch for the generated PR context"
    Write-Output "  -Draft       Preserve draft intent for compatibility callers"
    Write-Output "  -Json        Output results in JSON format"
    Write-Output "  -Help        Show this help message"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($BaseBranch) { $nodeArgs += @('--base', $BaseBranch) }
if ($Draft) { $nodeArgs += '--draft' }
if ($Json) { $nodeArgs += '--json' }

Invoke-NodeSyskitCommand -CommandName 'generate-pr' -NodeArgs $nodeArgs
exit $LASTEXITCODE
