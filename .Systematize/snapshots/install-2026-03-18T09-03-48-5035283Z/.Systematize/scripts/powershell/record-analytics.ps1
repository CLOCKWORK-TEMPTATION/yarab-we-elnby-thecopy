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

function Get-EmptyAnalyticsState {
    return @{
        schema_version = 1
        features = @{}
        extensions = @{
            hooks_executed = @()
            custom_commands_used = @()
        }
    }
}

function ConvertTo-NormalizedAnalyticsState {
    param([object]$RawState)

    $state = Get-EmptyAnalyticsState
    if (-not $RawState) {
        return $state
    }

    if ($RawState.features -is [System.Collections.IEnumerable] -and $RawState.features -isnot [hashtable] -and $RawState.features -isnot [string]) {
        foreach ($feature in @($RawState.features)) {
            if (-not $feature.branch) { continue }
            $state.features[$feature.branch] = @{
                created_at = if ($feature.created_at) { $feature.created_at } else { (Get-Date).ToString('o') }
                events = @($feature.events)
                phases = if ($feature.phases) { @{} + $feature.phases } else { @{} }
            }
        }
    } elseif ($RawState.features) {
        foreach ($entry in $RawState.features.PSObject.Properties) {
            $value = $entry.Value
            $state.features[$entry.Name] = @{
                created_at = if ($value.created_at) { $value.created_at } else { (Get-Date).ToString('o') }
                events = @($value.events)
                phases = if ($value.phases) { @{} + $value.phases } else { @{} }
            }
        }
    }

    if ($RawState.extensions) {
        $state.extensions.hooks_executed = @($RawState.extensions.hooks_executed)
        $state.extensions.custom_commands_used = @($RawState.extensions.custom_commands_used)
    }

    return $state
}

$env_ = Get-FeaturePathsEnv
$repoRoot = $env_.REPO_ROOT
$branchName = if ($Branch) { $Branch } else { $env_.CURRENT_BRANCH }
$runtimeConfig = Get-SyskitConfig -RepoRoot $repoRoot
$analyticsPath = Join-Path $repoRoot '.Systematize/memory/analytics.json'

if ($runtimeConfig -and $runtimeConfig.analytics_enabled -eq $false -and $Event -ne 'analytics_override') {
    $result = @{
        branch = $branchName
        event = $Event
        recorded = $false
        reason = 'Analytics disabled in configuration'
    }

    if ($Json) {
        $result | ConvertTo-Json -Depth 6
    } else {
        Write-Host "ℹ️ Analytics disabled in configuration"
    }
    exit 0
}

if (-not (Test-Path $analyticsPath)) {
    Ensure-Dir -Path (Split-Path -Parent $analyticsPath)
    (Get-EmptyAnalyticsState | ConvertTo-Json -Depth 8) | Set-Content -LiteralPath $analyticsPath -Encoding utf8
}

$rawAnalytics = Get-Content -LiteralPath $analyticsPath -Raw -Encoding utf8 | ConvertFrom-Json
$analytics = ConvertTo-NormalizedAnalyticsState -RawState $rawAnalytics

if (-not $analytics.features.ContainsKey($branchName)) {
    $analytics.features[$branchName] = @{
        created_at = (Get-Date).ToString('o')
        events = @()
        phases = @{}
    }
}

$timestamp = (Get-Date).ToString('o')
if ($Event) {
    $eventObj = @{
        type = $Event
        timestamp = $timestamp
    }

    foreach ($key in $Data.Keys) {
        $eventObj[$key] = $Data[$key]
    }

    $analytics.features[$branchName].events = @($analytics.features[$branchName].events) + @($eventObj)

    if ($Event -eq 'phase_completed' -and $Data.ContainsKey('phase')) {
        $analytics.features[$branchName].phases[$Data['phase']] = @{
            completed_at = $timestamp
            duration_hours = if ($Data.ContainsKey('duration')) { $Data['duration'] } else { $null }
        }
    }

    if ($Event -eq 'hook_executed') {
        $analytics.extensions.hooks_executed = @($analytics.extensions.hooks_executed) + @(@{
            branch = $branchName
            timestamp = $timestamp
            command = if ($Data.ContainsKey('command')) { $Data['command'] } elseif ($Data.ContainsKey('hook')) { $Data['hook'] } else { $null }
            status = if ($Data.ContainsKey('status')) { $Data['status'] } else { 'executed' }
        })
    }

    if ($Event -eq 'custom_command_used') {
        $analytics.extensions.custom_commands_used = @($analytics.extensions.custom_commands_used) + @(@{
            branch = $branchName
            timestamp = $timestamp
            command = if ($Data.ContainsKey('command')) { $Data['command'] } else { $null }
        })
    }
}

$analytics | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $analyticsPath -Encoding utf8

$result = @{
    branch = $branchName
    event = $Event
    recorded = $true
    data = $Data
}

if ($Json) {
    $result | ConvertTo-Json -Depth 10
} else {
    if ($Event) {
        Write-Host "✅ Event '$Event' recorded for $branchName"
    } else {
        Write-Host "✅ Feature '$branchName' tracked in analytics"
    }
}
