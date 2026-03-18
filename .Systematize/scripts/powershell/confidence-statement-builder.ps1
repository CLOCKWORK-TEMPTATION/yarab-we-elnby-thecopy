function Build-ConfidenceCoverageSection {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$InputObject
    )

    $statement = if ($InputObject.reviewMode -and $InputObject.confidenceLevel) {
        [PSCustomObject]@{
            reviewMode = ([string]$InputObject.reviewMode).Trim()
            confidenceLevel = ([string]$InputObject.confidenceLevel).Trim()
            executedChecks = @($InputObject.executedChecks)
            blockedChecks = @($InputObject.blockedChecks)
            blockedAreas = @($InputObject.blockedAreas)
            uncoveredAreas = @($InputObject.uncoveredAreas)
            confidenceRationale = ([string]$InputObject.confidenceRationale).Trim()
            residualRisk = ([string]$InputObject.residualRisk).Trim()
        }
    } else {
        Get-ConfidenceStatement @InputObject
    }

    $formatList = {
        param([object[]]$Values)
        $normalized = @($Values | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | ForEach-Object { ([string]$_).Trim() } | Select-Object -Unique)
        if ($normalized.Count -eq 0) { return 'None' }
        return ($normalized -join ', ')
    }

    return @(
        '## Confidence and Coverage'
        ''
        "- **Review Mode**: $($statement.reviewMode)"
        "- **Confidence Level**: $($statement.confidenceLevel)"
        "- **Executed Checks**: $(& $formatList $statement.executedChecks)"
        "- **Blocked Checks**: $(& $formatList $statement.blockedChecks)"
        "- **Uncovered Areas**: $(& $formatList $statement.uncoveredAreas)"
        "- **Confidence Rationale**: $($statement.confidenceRationale)"
        "- **Residual Risk**: $($statement.residualRisk)"
    ) -join "`n"
}
