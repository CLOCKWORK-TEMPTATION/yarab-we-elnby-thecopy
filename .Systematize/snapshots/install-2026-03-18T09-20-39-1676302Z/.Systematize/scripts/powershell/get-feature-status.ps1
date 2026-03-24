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
if ((Test-Path $sysFile) -and (Get-Content $sysFile -Raw) -match 'Clarification Contract') {
    $resolved = ([regex]::Matches((Get-Content $sysFile -Raw), '→ A:')).Count
    $phases['clarify'] = [PSCustomObject]@{ status = if ($resolved -gt 0) { 'complete' } else { 'not_started' }; questions_resolved = $resolved }
} else {
    $phases['clarify'] = [PSCustomObject]@{ status = 'not_started'; questions_resolved = 0 }
}

# Constitution
$constFile = Join-Path $repoRoot '.Systematize/memory/constitution.md'
if (Test-Path $constFile) {
    $constContent = Get-Content $constFile -Raw
    $totalSections = 27
    $filledSections = ([regex]::Matches($constContent, '(?m)^## [٠-٩١٢٣٤٥٦٧٨٩]+\.')).Count
    $completion = [math]::Round(($filledSections / $totalSections) * 100)
    $phases['constitution'] = [PSCustomObject]@{ status = if ($completion -ge 80) { 'complete' } else { 'partial' }; completion = $completion }
} else {
    $phases['constitution'] = [PSCustomObject]@{ status = 'not_started'; completion = 0 }
}

# Research
$researchFile = Join-Path $featureDir 'research.md'
$phases['research'] = [PSCustomObject]@{ status = if (Test-Path $researchFile) { 'complete' } else { 'not_started' }; file_exists = (Test-Path $researchFile) }

# Plan
$planFile = Join-Path $featureDir 'plan.md'
$phases['plan'] = [PSCustomObject]@{ status = if (Test-Path $planFile) { 'complete' } else { 'not_started' }; file_exists = (Test-Path $planFile) }

# Tasks
$tasksFile = Join-Path $featureDir 'tasks.md'
if (Test-Path $tasksFile) {
    $tc = Get-Content $tasksFile -Raw
    $total = ([regex]::Matches($tc, '(?:BE|FE|DO|CC)-T-\d{3}')).Count
    $done = ([regex]::Matches($tc, '\[X\]|\[x\]')).Count
    $phases['tasks'] = [PSCustomObject]@{ status = if ($total -gt 0 -and $done -eq $total) { 'complete' } elseif ($total -gt 0) { 'in_progress' } else { 'complete' }; file_exists = $true; total = $total; completed = $done }
} else {
    $phases['tasks'] = [PSCustomObject]@{ status = 'not_started'; file_exists = $false }
}

# Checklist
$checkDir = Join-Path $featureDir 'checklists'
$phases['checklist'] = [PSCustomObject]@{ status = if ((Test-Path $checkDir) -and (Get-ChildItem $checkDir -File -ErrorAction SilentlyContinue | Select-Object -First 1)) { 'complete' } else { 'not_started' } }

# Implementation
$phases['implementation'] = [PSCustomObject]@{ status = if ($phases['tasks'].status -eq 'complete' -and $phases['tasks'].file_exists) { 'complete' } elseif ($phases['tasks'].status -eq 'in_progress') { 'in_progress' } else { 'not_started' } }

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
    if ($phases[$p].status -eq 'not_started') {
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
            'constitution' { if ($s.completion) { "$($s.completion)% complete" } else { '' } }
            'tasks' { if ($s.total) { "$($s.completed)/$($s.total) tasks" } else { '' } }
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
