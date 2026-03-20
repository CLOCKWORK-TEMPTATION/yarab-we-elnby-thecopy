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

$env_ = Get-FeaturePathsEnv
$repoRoot = $env_.REPO_ROOT
$branchName = if ($Branch) { $Branch } else { $env_.CURRENT_BRANCH }
$featureDir = if ($Branch) { Get-FeatureDir -RepoRoot $repoRoot -Branch $Branch } else { $env_.FEATURE_DIR }
$runtimeConfig = Get-SyskitConfig -RepoRoot $repoRoot
$alertsConfig = Get-AlertsConfig -RepoRoot $repoRoot

if ($runtimeConfig -and $runtimeConfig.alerts_enabled -eq $false) {
    $result = [PSCustomObject]@{
        branch = $branchName
        alerts = @()
        hasBlocking = $false
        totalAlerts = 0
        message = 'Alerts disabled in configuration'
    }

    if ($Json) { $result | ConvertTo-Json -Depth 5 }
    else { Write-Host "ℹ️ Alerts disabled for $branchName" }
    exit 0
}

$sysContent = if (Test-Path (Join-Path $featureDir 'sys.md')) { Get-Content (Join-Path $featureDir 'sys.md') -Raw } else { '' }
$tasksContent = if (Test-Path (Join-Path $featureDir 'tasks.md')) { Get-Content (Join-Path $featureDir 'tasks.md') -Raw } else { '' }
$researchContent = if (Test-Path (Join-Path $featureDir 'research.md')) { Get-Content (Join-Path $featureDir 'research.md') -Raw } else { '' }
$alerts = @()

function Get-AlertSetting {
    param([string]$Name)
    if ($alertsConfig.alerts.ContainsKey($Name)) { return $alertsConfig.alerts[$Name] }
    return @{}
}

function Test-AlertEnabled {
    param([string]$Name)
    $setting = Get-AlertSetting -Name $Name
    return (-not $setting.ContainsKey('enabled') -or $setting.enabled -ne $false)
}

