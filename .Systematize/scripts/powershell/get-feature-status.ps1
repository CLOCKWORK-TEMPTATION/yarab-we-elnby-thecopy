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

$env_ = Get-FeaturePathsEnv
$repoRoot = $env_.REPO_ROOT
if ($Branch) {
    $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $Branch
    $branchName = $Branch
} else {
    $featureDir = $env_.FEATURE_DIR
    $branchName = $env_.CURRENT_BRANCH
}

if (-not (Test-Path $featureDir)) {
    Write-Error "❌ Feature directory not found: $featureDir"
    exit 1
}

# تحليل حالة كل مرحلة
$phases = [ordered]@{}

# Systematize (sys.md)
$sysFile = Join-Path $featureDir 'sys.md'
if (Test-Path $sysFile) {
    $sysContent = Get-Content $sysFile -Raw
    $maturity = if ($sysContent -match 'Level\s*(\d)') { [int]$matches[1] } else { 1 }
    $phases['systematize'] = [PSCustomObject]@{ status = 'complete'; file_exists = $true; maturity = $maturity }
} else {
    $phases['systematize'] = [PSCustomObject]@{ status = 'not_started'; file_exists = $false }
}

# Clarify
$phases['clarify'] = Get-ClarificationStatus -FeatureDir $featureDir

# Constitution
$phases['constitution'] = Get-ConstitutionStatus -RepoRoot $repoRoot

# Research
$researchFile = Join-Path $featureDir 'research.md'
$phases['research'] = Get-DocumentCompletionStatus -FilePath $researchFile

# Plan
$planFile = Join-Path $featureDir 'plan.md'
$phases['plan'] = Get-DocumentCompletionStatus -FilePath $planFile

# Tasks
$tasksFile = Join-Path $featureDir 'tasks.md'
$phases['tasks'] = Get-DocumentCompletionStatus -FilePath $tasksFile

# Checklist
$checkDir = Join-Path $featureDir 'checklists'
$phases['checklist'] = [PSCustomObject]@{ status = if ((Test-Path $checkDir) -and (Get-ChildItem $checkDir -File -ErrorAction SilentlyContinue | Select-Object -First 1)) { 'complete' } else { 'not_started' } }

# Implementation
$tc = if (Test-Path $tasksFile) { Get-Content $tasksFile -Raw } else { '' }
$done = ([regex]::Matches($tc, '\[X\]|\[x\]')).Count
$phases['implementation'] = [PSCustomObject]@{
    status = if ($done -gt 0) { 'in_progress' } elseif ($phases['tasks'].status -eq 'complete' -and $phases['tasks'].file_exists) { 'complete' } else { 'not_started' }
    completed_tasks = $done
}

# تحديد الخطوة التالية
$nextStep = '/syskit.systematize'
$phaseOrder = @('systematize','clarify','constitution','research','plan','tasks','checklist','implementation')
$commandMap = @{
    'systematize' = '/syskit.systematize'
    'clarify' = '/syskit.clarify'
    'constitution' = '/syskit.constitution'
    'research' = '/syskit.research'
    'plan' = '/syskit.plan'
    'tasks' = '/syskit.tasks'
    'checklist' = '/syskit.checklist'
    'implementation' = '/syskit.implement'
}
foreach ($p in $phaseOrder) {
    if ($phases[$p].status -ne 'complete') {
        $nextStep = $commandMap[$p]
        break
    }
}

# Health score
$healthReport = Get-FeatureHealthReport -FeatureDir $featureDir
$healthScore = $healthReport.score

# آخر نشاط
$lastActivity = Get-FeatureLastActivity -FeatureDir $featureDir

$result = [PSCustomObject]@{
    branch       = $branchName
    phases       = $phases
    next_step    = $nextStep
    health_score = $healthScore
    last_activity = if ($lastActivity) { $lastActivity.ToString('yyyy-MM-dd') } else { '—' }
}

if ($Json) {
    $result | ConvertTo-Json -Depth 5
} else {
    Write-Host ""
    Write-Host "📊 Project Status: $branchName"
    Write-Host ""
    Write-Host "Phase Progress:"
    foreach ($p in $phaseOrder) {
        $s = $phases[$p]
        $icon = switch ($s.status) { 'complete' { '✅' }; 'partial' { '🔶' }; 'in_progress' { '🔄' }; default { '⬜' } }
        $detail = switch ($p) {
            'clarify' { if ($s.questions_resolved) { "$($s.questions_resolved) questions resolved" } else { '' } }
            'constitution' { if ($s.placeholders -ge 0) { "$($s.placeholders) placeholders remaining" } else { '' } }
            'tasks' { if ($s.placeholders -ge 0) { "$($s.placeholders) placeholders remaining" } else { '' } }
            default { '' }
        }
        $phaseName = $p.Substring(0,1).ToUpper() + $p.Substring(1)
        $detailStr = if ($detail) { " — $detail" } else { '' }
        Write-Host "$icon $phaseName$detailStr"
    }
    Write-Host ""
    Write-Host "Health Score: $healthScore/100"
    Write-Host "Last Activity: $(if($lastActivity){$lastActivity.ToString('yyyy-MM-dd')}else{'—'})"
    Write-Host "Next Step: $nextStep"
}
