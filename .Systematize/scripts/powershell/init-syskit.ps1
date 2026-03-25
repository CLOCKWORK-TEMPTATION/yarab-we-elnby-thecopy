#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [string]$TargetPath = (Get-Location).Path,
    [string]$Platforms,
    [switch]$Force,
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output @"
Usage: init-syskit.ps1 [OPTIONS]

OPTIONS:
  -TargetPath <path>  Target repository path
  -Platforms <list>   Comma-separated platform keys to initialize
  -Force              Rewrite managed files without prompting
  -Json               Output JSON summary
  -Help               Show this help message
"@
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @('--target-path', $TargetPath)
if ($Platforms) { $nodeArgs += @('--platforms', $Platforms) }
if ($Force) { $nodeArgs += '--force' }
if ($Json) { $nodeArgs += '--json' }

Invoke-NodeSyskitCommand -CommandName 'init' -NodeArgs $nodeArgs
exit $LASTEXITCODE
