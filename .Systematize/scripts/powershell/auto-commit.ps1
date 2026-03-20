#!/usr/bin/env pwsh
# Auto-commit بعد تعديل وثيقة
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
    Write-Host "Usage: auto-commit.ps1 [-Command <name>] [-Branch <name>] [-Message <msg>] [-Json] [-Help]"
    exit 0
}

. "$PSScriptRoot/common.ps1"

$env_ = Get-FeaturePathsEnv
if (-not $env_.HAS_GIT) {
    if ($Json) { [PSCustomObject]@{ committed = $false; reason = 'No git repository' } | ConvertTo-Json }
    else { Write-Warning "⚠️ No git repository — skipping auto-commit" }
    exit 0
}

$repoRoot = $env_.REPO_ROOT
$branchName = if ($Branch) { $Branch } else { $env_.CURRENT_BRANCH }

# بناء رسالة الـ commit
if (-not $Message) {
    $cmdName = if ($Command) { $Command } else { 'update' }
    $description = switch -Wildcard ($cmdName) {
        'systematize' { "add PRD" }
        'clarify'     { "resolve ambiguities" }
        'constitution' { "update constitution" }
        'research'    { "add research findings" }
        'plan'        { "add implementation plan" }
        'tasks'       { "break plan into tasks" }
        'implement'   { "update implementation progress" }
        'healthcheck' { "run health check" }
        'export'      { "export documentation" }
        'sync'        { "sync artifact state" }
        'review'      { "add review report" }
        default       { "update documentation" }
    }
    $Message = "docs(aminooof): $cmdName — $description [$branchName]"
}

# Stage و commit
Set-Location $repoRoot
$featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $branchName

try {
    git add "$featureDir" 2>$null
    git add ".Systematize/memory/" 2>$null

    # فحص وجود تغييرات
    $status = git diff --cached --name-only 2>$null
    if (-not $status) {
        if ($Json) { [PSCustomObject]@{ committed = $false; reason = 'No changes to commit' } | ConvertTo-Json }
        else { Write-Host "ℹ️ No changes to commit" }
        exit 0
    }

    git commit -m $Message 2>$null | Out-Null

    if ($Json) {
        [PSCustomObject]@{
            committed = $true
            message   = $Message
            branch    = $branchName
            files     = @($status -split "`n")
        } | ConvertTo-Json -Depth 3
    } else {
        Write-Host "✅ Committed: $Message"
        Write-Host "   Files: $($status.Count) changed"
    }
} catch {
    Write-Error "❌ Commit failed: $_"
    exit 1
}
