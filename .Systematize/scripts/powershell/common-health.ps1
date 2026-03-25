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

    $script:__syskitHealthChecks = [System.Collections.Generic.List[object]]::new()
    $script:__syskitHealthScore = 0

    function Add-HealthCheck {
        param([string]$Name, [int]$Score, [string[]]$Issues)
        $safeScore = [math]::Min(10, [math]::Max(0, $Score))
        $script:__syskitHealthChecks.Add([PSCustomObject]@{
            Name = $Name
            Score = $safeScore
            MaxScore = 10
            Issues = $Issues
        }) | Out-Null
        $script:__syskitHealthScore += $safeScore
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
        score = $script:__syskitHealthScore
        maxScore = 100
        threshold = $Threshold
        status = if ($script:__syskitHealthScore -ge $Threshold) { 'ADVISORY_PASS' } else { 'ADVISORY_FAIL' }
        scope = 'heuristic'
        checks = @($script:__syskitHealthChecks)
    }
}
