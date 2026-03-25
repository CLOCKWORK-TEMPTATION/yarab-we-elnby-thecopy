function Get-AllFeatureDirs {
    # يرجع كل مجلدات الـ features في مساحة العمل الحالية
    param([string]$RepoRoot = (Get-RepoRoot))
    $featureRoot = Get-FeatureWorkspaceRoot -RepoRoot $RepoRoot
    if (-not (Test-Path $featureRoot)) { return @() }
    Get-ChildItem -Path $featureRoot -Directory | Where-Object { $_.Name -match '^\d{3}-' } | Sort-Object Name
}

function Get-AllAminooofDirs {
    param([string]$RepoRoot = (Get-RepoRoot))
    Get-AllFeatureDirs -RepoRoot $RepoRoot
}

function Get-FeatureStatus {
    # يحدد مرحلة feature معين
    param(
        [Parameter(Mandatory=$true)][string]$FeatureDir
    )
    $phases = [ordered]@{
        'systematize' = 'sys.md'
        'clarify'     = 'sys.md'
        'constitution'= $null
        'research'    = 'research.md'
        'plan'        = 'plan.md'
        'tasks'       = 'tasks.md'
        'checklist'   = 'checklists'
        'implement'   = $null
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
    param([Parameter(Mandatory=$true)][string]$FilePath)
    if (-not (Test-Path $FilePath)) { return $null }
    $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
    return $hash.Hash
}

function Get-TrackedIDs {
    param([Parameter(Mandatory=$true)][string]$FilePath)
    if (-not (Test-Path $FilePath)) { return @() }
    $content = Get-Content -Path $FilePath -Raw
    $pattern = '(?<id>(?:FR|NFR|BR|AC|RK|ASM|TC|INT|ADR|OBJ|KPI|RQ|BE-T|FE-T|DO-T|CC-T|CHK)-\d{3})'
    $matches_ = [regex]::Matches($content, $pattern)
    return ($matches_ | ForEach-Object { $_.Groups['id'].Value } | Sort-Object -Unique)
}

function Compare-TrackedIDs {
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
    param([Parameter(Mandatory=$true)][string]$FeatureDir)
    $totalPhases = 8
    $completed = 0
    if (Test-Path (Join-Path $FeatureDir 'sys.md'))      { $completed++ }
    if ((Get-ClarificationStatus -FeatureDir $FeatureDir).status -eq 'complete') { $completed++ }
    $repoRoot = Resolve-Path (Join-Path $FeatureDir '../..')
    if ((Get-ConstitutionStatus -RepoRoot $repoRoot).status -eq 'complete') { $completed++ }
    if ((Get-DocumentCompletionStatus -FilePath (Join-Path $FeatureDir 'research.md')).status -eq 'complete') { $completed++ }
    if ((Get-DocumentCompletionStatus -FilePath (Join-Path $FeatureDir 'plan.md')).status -eq 'complete') { $completed++ }
    if ((Get-DocumentCompletionStatus -FilePath (Join-Path $FeatureDir 'tasks.md')).status -ne 'not_started') { $completed++ }
    $checkDir = Join-Path $FeatureDir 'checklists'
    if ((Test-Path $checkDir) -and (Get-ChildItem $checkDir -File -ErrorAction SilentlyContinue | Select-Object -First 1)) { $completed++ }
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
    param(
        [Parameter(Mandatory=$true)][int]$Score,
        [int]$MaxScore = 100,
        [int]$Threshold = 70
    )
    $status = if ($Score -ge $Threshold) { "ADVISORY_PASS ✅" } else { "ADVISORY_FAIL ❌" }
    Write-Host "🏥 Advisory Health Score: $Score/$MaxScore (heuristic)"
    Write-Host "Advisory Status: $status (threshold: $Threshold)"
    Write-Host "Note: This is a heuristic quick-check. For authoritative verification use: npm run verify"
}

function Test-IDSequence {
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

function Export-ChangelogEntry {
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
    param([Parameter(Mandatory=$true)][string]$FeatureDir)
    $sysFile = Join-Path $FeatureDir 'sys.md'
    if (-not (Test-Path $sysFile)) { return $null }
    $content = Get-Content $sysFile -Raw
    if ($content -match '\*\*Owner\*\*\s*\|\s*([^\|]+)') {
        return $matches[1].Trim()
    }
    return $null
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
