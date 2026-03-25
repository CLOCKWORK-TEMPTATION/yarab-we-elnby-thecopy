#!/usr/bin/env pwsh
# فحص التنبيهات المعرفة في alerts.yml
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$Severity,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: check-alerts.ps1 [-Branch <name>] [-Severity <level>] [-Json] [-Help]"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($Severity) { $nodeArgs += @('--severity', $Severity) }
if ($Json) { $nodeArgs += '--json' }
Invoke-NodeSyskitCommand -CommandName 'check-alerts' -NodeArgs $nodeArgs
exit $LASTEXITCODE
