#!/usr/bin/env pwsh
# جمع بيانات حالة feature
[CmdletBinding()]
param(
    [string]$Branch,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: get-feature-status.ps1 [-Branch <name>] [-Json] [-Help]"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($Json) { $nodeArgs += '--json' }
Invoke-NodeSyskitCommand -CommandName 'feature-status' -NodeArgs $nodeArgs
exit $LASTEXITCODE
