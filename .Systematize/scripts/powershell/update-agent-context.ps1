#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet('claude','gemini','copilot','cursor-agent','qwen','opencode','codex','windsurf','kilocode','auggie','roo','codebuddy','amp','shai','tabnine','kiro-cli','agy','bob','qodercli','vibe','kimi','generic')]
    [string]$AgentType,
    [string]$Branch,
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Output @"
Usage: update-agent-context.ps1 [OPTIONS]

OPTIONS:
  -AgentType <type>  Specific agent to update
  -Branch <name>     Feature branch name
  -Json              Output result in JSON format
  -Help              Show this help message

Notes:
  The canonical Node runtime reads the Technical Context table first and falls
  back to Agent Context Seed only when required.
"@
    exit 0
}

. "$PSScriptRoot/common.ps1"

$nodeArgs = @()
if ($AgentType) { $nodeArgs += @('--agent-type', $AgentType) }
if ($Branch) { $nodeArgs += @('--branch', $Branch) }
if ($Json) { $nodeArgs += '--json' }

Invoke-NodeSyskitCommand -CommandName 'update-agent-context' -NodeArgs $nodeArgs
exit $LASTEXITCODE
