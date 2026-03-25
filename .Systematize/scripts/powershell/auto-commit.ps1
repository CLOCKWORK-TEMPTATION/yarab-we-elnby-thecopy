#!/usr/bin/env pwsh
# Auto-commit through the canonical Node runtime
[CmdletBinding()]
param(
    [string]$Command,
    [string]$Branch,
    [string]$Message,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output "Usage: ./auto-commit.ps1 [-Command <name>] [-Branch <name>] [-Message <msg>] [-Json] [-Help]"
    Write-Output "  -Command   Command name associated with the commit"
    Write-Output "  -Branch    Target feature branch"
    Write-Output "  -Message   Override commit message"
    Write-Output "  -Json      Output results in JSON format"
    Write-Output "  -Help      Show this help message"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($Command) { $nodeArgs += @('--command', $Command) }
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($Message) { $nodeArgs += @('--message', $Message) }
if ($Json) { $nodeArgs += '--json' }

Invoke-NodeSyskitCommand -CommandName 'auto-commit' -NodeArgs $nodeArgs
exit $LASTEXITCODE
