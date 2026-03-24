#!/usr/bin/env pwsh
# توليد PR template من بيانات الوثائق
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$BaseBranch = 'main',
    [switch]$Draft,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: generate-pr.ps1 [-Branch <name>] [-BaseBranch <name>] [-Draft] [-Json] [-Help]"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$env_ = Get-FeaturePathsEnv
$repoRoot = $env_.REPO_ROOT
$branchName = if ($Branch) { $Branch } else { $env_.CURRENT_BRANCH }
$featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $branchName

if (-not (Test-Path $featureDir)) {
    Write-Error "❌ Feature directory not found: $featureDir"
    exit 1
}

$sysFile = Join-Path $featureDir 'sys.md'
$featureName = $branchName
$featureDesc = ''
if (Test-Path $sysFile) {
    $sc = Get-Content $sysFile -Raw
    if ($sc -match '# Feature Systematize.*?:\s*(.+)') { $featureName = $matches[1].Trim() }
    if ($sc -match '\*\*What is broken\?\*\*\s*\|\s*([^\|]+)') { $featureDesc = $matches[1].Trim() }
}

$healthReport = Get-FeatureHealthReport -FeatureDir $featureDir
$healthScore = if ($healthReport) { $healthReport.Score } else { 'N/A' }
$healthStatus = if ($healthReport) { $healthReport.Status } else { 'UNKNOWN' }
$progress = Get-FeatureProgress -FeatureDir $featureDir

# Artifacts checklist
$artifacts = @()
foreach ($f in @('sys.md','plan.md','tasks.md','research.md')) {
    $fp = Join-Path $featureDir $f
    $exists = Test-Path $fp
    $check = if ($exists) { 'x' } else { ' ' }
    $artifacts += "- [$check] $f"
}

# Build PR body
$prBody = @"
## Feature: $featureName

$featureDesc

### Artifacts
$($artifacts -join "`n")

### Quality
- Health Score: $healthScore/100
- Health Status: $healthStatus
- Progress: $($progress.Percent)% ($($progress.Completed)/$($progress.Total) phases)

### Checklist
- [ ] All artifacts reviewed
- [ ] Health score ≥ 70
- [ ] No blocking alerts
- [ ] Tests passing
"@

# حفظ القالب
$prFile = Join-Path $repoRoot ".Systematize/exports/${branchName}-pr.md"
$exportsDir = Join-Path $repoRoot '.Systematize/exports'
New-Item -ItemType Directory -Path $exportsDir -Force | Out-Null
$prBody | Set-Content $prFile

# محاولة إنشاء PR عبر gh CLI
$prCreated = $false
if ($env_.HAS_GIT) {
    try {
        $ghAvailable = Get-Command gh -ErrorAction SilentlyContinue
        if ($ghAvailable) {
            $draftFlag = if ($Draft) { '--draft' } else { '' }
            $title = "feat: $featureName [$branchName]"
            # فقط نعرض الأمر — لا ننفذه تلقائياً
            if (-not $Json) {
                Write-Host ""
                Write-Host "📋 To create the PR, run:"
                Write-Host "   gh pr create --title `"$title`" --body-file `"$prFile`" --base $BaseBranch $draftFlag"
            }
        }
    } catch { }
}

if ($Json) {
    [PSCustomObject]@{
        branch      = $branchName
        title       = "feat: $featureName [$branchName]"
        bodyFile    = $prFile
        healthScore = $healthScore
        healthStatus = $healthStatus
        progress    = $progress.Percent
    } | ConvertTo-Json -Depth 3
} else {
    Write-Host "✅ PR template generated: $prFile"
}