$frIDs = [regex]::Matches($sysContent, 'FR-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique

if ((Test-AlertEnabled -Name 'orphan_requirement') -and $tasksContent) {
    $setting = Get-AlertSetting -Name 'orphan_requirement'
    $frInTasks = [regex]::Matches($tasksContent, 'FR-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    $orphaned = $frIDs | Where-Object { $_ -notin $frInTasks }
    if ($orphaned.Count -gt 0) {
        $alerts += [PSCustomObject]@{
            name = 'orphan_requirement'
            severity = $setting.severity
            action = $setting.action
            message = "FRs without tasks: $($orphaned -join ', ')"
            details = @($orphaned)
        }
    }
}

if (Test-AlertEnabled -Name 'scope_creep') {
    $setting = Get-AlertSetting -Name 'scope_creep'
    $growthFactor = [double]($setting.growth_factor)
    if (-not $growthFactor) { $growthFactor = 1.2 }
    $syncStatePath = Join-Path $repoRoot '.Systematize/memory/sync-state.json'
    if (Test-Path $syncStatePath) {
        $syncState = Get-Content $syncStatePath -Raw | ConvertFrom-Json
        $featureState = $syncState.features.$branchName
        if ($featureState -and $featureState.baseline_fr_count) {
            $baseline = [int]$featureState.baseline_fr_count
            if ($baseline -gt 0 -and $frIDs.Count -gt ($baseline * $growthFactor)) {
                $alerts += [PSCustomObject]@{
                    name = 'scope_creep'
                    severity = $setting.severity
                    action = $setting.action
                    message = "FR count grew from $baseline to $($frIDs.Count)"
                    details = @()
                }
            }
        }
    }
}

$latestActivity = $null
foreach ($file in @((Join-Path $featureDir 'sys.md'), (Join-Path $featureDir 'plan.md'), (Join-Path $featureDir 'tasks.md'))) {
    if (Test-Path $file) {
        $modifiedAt = (Get-Item $file).LastWriteTime
        if (-not $latestActivity -or $modifiedAt -gt $latestActivity) {
            $latestActivity = $modifiedAt
        }
    }
}

if ((Test-AlertEnabled -Name 'stale_feature') -and $latestActivity) {
    $setting = Get-AlertSetting -Name 'stale_feature'
    $maxAgeDays = [double]($setting.max_age_days)
    if (-not $maxAgeDays) { $maxAgeDays = 14 }
    $ageDays = ((Get-Date) - $latestActivity).TotalDays
    if ($ageDays -gt $maxAgeDays) {
        $alerts += [PSCustomObject]@{
            name = 'stale_feature'
            severity = $setting.severity
            action = $setting.action
            message = "No activity for $([math]::Round($ageDays)) days"
            details = @()
        }
    }
}

if ((Test-AlertEnabled -Name 'stale_assumption') -and $researchContent -and $latestActivity) {
    $setting = Get-AlertSetting -Name 'stale_assumption'
    $pendingStatus = if ($setting.pending_status) { $setting.pending_status.ToString().ToLower() } else { 'pending' }
    $maxAgeDays = [double]($setting.max_age_days)
    if (-not $maxAgeDays) { $maxAgeDays = 7 }
    $assumptionHeadings = [regex]::Matches($researchContent, '^#+\s+.*ASM-\d{3}.*', [System.Text.RegularExpressions.RegexOptions]::Multiline) | ForEach-Object { $_.Value }

    foreach ($heading in $assumptionHeadings) {
        if ($heading -notmatch 'ASM-\d{3}') { continue }
        $assumptionId = $matches[0]
        $sectionPattern = "### .*${assumptionId}.*`n([\s\S]*?)(?=###|$)"
        $sectionMatch = [regex]::Match($researchContent, $sectionPattern)
        if ($sectionMatch.Success -and $sectionMatch.Groups[1].Value.ToLower().Contains($pendingStatus)) {
            $ageDays = ((Get-Date) - $latestActivity).TotalDays
            if ($ageDays -gt $maxAgeDays) {
                $alerts += [PSCustomObject]@{
                    name = 'stale_assumption'
                    severity = $setting.severity
                    action = $setting.action
                    message = "$assumptionId is still pending after $maxAgeDays days"
                    details = @($assumptionId)
                }
                break
            }
        }
    }
}

if ((Test-AlertEnabled -Name 'risk_escalation') -and $sysContent) {
    $setting = Get-AlertSetting -Name 'risk_escalation'
    $levels = if ($setting.levels) { @($setting.levels -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) } else { @('High', 'Critical') }
    $riskIds = [regex]::Matches($sysContent, 'RK-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    foreach ($riskId in $riskIds) {
        $sectionPattern = "### .*${riskId}.*`n([\s\S]*?)(?=###|$)"
        $sectionMatch = [regex]::Match($sysContent, $sectionPattern)
        if ($sectionMatch.Success) {
            $section = $sectionMatch.Groups[1].Value
            if ($levels | Where-Object { $section.Contains($_) }) {
                $alerts += [PSCustomObject]@{
                    name = 'risk_escalation'
                    severity = $setting.severity
                    action = $setting.action
                    message = "$riskId is flagged as $($levels -join '/')"
                    details = @($riskId)
                }
            }
        }
    }
}

$filtered = if ($Severity) { @($alerts | Where-Object { $_.severity -eq $Severity }) } else { @($alerts) }
$hasBlocking = ($filtered | Where-Object { $_.action -eq 'block' }).Count -gt 0
$result = [PSCustomObject]@{
    branch = $branchName
    alerts = $filtered
    hasBlocking = $hasBlocking
    totalAlerts = $filtered.Count
}

if ($Json) {
    $result | ConvertTo-Json -Depth 5
} elseif ($filtered.Count -eq 0) {
    Write-Host "✅ No alerts for $branchName"
} else {
    Write-Host "⚠️ $($filtered.Count) alert(s):"
    foreach ($alert in $filtered) {
        $icon = switch ($alert.severity) {
            'critical' { '🔴' }
            'high' { '🟠' }
            'warning' { '🟡' }
            'info' { '🔵' }
            default { '⚪' }
        }
        Write-Host "  $icon [$($alert.severity.ToUpper())] $($alert.name): $($alert.message)"
        if ($alert.action -eq 'block') {
            Write-Host "     ⛔ BLOCKING — must be resolved before proceeding"
        }
    }
}

if ($hasBlocking) { exit 1 }
