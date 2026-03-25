#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [string]$Branch,
    [switch]$Force,
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: update-sync-state.ps1 [-Branch <name>] [-Force] [-Json] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Branch <name>   اسم الـ feature"
    Write-Host "  -Force           تحديث حتى لو لم تتغير الملفات"
    Write-Host "  -Json            إخراج JSON"
    Write-Host "  -Help            عرض المساعدة"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($Force) { $nodeArgs += '--force' }
if ($Json) { $nodeArgs += '--json' }
Invoke-NodeSyskitCommand -CommandName 'update-sync-state' -NodeArgs $nodeArgs
exit $LASTEXITCODE
