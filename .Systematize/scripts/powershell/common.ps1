#!/usr/bin/env pwsh
# Common PowerShell functions analogous to common.sh

$script:FeatureWorkspaceName = 'features'
$script:LegacyFeatureWorkspaceNames = @(
    'aminooof',
    [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('c3BlY3M='))
)

function Move-FeatureWorkspace {
    param(
        [Parameter(Mandatory = $true)][string]$SourceDir,
        [Parameter(Mandatory = $true)][string]$TargetDir
    )

    Move-Item -LiteralPath $SourceDir -Destination $TargetDir -Force
}

function Get-FeatureWorkspaceRoot {
    param(
        [string]$RepoRoot = (Get-RepoRoot),
        [switch]$Mutating,
        [switch]$EnsureExists
    )

    $currentRoot = Join-Path $RepoRoot $script:FeatureWorkspaceName
    $currentExists = Test-Path -LiteralPath $currentRoot -PathType Container
    $legacyRoots = @(
        $script:LegacyFeatureWorkspaceNames |
            ForEach-Object { Join-Path $RepoRoot $_ } |
            Where-Object { Test-Path -LiteralPath $_ -PathType Container }
    )

    if (($currentExists -and $legacyRoots.Count -gt 0) -or $legacyRoots.Count -gt 1) {
        $conflictingRoots = @($currentRoot) + $legacyRoots | Select-Object -Unique
        throw "Conflicting workflow roots detected. Resolve manually before continuing:`n- $($conflictingRoots -join "`n- ")"
    }

    if ($legacyRoots.Count -eq 1 -and -not $currentExists) {
        $legacyRoot = $legacyRoots[0]
        if ($Mutating) {
            Move-FeatureWorkspace -SourceDir $legacyRoot -TargetDir $currentRoot
            return $currentRoot
        }

        return $legacyRoot
    }

    if (-not $currentExists -and $EnsureExists) {
        Ensure-Dir -Path $currentRoot
    }

    return $currentRoot
}

function Get-ConstitutionFilePath {
    param([string]$RepoRoot = (Get-RepoRoot))
    return (Join-Path $RepoRoot '.Systematize/memory/constitution.md')
}

function Get-DocumentCompletionStatus {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [string[]]$RequiredMarkers = @()
    )

    if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) {
        return [PSCustomObject]@{
            status = 'not_started'
            file_exists = $false
            placeholders = 0
            missing_markers = @()
        }
    }

    $content = Get-Content -LiteralPath $FilePath -Raw -Encoding utf8
    $placeholders = @(Find-UnresolvedPlaceholders -Content $content)
    $missingMarkers = @($RequiredMarkers | Where-Object { $content -notmatch [regex]::Escape($_) })
    $isBlank = [string]::IsNullOrWhiteSpace($content)

    if ($isBlank) {
        return [PSCustomObject]@{
            status = 'not_started'
            file_exists = $true
            placeholders = $placeholders.Count
            missing_markers = $missingMarkers
        }
    }

    return [PSCustomObject]@{
        status = if ($placeholders.Count -eq 0 -and $missingMarkers.Count -eq 0) { 'complete' } else { 'partial' }
        file_exists = $true
        placeholders = $placeholders.Count
        missing_markers = $missingMarkers
    }
}

function Get-ClarificationStatus {
    param([Parameter(Mandatory = $true)][string]$FeatureDir)

    $sysFile = Join-Path $FeatureDir 'sys.md'
    if (-not (Test-Path -LiteralPath $sysFile -PathType Leaf)) {
        return [PSCustomObject]@{
            status = 'not_started'
            file_exists = $false
            questions_resolved = 0
            assumptions_documented = 0
        }
    }

    $sysContent = Get-Content -LiteralPath $sysFile -Raw -Encoding utf8
    $startIndex = $sysContent.IndexOf('## Clarification Contract')
    if ($startIndex -lt 0) {
        return [PSCustomObject]@{
            status = 'not_started'
            file_exists = $true
            questions_resolved = 0
            assumptions_documented = 0
        }
    }

    $section = $sysContent.Substring($startIndex)
    $nextSectionMatch = [regex]::Match($section, "\n---\s*\n\s*## Level 3:|\n## Level 3:")
    if ($nextSectionMatch.Success) {
        $section = $section.Substring(0, $nextSectionMatch.Index)
    }

    $placeholders = @(Find-UnresolvedPlaceholders -Content $section)
    $questionsResolved = @(
        $section -split "`r?`n" |
            Where-Object { $_.Trim().StartsWith('- Q:') -and $_ -notmatch '\[question\]|\[answer\]|\[section/decision affected\]' }
    ).Count
    $assumptionsDocumented = @(
        $section -split "`r?`n" |
            Where-Object { $_ -match '\*\*ASM-\d{3}\*\*' -and $_ -notmatch '\[Assumption\]|\[why assumed\]|\[impact\]' }
    ).Count
    $checklistNeedsSelection = $section.Contains('☐ Yes / ☐ No')
    $checklistHasNo = $section -match '\|\s*\d+\s*\|[^|]+\|\s*☐ No\s*\|'
    $hasWork = ($questionsResolved -gt 0) -or ($assumptionsDocumented -gt 0)

    return [PSCustomObject]@{
        status = if ($hasWork -and $placeholders.Count -eq 0 -and -not $checklistNeedsSelection -and -not $checklistHasNo) { 'complete' } else { 'partial' }
        file_exists = $true
        questions_resolved = $questionsResolved
        assumptions_documented = $assumptionsDocumented
    }
}

function Get-ConstitutionStatus {
    param([string]$RepoRoot = (Get-RepoRoot))

    return Get-DocumentCompletionStatus -FilePath (Get-ConstitutionFilePath -RepoRoot $RepoRoot) -RequiredMarkers @('## ٢٧. تقييم الاكتمال')
}

function Get-RepoRoot {
    try {
        $result = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result
        }
    } catch {
        # Git command failed
    }

    # Fallback 1: search upward from the current working directory
    $current = (Get-Location).Path
    while ($true) {
        if ((Test-Path (Join-Path $current '.Systematize')) -or (Test-Path (Join-Path $current '.git'))) {
            return $current
        }

        $parent = Split-Path $current -Parent
        if ($parent -eq $current) {
            break
        }
        $current = $parent
    }

    # Fallback 2: script location for non-git repos
    return (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
}

function Get-CurrentBranch {
    # First check if SYSTEMATIZE_FEATURE environment variable is set
    if ($env:SYSTEMATIZE_FEATURE) {
        return $env:SYSTEMATIZE_FEATURE
    }
    
    # Then check git if available
    try {
        $result = git rev-parse --abbrev-ref HEAD 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result
        }
    } catch {
        # Git command failed
    }
    
    # For non-git repos, try to find the latest feature directory
    $repoRoot = Get-RepoRoot
    $featureRoot = $null
    try {
        $featureRoot = Get-FeatureWorkspaceRoot -RepoRoot $repoRoot
    } catch {
        $featureRoot = $null
    }
    
    if ($featureRoot -and (Test-Path $featureRoot)) {
        $latestFeature = ""
        $highest = 0
        
        Get-ChildItem -Path $featureRoot -Directory | ForEach-Object {
            if ($_.Name -match '^(\d{3})-') {
                $num = [int]$matches[1]
                if ($num -gt $highest) {
                    $highest = $num
                    $latestFeature = $_.Name
                }
            }
        }
        
        if ($latestFeature) {
            return $latestFeature
        }
    }
    
    # Final fallback
    return "main"
}

function Test-HasGit {
    try {
        git rev-parse --show-toplevel 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    }
}

function Get-NodeCliPath {
    return [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../node/cli.mjs'))
}

function Invoke-NodeSyskitCommand {
    param(
        [Parameter(Mandatory=$true)][string]$CommandName,
        [string[]]$NodeArgs = @()
    )

    $cliPath = Get-NodeCliPath
    if (-not (Test-Path -LiteralPath $cliPath -PathType Leaf)) {
        throw "Node CLI not found: $cliPath"
    }

    & node $cliPath $CommandName @NodeArgs
    $exitCode = $LASTEXITCODE
    if ($null -ne $exitCode -and $exitCode -ne 0) {
        exit $exitCode
    }
}

function Test-FeatureBranch {
    param(
        [string]$Branch,
        [bool]$HasGit = $true
    )
    
    # For non-git repos, we can't enforce branch naming but still provide output
    if (-not $HasGit) {
        Write-Warning "[syskit] Warning: Git repository not detected; skipped branch validation"
        return $true
    }
    
    if ($Branch -notmatch '^[0-9]{3}-') {
        Write-Output "ERROR: Not on a feature branch. Current branch: $Branch"
        Write-Output "Feature branches should be named like: 001-feature-name"
        return $false
    }
    return $true
}

function Get-FeatureDir {
    param(
        [string]$RepoRoot,
        [string]$Branch,
        [switch]$Mutating,
        [switch]$EnsureExists
    )

    $featureRoot = Get-FeatureWorkspaceRoot -RepoRoot $RepoRoot -Mutating:$Mutating -EnsureExists:$EnsureExists
    Join-Path $featureRoot $Branch
}

function Get-FeaturePathsEnv {
    param(
        [switch]$Mutating,
        [switch]$EnsureExists
    )

    $repoRoot = Get-RepoRoot
    $currentBranch = Get-CurrentBranch
    $hasGit = Test-HasGit
    $featureRoot = Get-FeatureWorkspaceRoot -RepoRoot $repoRoot -Mutating:$Mutating -EnsureExists:$EnsureExists
    $featureDir = Join-Path $featureRoot $currentBranch
    
    [PSCustomObject]@{
        REPO_ROOT     = $repoRoot
        CURRENT_BRANCH = $currentBranch
        HAS_GIT       = $hasGit
        FEATURE_ROOT  = $featureRoot
        FEATURES_DIR  = $featureDir
        FEATURE_DIR   = $featureDir
        FEATURE_SYS   = Join-Path $featureDir 'sys.md'
        IMPL_PLAN     = Join-Path $featureDir 'plan.md'
        TASKS         = Join-Path $featureDir 'tasks.md'
        RESEARCH      = Join-Path $featureDir 'research.md'
        AGENTS_MD     = Join-Path $featureDir 'AGENTS.md'
        QUICKSTART    = Join-Path $featureDir 'quickstart.md'
        CONTRACTS_DIR = Join-Path $featureDir 'contracts'
    }
}

function Test-FileExists {
    param([string]$Path, [string]$Description)
    if (Test-Path -Path $Path -PathType Leaf) {
        Write-Output "  ✓ $Description"
        return $true
    } else {
        Write-Output "  ✗ $Description"
        return $false
    }
}

function Test-DirHasFiles {
    param([string]$Path, [string]$Description)
    if ((Test-Path -Path $Path -PathType Container) -and (Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Select-Object -First 1)) {
        Write-Output "  ✓ $Description"
        return $true
    } else {
        Write-Output "  ✗ $Description"
        return $false
    }
}

# Resolve a template name to a file path using the priority stack:
#   1. .Systematize/templates/overrides/
#   2. .Systematize/presets/<preset-id>/templates/ (sorted by priority from .registry)
#   3. .Systematize/extensions/<ext-id>/templates/
#   4. .Systematize/templates/ (core)
function Resolve-Template {
    param(
        [Parameter(Mandatory=$true)][string]$TemplateName,
        [Parameter(Mandatory=$true)][string]$RepoRoot
    )

    $base = Join-Path $RepoRoot '.Systematize/templates'

    # Priority 1: Project overrides
    $override = Join-Path $base "overrides/$TemplateName.md"
    if (Test-Path $override) { return $override }

    # Priority 2: Installed presets (sorted by priority from .registry)
    $presetsDir = Join-Path $RepoRoot '.Systematize/presets'
    if (Test-Path $presetsDir) {
        $registryFile = Join-Path $presetsDir '.registry'
        $sortedPresets = @()
        if (Test-Path $registryFile) {
            try {
                $registryData = Get-Content $registryFile -Raw | ConvertFrom-Json
                $presets = $registryData.presets
                if ($presets) {
                    $sortedPresets = $presets.PSObject.Properties |
                        Sort-Object { if ($null -ne $_.Value.priority) { $_.Value.priority } else { 10 } } |
                        ForEach-Object { $_.Name }
                }
            } catch {
                # Fallback: alphabetical directory order
                $sortedPresets = @()
            }
        }

        if ($sortedPresets.Count -gt 0) {
            foreach ($presetId in $sortedPresets) {
                $candidate = Join-Path $presetsDir "$presetId/templates/$TemplateName.md"
                if (Test-Path $candidate) { return $candidate }
            }
        } else {
            # Fallback: alphabetical directory order
            foreach ($preset in Get-ChildItem -Path $presetsDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.*' }) {
                $candidate = Join-Path $preset.FullName "templates/$TemplateName.md"
                if (Test-Path $candidate) { return $candidate }
            }
        }
    }

    # Priority 3: Extension-provided templates
    $extDir = Join-Path $RepoRoot '.Systematize/extensions'
    if (Test-Path $extDir) {
        foreach ($ext in Get-ChildItem -Path $extDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.*' } | Sort-Object Name) {
            $candidate = Join-Path $ext.FullName "templates/$TemplateName.md"
            if (Test-Path $candidate) { return $candidate }
        }
    }

    # Priority 4: Core templates
    $core = Join-Path $base "$TemplateName.md"
    if (Test-Path $core) { return $core }

    return $null
}

. "$PSScriptRoot/common-support.ps1"
. "$PSScriptRoot/common-workflow.ps1"
. "$PSScriptRoot/common-health.ps1"
