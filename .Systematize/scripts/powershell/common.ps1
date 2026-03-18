#!/usr/bin/env pwsh
# Common PowerShell functions analogous to common.sh

function Get-RepoRoot {
    try {
        $result = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $result
        }
    } catch {
        # Git command failed
    }
    
    # Fall back to script location for non-git repos
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
    $specsDir = Join-Path $repoRoot "specs"
    
    if (Test-Path $specsDir) {
        $latestFeature = ""
        $highest = 0
        
        Get-ChildItem -Path $specsDir -Directory | ForEach-Object {
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
    param([string]$RepoRoot, [string]$Branch)
    Join-Path $RepoRoot "specs/$Branch"
}

function Get-FeaturePathsEnv {
    $repoRoot = Get-RepoRoot
    $currentBranch = Get-CurrentBranch
    $hasGit = Test-HasGit
    $featureDir = Get-FeatureDir -RepoRoot $repoRoot -Branch $currentBranch
    
    [PSCustomObject]@{
        REPO_ROOT     = $repoRoot
        CURRENT_BRANCH = $currentBranch
        HAS_GIT       = $hasGit
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

# ============================================================
# v2 Expansion — Additional Helper Functions
# ============================================================

function Get-AllFeatureDirs {
    # يرجع كل مجلدات الـ features في specs/
    param([string]$RepoRoot = (Get-RepoRoot))
    $specsDir = Join-Path $RepoRoot "specs"
    if (-not (Test-Path $specsDir)) { return @() }
    Get-ChildItem -Path $specsDir -Directory | Where-Object { $_.Name -match '^\d{3}-' } | Sort-Object Name
}

function Get-FeatureStatus {
    # يحدد مرحلة feature معين
    param(
        [Parameter(Mandatory=$true)][string]$FeatureDir
    )
    $phases = [ordered]@{
        'systematize' = 'sys.md'
        'clarify'     = 'sys.md'  # clarify يعدل sys.md
        'constitution'= $null     # ملف عام
        'research'    = 'research.md'
        'plan'        = 'plan.md'
        'tasks'       = 'tasks.md'
        'checklist'   = 'checklists'
        'implement'   = $null     # لا ملف خاص
    }
    $status = [ordered]@{}
    foreach ($phase in $phases.Keys) {
        $artifact = $phases[$phase]
        if ($null -eq $artifact) {
            $status[$phase] = 'n/a'
        } elseif ($artifact -eq 'checklists') {
            $checkDir = Join-Path $FeatureDir 'checklists'
            $status[$phase] = if (Test-Path $checkDir) { 'exists' } else { 'not_started' }
        } else {
            $filePath = Join-Path $FeatureDir $artifact
            $status[$phase] = if (Test-Path $filePath) { 'exists' } else { 'not_started' }
        }
    }
    return $status
}

function Get-ArtifactHash {
    # يحسب hash لوثيقة معينة (SHA256)
    param([Parameter(Mandatory=$true)][string]$FilePath)
    if (-not (Test-Path $FilePath)) { return $null }
    $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
    return $hash.Hash
}

function Get-TrackedIDs {
    # يستخرج كل IDs من وثيقة (FR-XXX, AC-XXX, RK-XXX...)
    param([Parameter(Mandatory=$true)][string]$FilePath)
    if (-not (Test-Path $FilePath)) { return @() }
    $content = Get-Content -Path $FilePath -Raw
    $pattern = '(?<id>(?:FR|NFR|BR|AC|RK|ASM|TC|INT|ADR|OBJ|KPI|RQ|BE-T|FE-T|DO-T|CC-T|CHK)-\d{3})'
    $matches_ = [regex]::Matches($content, $pattern)
    return ($matches_ | ForEach-Object { $_.Groups['id'].Value } | Sort-Object -Unique)
}

function Compare-TrackedIDs {
    # يقارن IDs بين وثيقتين ويرجع الفروقات
    param(
        [Parameter(Mandatory=$true)][string[]]$OldIDs,
        [Parameter(Mandatory=$true)][string[]]$NewIDs
    )
    $added   = $NewIDs | Where-Object { $_ -notin $OldIDs }
    $removed = $OldIDs | Where-Object { $_ -notin $NewIDs }
    $kept    = $NewIDs | Where-Object { $_ -in $OldIDs }
    return [PSCustomObject]@{
        Added   = @($added)
        Removed = @($removed)
        Kept    = @($kept)
    }
}

function Get-FeatureProgress {
    # يحسب نسبة اكتمال feature بناءً على الملفات الموجودة
    param([Parameter(Mandatory=$true)][string]$FeatureDir)
    $totalPhases = 6  # sys, research, plan, tasks, checklists, implement
    $completed = 0
    if (Test-Path (Join-Path $FeatureDir 'sys.md'))      { $completed++ }
    if (Test-Path (Join-Path $FeatureDir 'research.md'))  { $completed++ }
    if (Test-Path (Join-Path $FeatureDir 'plan.md'))      { $completed++ }
    if (Test-Path (Join-Path $FeatureDir 'tasks.md'))     { $completed++ }
    $checkDir = Join-Path $FeatureDir 'checklists'
    if ((Test-Path $checkDir) -and (Get-ChildItem $checkDir -File -ErrorAction SilentlyContinue | Select-Object -First 1)) { $completed++ }
    # Implementation check — if tasks.md has [X] marks
    $tasksFile = Join-Path $FeatureDir 'tasks.md'
    if (Test-Path $tasksFile) {
        $tc = Get-Content $tasksFile -Raw
        if ($tc -match '\[X\]|\[x\]') { $completed++ }
    }
    return [PSCustomObject]@{
        Completed = $completed
        Total     = $totalPhases
        Percent   = [math]::Round(($completed / $totalPhases) * 100)
    }
}

function Write-HealthScore {
    # يطبع درجة صحة بتنسيق موحد
    param(
        [Parameter(Mandatory=$true)][int]$Score,
        [int]$MaxScore = 100,
        [int]$Threshold = 70
    )
    $status = if ($Score -ge $Threshold) { "HEALTHY ✅" } else { "UNHEALTHY ❌" }
    Write-Host "🏥 Health Score: $Score/$MaxScore"
    Write-Host "Status: $status (threshold: $Threshold)"
}

function Test-IDSequence {
    # يتحقق من تسلسل IDs (مفيش فجوات)
    param(
        [Parameter(Mandatory=$true)][string]$Prefix,
        [Parameter(Mandatory=$true)][string[]]$IDs
    )
    $nums = $IDs | Where-Object { $_ -match "^${Prefix}(\d{3})$" } |
        ForEach-Object { [int]($_ -replace "^${Prefix}", '') } | Sort-Object
    if ($nums.Count -eq 0) { return [PSCustomObject]@{ Valid = $true; Gaps = @() } }
    $gaps = @()
    for ($i = 1; $i -lt $nums.Count; $i++) {
        if ($nums[$i] -ne $nums[$i-1] + 1) {
            for ($g = $nums[$i-1] + 1; $g -lt $nums[$i]; $g++) {
                $gaps += "${Prefix}$('{0:000}' -f $g)"
            }
        }
    }
    return [PSCustomObject]@{ Valid = ($gaps.Count -eq 0); Gaps = $gaps }
}

function Get-SyskitConfig {
    # يقرأ ملف التكوين العام syskit-config.yml
    param([string]$RepoRoot = (Get-RepoRoot))
    $configPath = Join-Path $RepoRoot '.Systematize/config/syskit-config.yml'
    if (-not (Test-Path $configPath)) { return $null }
    # بسيط YAML parser — يقرأ key: value pairs
    $config = @{}
    Get-Content $configPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line -match '^([^:]+):\s*(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            if ($val -eq 'true')  { $val = $true }
            elseif ($val -eq 'false') { $val = $false }
            elseif ($val -eq 'null')  { $val = $null }
            elseif ($val -match '^\d+$') { $val = [int]$val }
            $config[$key] = $val
        }
    }
    return $config
}

function Export-ChangelogEntry {
    # يضيف entry في Changelog section في ملف
    param(
        [Parameter(Mandatory=$true)][string]$FilePath,
        [Parameter(Mandatory=$true)][string]$Change,
        [string]$Author = 'system',
        [string]$Version = '—'
    )
    if (-not (Test-Path $FilePath)) { return }
    $date = (Get-Date).ToString('yyyy-MM-dd')
    $entry = "| $date | $Version | $Change | $Author |"
    $content = Get-Content $FilePath -Raw
    if ($content -match '(?m)^## Changelog') {
        # أضف بعد آخر سطر | في جدول Changelog
        $lines = $content -split "`n"
        $insertIdx = -1
        $inChangelog = $false
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match '^\s*## Changelog') { $inChangelog = $true; continue }
            if ($inChangelog -and $lines[$i] -match '^\|') { $insertIdx = $i }
            if ($inChangelog -and $lines[$i] -match '^\s*$' -and $insertIdx -gt 0) { break }
            if ($inChangelog -and $lines[$i] -match '^## ' -and $lines[$i] -notmatch '## Changelog') { break }
        }
        if ($insertIdx -gt 0) {
            $newLines = @($lines[0..$insertIdx]) + @($entry) + @($lines[($insertIdx+1)..($lines.Count-1)])
            $newLines -join "`n" | Set-Content $FilePath -NoNewline
        }
    }
}

