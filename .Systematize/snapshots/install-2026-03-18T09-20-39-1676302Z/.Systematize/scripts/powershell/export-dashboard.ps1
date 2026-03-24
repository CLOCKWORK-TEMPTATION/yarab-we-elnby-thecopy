#!/usr/bin/env pwsh
# توليد HTML dashboard من بيانات الوثائق
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$OutputPath,
    [switch]$OpenInBrowser,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: export-dashboard.ps1 [-Branch <name>] [-OutputPath <path>] [-OpenInBrowser] [-Json] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Branch <name>         اسم الـ feature (أو الحالي)"
    Write-Host "  -OutputPath <path>     مسار حفظ الملف (افتراضي: .Systematize/exports/)"
    Write-Host "  -OpenInBrowser         فتح في المتصفح بعد التوليد"
    Write-Host "  -Json                  إخراج JSON"
    Write-Host "  -Help                  عرض المساعدة"
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

# قراءة الملفات
$sysFile = Join-Path $featureDir 'sys.md'
$planFile = Join-Path $featureDir 'plan.md'
$tasksFile = Join-Path $featureDir 'tasks.md'

$sysContent = if (Test-Path $sysFile) { Get-Content $sysFile -Raw } else { '' }
$planContent = if (Test-Path $planFile) { Get-Content $planFile -Raw } else { '' }
$tasksContent = if (Test-Path $tasksFile) { Get-Content $tasksFile -Raw } else { '' }

# استخراج البيانات
$projectName = if ($sysContent -match '\*\*Feature Branch\*\*\s*\|\s*`([^`]+)`') { $matches[1] } else { $branchName }
$frCount = ([regex]::Matches($sysContent, 'FR-\d{3}')).Count
$nfrCount = ([regex]::Matches($sysContent, 'NFR-\d{3}')).Count
$acCount = ([regex]::Matches($sysContent, 'AC-\d{3}')).Count
$rkCount = ([regex]::Matches($sysContent, 'RK-\d{3}')).Count
$taskCount = ([regex]::Matches($tasksContent, '(?:BE|FE|DO|CC)-T-\d{3}')).Count
$completedTasks = ([regex]::Matches($tasksContent, '\[X\]|\[x\]')).Count

# حساب التقدم
$progress = Get-FeatureProgress -FeatureDir $featureDir

$healthResult = Get-FeatureHealthReport -FeatureDir $featureDir
$healthScore = if ($healthResult) { $healthResult.Score } else { '—' }
$healthStatus = if ($healthResult) { $healthResult.Status } else { 'UNKNOWN' }

# حساب نسب التقدم
$taskPercent = if ($taskCount -gt 0) { [math]::Round(($completedTasks / $taskCount) * 100) } else { 0 }

# توليد HTML
$html = @"
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard: $projectName</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;line-height:1.6}
.header{text-align:center;margin-bottom:32px}
.header h1{font-size:1.8rem;color:#f8fafc;margin-bottom:8px}
.header .badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:0.75rem;font-weight:600}
.badge-healthy{background:#065f46;color:#6ee7b7}
.badge-unhealthy{background:#7f1d1d;color:#fca5a5}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:24px}
.card{background:#1e293b;border-radius:12px;padding:20px;border:1px solid #334155}
.card h3{font-size:0.875rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px}
.card .value{font-size:2rem;font-weight:700;color:#f8fafc}
.card .sub{font-size:0.875rem;color:#64748b;margin-top:4px}
.progress-bar{width:100%;height:8px;background:#334155;border-radius:4px;overflow:hidden;margin-top:8px}
.progress-fill{height:100%;border-radius:4px;transition:width 0.3s}
.fill-green{background:#10b981}
.fill-yellow{background:#f59e0b}
.fill-red{background:#ef4444}
table{width:100%;border-collapse:collapse;margin-top:12px}
th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #334155;font-size:0.875rem}
th{color:#94a3b8;font-weight:600}
.footer{text-align:center;margin-top:32px;color:#475569;font-size:0.75rem}
</style>
</head>
<body>
<div class="header">
<h1>$projectName</h1>
<span class="badge $(if($healthStatus -eq 'HEALTHY'){'badge-healthy'}else{'badge-unhealthy'})">Health: $healthScore/100</span>
</div>
<div class="grid">
<div class="card"><h3>Requirements</h3><div class="value">$frCount FR</div><div class="sub">$nfrCount NFR | $acCount AC</div></div>
<div class="card"><h3>Risks</h3><div class="value">$rkCount</div><div class="sub">Open risks</div></div>
<div class="card"><h3>Tasks</h3><div class="value">$taskCount</div><div class="sub">$completedTasks completed</div>
<div class="progress-bar"><div class="progress-fill $(if($taskPercent -ge 70){'fill-green'}elseif($taskPercent -ge 30){'fill-yellow'}else{'fill-red'})" style="width:$taskPercent%"></div></div></div>
<div class="card"><h3>Progress</h3><div class="value">$($progress.Percent)%</div><div class="sub">$($progress.Completed)/$($progress.Total) phases</div>
<div class="progress-bar"><div class="progress-fill $(if($progress.Percent -ge 70){'fill-green'}elseif($progress.Percent -ge 30){'fill-yellow'}else{'fill-red'})" style="width:$($progress.Percent)%"></div></div></div>
</div>
<div class="footer">Generated by Systematize KIT v2 — $(Get-Date -Format 'yyyy-MM-dd HH:mm')</div>
</body>
</html>
"@

# حفظ الملف
$exportsDir = Join-Path $repoRoot '.Systematize/exports'
New-Item -ItemType Directory -Path $exportsDir -Force | Out-Null
if (-not $OutputPath) { $OutputPath = Join-Path $exportsDir "${branchName}-dashboard.html" }
$html | Set-Content $OutputPath -Encoding UTF8

if ($OpenInBrowser) {
    try { Start-Process $OutputPath } catch { Write-Warning "Could not open browser" }
}

if ($Json) {
    [PSCustomObject]@{
        branch     = $branchName
        outputPath = $OutputPath
        stats      = [PSCustomObject]@{
            frCount        = $frCount
            nfrCount       = $nfrCount
            acCount        = $acCount
            rkCount        = $rkCount
            taskCount      = $taskCount
            completedTasks = $completedTasks
            healthScore    = $healthScore
            healthStatus   = $healthStatus
            progress       = $progress.Percent
        }
    } | ConvertTo-Json -Depth 5
} else {
    Write-Host "✅ Dashboard exported: $OutputPath"
    Write-Host "   FR: $frCount | NFR: $nfrCount | AC: $acCount | RK: $rkCount"
    Write-Host "   Tasks: $completedTasks/$taskCount | Health: $healthScore/100 ($healthStatus)"
}
