#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [string]$Branch,
    [switch]$Force,
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    Write-Host "Usage: update-sync-state.ps1 [-Branch <name>] [-Force] [-Json] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Branch <name>   اسم الـ feature"
    Write-Host "  -Force           تحديث حتى لو لم تتغير الملفات"
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

$syncStatePath = Join-Path $repoRoot '.Systematize/memory/sync-state.json'
Ensure-Dir -Path (Split-Path -Parent $syncStatePath)

if (Test-Path $syncStatePath) {
    $rawState = Get-Content -LiteralPath $syncStatePath -Raw -Encoding utf8 | ConvertFrom-Json
    $features = @{}
    if ($rawState.features) {
        foreach ($entry in $rawState.features.PSObject.Properties) {
            $features[$entry.Name] = $entry.Value
        }
    }

    $extensions = @{}
    if ($rawState.extensions) {
        foreach ($entry in $rawState.extensions.PSObject.Properties) {
            $extensions[$entry.Name] = $entry.Value
        }
    }

    $syncState = @{
        schema_version = 1
        features = $features
        extensions = $extensions
        last_global_check = $rawState.last_global_check
    }
} else {
    $syncState = @{
        schema_version = 1
        features = @{}
        extensions = @{}
        last_global_check = $null
    }
}

$hashes = @{}
Get-ChildItem -Path $featureDir -Filter '*.md' -File -ErrorAction SilentlyContinue | ForEach-Object {
    $hashes[$_.Name] = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash
}

$sysFile = Join-Path $featureDir 'sys.md'
$frCount = 0
if (Test-Path $sysFile) {
    $frCount = ([regex]::Matches((Get-Content -LiteralPath $sysFile -Raw -Encoding utf8), 'FR-\d{3}')).Count
}

$syncState.features[$branchName] = @{
    last_sync = (Get-Date).ToString('o')
    hashes = $hashes
    baseline_fr_count = $frCount
}
$syncState.last_global_check = (Get-Date).ToString('o')

$syncState | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $syncStatePath -Encoding utf8

$result = @{
    branch = $branchName
    hashes = $hashes
    frCount = $frCount
    updated = $true
}

if ($Json) {
    $result | ConvertTo-Json -Depth 10
} else {
    Write-Host "✅ Sync state updated for $branchName"
    Write-Host "   Files tracked: $($hashes.Count)"
    Write-Host "   FR baseline: $frCount"
}
