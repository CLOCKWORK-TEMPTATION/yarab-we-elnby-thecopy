#!/usr/bin/env pwsh
# حفظ نسخة احتياطية من وثائق feature معين
[CmdletBinding()]
param(
    [string]$Branch,
    [string]$Tag,
    [switch]$Json,
    [switch]$Help
)
$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: snapshot-artifacts.ps1 [-Branch <name>] [-Tag <label>] [-Json] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Branch <name>   اسم الـ feature (أو الحالي)"
    Write-Host "  -Tag <label>     وسم اختياري (مثلاً pre-plan-update)"
    Write-Host "  -Json            إخراج JSON"
    Write-Host "  -Help            عرض المساعدة"
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

# إنشاء مجلد الـ snapshot
$timestamp = (Get-Date).ToString('yyyy-MM-dd_HHmmss')
$snapshotDir = Join-Path $repoRoot ".Systematize/snapshots/$branchName/$timestamp"
if ($Tag) { $snapshotDir = "${snapshotDir}_${Tag}" }
New-Item -ItemType Directory -Path $snapshotDir -Force | Out-Null

# نسخ كل ملفات .md
$files = Get-ChildItem -Path $featureDir -Filter '*.md' -File -ErrorAction SilentlyContinue
$manifest = @{}
foreach ($file in $files) {
    Copy-Item $file.FullName (Join-Path $snapshotDir $file.Name) -Force
    $hash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash
    $manifest[$file.Name] = $hash
}

# نسخ مجلدات فرعية (contracts, checklists)
foreach ($subDir in @('contracts', 'checklists')) {
    $subPath = Join-Path $featureDir $subDir
    if (Test-Path $subPath) {
        $destSub = Join-Path $snapshotDir $subDir
        Copy-Item -Path $subPath -Destination $destSub -Recurse -Force
    }
}

# حفظ manifest
$manifestObj = [PSCustomObject]@{
    branch    = $branchName
    timestamp = $timestamp
    tag       = $Tag
    files     = $manifest
}
$manifestObj | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $snapshotDir 'manifest.json')

# تحديث sync-state.json
$syncStatePath = Join-Path $repoRoot '.Systematize/memory/sync-state.json'
if (Test-Path $syncStatePath) {
    $syncState = Get-Content $syncStatePath -Raw | ConvertFrom-Json
    if (-not $syncState.features) {
        $syncState | Add-Member -NotePropertyName 'features' -NotePropertyValue @{} -Force
    }
    $featureState = [PSCustomObject]@{
        last_snapshot = $timestamp
        hashes        = $manifest
    }
    if ($syncState.features -is [hashtable]) {
        $syncState.features[$branchName] = $featureState
    } else {
        $syncState.features | Add-Member -NotePropertyName $branchName -NotePropertyValue $featureState -Force
    }
    $syncState | ConvertTo-Json -Depth 5 | Set-Content $syncStatePath
}

if ($Json) {
    $manifestObj | ConvertTo-Json -Depth 5
} else {
    Write-Host "✅ Snapshot created: $snapshotDir"
    Write-Host "   Branch: $branchName"
    Write-Host "   Files: $($files.Count)"
    if ($Tag) { Write-Host "   Tag: $Tag" }
}