function Get-FeatureOwner {
    # يرجع owner الـ feature من sys.md
    param([Parameter(Mandatory=$true)][string]$FeatureDir)
    $sysFile = Join-Path $FeatureDir 'sys.md'
    if (-not (Test-Path $sysFile)) { return $null }
    $content = Get-Content $sysFile -Raw
    if ($content -match '\*\*Owner\*\*\s*\|\s*([^\|]+)') {
        return $matches[1].Trim()
    }
    return $null
}

function Ensure-Dir {
    param([Parameter(Mandatory=$true)][string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Find-UnresolvedPlaceholders {
    param([Parameter(Mandatory=$true)][string]$Content)
    return ([regex]::Matches($Content, '\[[A-Z_]{3,}(?::[^\]]+)?\]') | ForEach-Object { $_.Value } | Sort-Object -Unique)
}

function Get-FeatureLastActivity {
    param([Parameter(Mandatory=$true)][string]$FeatureDir)
    if (-not (Test-Path $FeatureDir)) { return $null }

    $latest = $null
    Get-ChildItem -Path $FeatureDir -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        if (-not $latest -or $_.LastWriteTime -gt $latest) {
            $latest = $_.LastWriteTime
        }
    }

    return $latest
}

function Get-AlertsConfig {
    param([string]$RepoRoot = (Get-RepoRoot))

    $defaults = @{
        schema_version = 1
        alerts = @{
            stale_assumption = @{
                enabled = $true
                description = 'Assumption open without validation'
                trigger = "ASM status = 'Pending' AND age > 7 days"
                severity = 'warning'
                action = 'warn'
                pending_status = 'Pending'
                max_age_days = 7
            }
            risk_escalation = @{
                enabled = $true
                description = 'Risk probability increased'
                trigger = "RK probability changed to 'High' or 'Critical'"
                severity = 'critical'
                action = 'block'
                levels = 'High,Critical'
            }
            scope_creep = @{
                enabled = $true
                description = 'Requirements count grew significantly'
                trigger = 'FR count > baseline * 1.2'
                severity = 'warning'
                action = 'review'
                growth_factor = 1.2
            }
            orphan_requirement = @{
                enabled = $true
                description = 'Requirement without implementation task'
                trigger = 'FR exists without matching task'
                severity = 'high'
                action = 'warn'
            }
            stale_feature = @{
                enabled = $true
                description = 'Feature with no activity'
                trigger = 'last_modified > 14 days'
                severity = 'info'
                action = 'remind'
                max_age_days = 14
            }
        }
    }

    $configPath = Join-Path $RepoRoot '.Systematize/config/alerts.yml'
    if (-not (Test-Path $configPath)) { return $defaults }

    $config = @{
        schema_version = 1
        alerts = @{}
    }

    $currentAlert = $null
    foreach ($line in (Get-Content $configPath)) {
        if (-not $line.Trim() -or $line.Trim().StartsWith('#')) { continue }

        if ($line -match '^schema_version:\s*(.+)$') {
            $config.schema_version = [int]$matches[1]
            continue
        }

        if ($line -match '^  ([a-z_]+):\s*$') {
            $currentAlert = $matches[1]
            $config.alerts[$currentAlert] = @{}
            continue
        }

        if ($currentAlert -and $line -match '^    ([a-z_]+):\s*(.+)$') {
            $key = $matches[1]
            $value = $matches[2].Split('#')[0].Trim().Trim('"').Trim("'")
            switch -Regex ($value) {
                '^true$' { $config.alerts[$currentAlert][$key] = $true; continue }
                '^false$' { $config.alerts[$currentAlert][$key] = $false; continue }
                '^-?\d+(\.\d+)?$' { $config.alerts[$currentAlert][$key] = [double]$value; continue }
                default { $config.alerts[$currentAlert][$key] = $value }
            }
        }
    }

    foreach ($alertName in $defaults.alerts.Keys) {
        if (-not $config.alerts.ContainsKey($alertName)) {
            $config.alerts[$alertName] = @{}
        }

        foreach ($propertyName in $defaults.alerts[$alertName].Keys) {
            if (-not $config.alerts[$alertName].ContainsKey($propertyName)) {
                $config.alerts[$alertName][$propertyName] = $defaults.alerts[$alertName][$propertyName]
            }
        }
    }

    return $config
}

function Get-FeatureHealthReport {
    param(
        [Parameter(Mandatory=$true)][string]$FeatureDir,
        [int]$Threshold = 70
    )

    $sysFile = Join-Path $FeatureDir 'sys.md'
    $planFile = Join-Path $FeatureDir 'plan.md'
    $tasksFile = Join-Path $FeatureDir 'tasks.md'

    $sysContent = if (Test-Path $sysFile) { Get-Content $sysFile -Raw } else { '' }
    $planContent = if (Test-Path $planFile) { Get-Content $planFile -Raw } else { '' }
    $tasksContent = if (Test-Path $tasksFile) { Get-Content $tasksFile -Raw } else { '' }
    $allContent = "$sysContent`n$planContent`n$tasksContent"

    $checks = @()
    $totalScore = 0

    function Add-HealthCheck {
        param([string]$Name, [int]$Score, [string[]]$Issues)
        $safeScore = [math]::Min(10, [math]::Max(0, $Score))
        $script:checks += [PSCustomObject]@{
            Name = $Name
            Score = $safeScore
            MaxScore = 10
            Issues = $Issues
        }
        $script:totalScore += $safeScore
    }

    $frIDs = [regex]::Matches($sysContent, 'FR-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    $acLinkedFRs = [regex]::Matches($allContent, '(?<=\|\s*)FR-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    $frWithoutAC = $frIDs | Where-Object { $_ -notin $acLinkedFRs }
    Add-HealthCheck -Name 'FR→AC linkage' -Score ($(if ($frIDs.Count -eq 0) { 10 } else { 10 - ($frWithoutAC.Count * 2) })) -Issues @($frWithoutAC | ForEach-Object { "$_ missing AC link" })

    $placeholders = [regex]::Matches($allContent, '\[NEEDS CLARIFICATION[^\]]*\]|\[TBD[^\]]*\]') | ForEach-Object { $_.Value } | Sort-Object -Unique
    Add-HealthCheck -Name 'No placeholders' -Score (10 - ($placeholders.Count * 3)) -Issues @($placeholders | ForEach-Object { "Placeholder: $_" })

    $frInPlan = [regex]::Matches($planContent, 'FR-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    $frInTasks = [regex]::Matches($tasksContent, 'FR-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    $traceIssues = @()
    if ($planContent) { $frIDs | Where-Object { $_ -notin $frInPlan } | ForEach-Object { $traceIssues += "$_ not in plan.md" } }
    if ($tasksContent) { $frIDs | Where-Object { $_ -notin $frInTasks } | ForEach-Object { $traceIssues += "$_ not in tasks.md" } }
    Add-HealthCheck -Name 'Traceability' -Score ($(if ($frIDs.Count -eq 0) { 10 } else { 10 - $traceIssues.Count })) -Issues $traceIssues

    $duplicateIssues = @()
    foreach ($content in @($sysContent, $planContent, $tasksContent)) {
        $ids = [regex]::Matches($content, '(?:FR|NFR|BR|AC|RK|ASM|TC|INT|ADR|OBJ|KPI)-\d{3}') | ForEach-Object { $_.Value }
        $counts = $ids | Group-Object | Where-Object { $_.Count -gt 3 }
        $counts | ForEach-Object { $duplicateIssues += "$($_.Name) appears $($_.Count) times" }
    }
    Add-HealthCheck -Name 'No duplicate IDs' -Score (10 - ($duplicateIssues.Count * 5)) -Issues $duplicateIssues

    $sequenceIssues = @()
    foreach ($prefix in @('FR-', 'NFR-', 'AC-', 'RK-')) {
        $ids = [regex]::Matches($allContent, "$([regex]::Escape($prefix))\d{3}") | ForEach-Object { $_.Value } | Sort-Object -Unique
        $numbers = $ids | ForEach-Object { [int]($_ -replace "^$([regex]::Escape($prefix))", '') } | Sort-Object
        for ($index = 1; $index -lt $numbers.Count; $index++) {
            if ($numbers[$index] -ne ($numbers[$index - 1] + 1)) {
                $sequenceIssues += "$prefix gap between $($numbers[$index - 1]) and $($numbers[$index])"
            }
        }
    }
    Add-HealthCheck -Name 'Sequential IDs' -Score (10 - ($sequenceIssues.Count * 2)) -Issues $sequenceIssues

    $nfrIDs = [regex]::Matches($sysContent, 'NFR-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    $nfrIssues = @()
    foreach ($nfr in $nfrIDs) {
        $line = ($sysContent -split "`n" | Where-Object { $_ -match $nfr } | Select-Object -First 1)
        if ($line -and $line -notmatch '\d+[%ms]|\d+\.\d+|≤|≥|<|>|\d+\s*(?:seconds?|ms|hours?|users?|req)') {
            $nfrIssues += "$nfr may lack measurable target"
        }
    }
    Add-HealthCheck -Name 'NFR measurability' -Score ($(if ($nfrIDs.Count -eq 0) { 10 } else { 10 - ($nfrIssues.Count * 2) })) -Issues $nfrIssues

    $riskIDs = [regex]::Matches($allContent, 'RK-\d{3}') | ForEach-Object { $_.Value } | Sort-Object -Unique
    $riskIssues = @()
    foreach ($riskId in $riskIDs) {
        $lines = $allContent -split "`n" | Where-Object { $_ -match $riskId }
        $mitigation = $lines | Where-Object { $_ -match 'خطة|mitigation|تخفيف|plan|strategy' -or ($_ -split '\|').Count -ge 5 }
        if (-not $mitigation) {
            $riskIssues += "$riskId may lack mitigation"
        }
    }
    Add-HealthCheck -Name 'Risk mitigation' -Score ($(if ($riskIDs.Count -eq 0) { 10 } else { 10 - ($riskIssues.Count * 3) })) -Issues $riskIssues

    $taskIssues = @()
    $taskSections = $tasksContent -split '(?=###\s+(?:BE|FE|DO|CC)-T-\d{3})'
    foreach ($section in $taskSections) {
        if ($section -match '((?:BE|FE|DO|CC)-T-\d{3})' -and $section -notmatch 'Acceptance Criteria') {
            $taskIssues += "$($matches[1]) missing acceptance criteria"
        }
    }
    Add-HealthCheck -Name 'Task AC coverage' -Score ($(if ($taskSections.Count -le 1) { 10 } else { 10 - ($taskIssues.Count * 2) })) -Issues $taskIssues

    $bannedWords = @('\bfast\b', '\beasy\b', '\bsecure\b', '\bflexible\b', '\brobust\b', '\bintuitive\b', '\bscalable\b')
    $bannedIssues = @()
    foreach ($word in $bannedWords) {
        $match = [regex]::Match($sysContent, $word, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
        if ($match.Success) {
            $bannedIssues += "`"$($match.Value)`" found in sys.md"
        }
    }
    Add-HealthCheck -Name 'No banned words' -Score (10 - ($bannedIssues.Count * 3)) -Issues $bannedIssues

    $changelogIssues = @()
    foreach ($item in @(@('sys.md', $sysContent), @('plan.md', $planContent), @('tasks.md', $tasksContent))) {
        if ($item[1] -and $item[1] -notmatch '## Changelog') {
            $changelogIssues += "$($item[0]) missing Changelog"
        }
    }
    Add-HealthCheck -Name 'Changelog present' -Score (10 - ($changelogIssues.Count * 3)) -Issues $changelogIssues

    return [PSCustomObject]@{
        score = $totalScore
        maxScore = 100
        threshold = $Threshold
        status = if ($totalScore -ge $Threshold) { 'HEALTHY' } else { 'UNHEALTHY' }
        checks = $checks
    }
}
