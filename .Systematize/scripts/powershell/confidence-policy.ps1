function Get-ConfidenceStatement {
    [CmdletBinding()]
    param(
        [object[]]$CheckResults = @(),
        [object[]]$Targets = @(),
        [string[]]$EnvironmentBlockers = @(),
        [string[]]$ManualConstraints = @()
    )

    $requiredChecks = @('lint', 'type-check', 'test', 'build')
    $allowedTargetStatuses = @('inspected', 'blocked', 'out_of_scope', 'not_present')
    $allowedCheckStatuses = @('executed', 'failed', 'blocked')

    $normalizedChecks = foreach ($record in $CheckResults) {
        $checkName = [string]$record.checkName
        $status = [string]$record.status

        if ([string]::IsNullOrWhiteSpace($checkName)) { throw 'checkName is required' }
        if ($status -notin $allowedCheckStatuses) { throw "Unsupported check status: $status" }

        [PSCustomObject]@{
            checkName = $checkName.Trim()
            scope = if ([string]::IsNullOrWhiteSpace([string]$record.scope)) { 'repo-root' } else { ([string]$record.scope).Trim() }
            status = $status.Trim()
            directCause = ([string]$record.directCause).Trim()
            confidenceImpact = if ([string]::IsNullOrWhiteSpace([string]$record.confidenceImpact)) { 'low' } else { ([string]$record.confidenceImpact).Trim().ToLowerInvariant() }
            outputRef = ([string]$record.outputRef).Trim()
        }
    }

    $normalizedTargets = foreach ($target in $Targets) {
        $coverageStatus = if ([string]::IsNullOrWhiteSpace([string]$target.coverageStatus)) { 'not_present' } else { ([string]$target.coverageStatus).Trim() }
        if ($coverageStatus -notin $allowedTargetStatuses) { throw "Unsupported coverageStatus: $coverageStatus" }

        [PSCustomObject]@{
            path = ([string]$target.path).Trim()
            relativePath = ([string]$target.relativePath).Trim()
            targetType = ([string]$target.targetType).Trim()
            coverageStatus = $coverageStatus
            blockedReason = ([string]$target.blockedReason).Trim()
            evidenceRef = ([string]$target.evidenceRef).Trim()
        }
    }

    $coverage = [ordered]@{
        totalTargets = $normalizedTargets.Count
        inspectedTargets = 0
        blockedTargets = 0
        notPresentTargets = 0
        outOfScopeTargets = 0
        partialTargets = 0
        uncoveredAreas = New-Object System.Collections.Generic.List[string]
    }

    foreach ($target in $normalizedTargets) {
        $targetLabel = if ($target.relativePath) { $target.relativePath } else { $target.path }
        $detail = @($target.blockedReason, $target.evidenceRef) -join ' | '
        $partial = $detail -match 'partial|subset|narrow|جزئي|limited'

        switch ($target.coverageStatus) {
            'inspected' {
                $coverage.inspectedTargets += 1
                if ($partial) {
                    $coverage.partialTargets += 1
                    $coverage.uncoveredAreas.Add("${targetLabel}: partial coverage") | Out-Null
                }
            }
            'blocked' {
                $coverage.blockedTargets += 1
                $coverage.uncoveredAreas.Add("${targetLabel}: $(if ($target.blockedReason) { $target.blockedReason } else { 'blocked' })") | Out-Null
            }
            'not_present' {
                $coverage.notPresentTargets += 1
                $coverage.uncoveredAreas.Add("${targetLabel}: $(if ($target.blockedReason) { $target.blockedReason } else { 'not present' })") | Out-Null
            }
            'out_of_scope' {
                $coverage.outOfScopeTargets += 1
            }
        }
    }

    $executedChecks = @($normalizedChecks | Where-Object { $_.status -eq 'executed' } | ForEach-Object { $_.checkName } | Select-Object -Unique)
    $blockedChecks = @($normalizedChecks | Where-Object { $_.status -eq 'blocked' } | ForEach-Object {
        "$($_.checkName): $(if ($_.directCause) { $_.directCause } else { 'blocked' })"
    } | Select-Object -Unique)
    $failedChecks = @($normalizedChecks | Where-Object { $_.status -eq 'failed' } | ForEach-Object {
        "$($_.checkName): $(if ($_.directCause) { $_.directCause } else { 'failed' })"
    } | Select-Object -Unique)
    $environmentIssues = @($EnvironmentBlockers | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.Trim() } | Select-Object -Unique)
    $manualIssues = @($ManualConstraints | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.Trim() } | Select-Object -Unique)

    if ($executedChecks.Count -eq 0) {
        $reviewMode = 'Static Analysis Only'
    } elseif ($executedChecks.Count -eq $requiredChecks.Count -and
              $blockedChecks.Count -eq 0 -and
              $failedChecks.Count -eq 0 -and
              $coverage.blockedTargets -eq 0 -and
              $coverage.notPresentTargets -eq 0 -and
              $coverage.partialTargets -eq 0 -and
              $environmentIssues.Count -eq 0) {
        $reviewMode = 'Full Execution Review'
    } else {
        $reviewMode = 'Partial Execution Review'
    }

    if ($reviewMode -eq 'Full Execution Review' -and
        $blockedChecks.Count -eq 0 -and
        $failedChecks.Count -eq 0 -and
        $coverage.blockedTargets -eq 0 -and
        $coverage.notPresentTargets -eq 0 -and
        $coverage.partialTargets -eq 0 -and
        $environmentIssues.Count -eq 0 -and
        $manualIssues.Count -eq 0) {
        $confidenceLevel = 'High'
    } elseif ($reviewMode -eq 'Static Analysis Only' -or
              $environmentIssues.Count -gt 0 -or
              $failedChecks.Count -gt 0 -or
              $coverage.blockedTargets -gt 0 -or
              $coverage.notPresentTargets -gt 0) {
        $confidenceLevel = 'Low'
    } else {
        $confidenceLevel = 'Medium'
    }

    $rationale = New-Object System.Collections.Generic.List[string]
    if ($reviewMode -eq 'Full Execution Review') {
        $rationale.Add('All required checks executed across the scoped targets.') | Out-Null
    } elseif ($reviewMode -eq 'Partial Execution Review') {
        $rationale.Add('Execution evidence is partial and must be interpreted with explicit coverage limits.') | Out-Null
    } else {
        $rationale.Add('The verdict is primarily based on static inspection because execution evidence is unavailable.') | Out-Null
    }

    if ($blockedChecks.Count -gt 0) { $rationale.Add("Blocked checks: $($blockedChecks -join ', ').") | Out-Null }
    if ($failedChecks.Count -gt 0) { $rationale.Add("Failed checks: $($failedChecks -join ', ').") | Out-Null }
    if ($environmentIssues.Count -gt 0) { $rationale.Add("Environment blockers: $($environmentIssues -join ', ').") | Out-Null }
    if ($coverage.partialTargets -gt 0 -or $coverage.notPresentTargets -gt 0 -or $coverage.blockedTargets -gt 0) {
        $rationale.Add("Coverage gaps: blocked=$($coverage.blockedTargets), not_present=$($coverage.notPresentTargets), partial=$($coverage.partialTargets).") | Out-Null
    }

    $uncoveredAreas = @(
        @($coverage.uncoveredAreas) +
        $environmentIssues +
        $manualIssues
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

    return [PSCustomObject]@{
        reviewMode = $reviewMode
        confidenceLevel = $confidenceLevel
        expectedChecks = @($requiredChecks)
        executedChecks = @($executedChecks)
        blockedChecks = @($blockedChecks + $failedChecks | Select-Object -Unique)
        blockedAreas = @($environmentIssues + $blockedChecks + $failedChecks | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
        uncoveredAreas = @($uncoveredAreas)
        confidenceRationale = ($rationale -join ' ')
        residualRisk = if ($uncoveredAreas.Count -gt 0) { $uncoveredAreas -join '; ' } else { 'No material residual coverage gap.' }
        coverage = [PSCustomObject]@{
            totalTargets = $coverage.totalTargets
            inspectedTargets = $coverage.inspectedTargets
            blockedTargets = $coverage.blockedTargets
            notPresentTargets = $coverage.notPresentTargets
            outOfScopeTargets = $coverage.outOfScopeTargets
            partialTargets = $coverage.partialTargets
        }
    }
}
