#!/usr/bin/env pwsh
# Create a new feature through the canonical Node runtime
[CmdletBinding()]
param(
    [switch]$Json,
    [string]$ShortName,
    [int]$Number = 0,
    [string]$Preset,
    [switch]$Help,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$FeatureDescription
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output "Usage: ./create-new-feature.ps1 [-Json] [-ShortName <name>] [-Number N] [-Preset <name>] <feature description>"
    Write-Output "  -Json        Output results in JSON format"
    Write-Output "  -ShortName   Provide a custom branch suffix"
    Write-Output "  -Number      Override the auto-detected feature number"
    Write-Output "  -Preset      Apply a named preset"
    Write-Output "  -Help        Show this help message"
    exit 0
}

if (-not $FeatureDescription -or $FeatureDescription.Count -eq 0) {
    Write-Error "Usage: ./create-new-feature.ps1 [-Json] [-ShortName <name>] <feature description>"
    exit 1
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($ShortName) { $nodeArgs += @('--short-name', $ShortName) }
if ($Number -gt 0) { $nodeArgs += @('--number', $Number.ToString()) }
if ($Preset) { $nodeArgs += @('--preset', $Preset) }
if ($Json) { $nodeArgs += '--json' }
$nodeArgs += $FeatureDescription

Invoke-NodeSyskitCommand -CommandName 'create-feature' -NodeArgs $nodeArgs
exit $LASTEXITCODE
