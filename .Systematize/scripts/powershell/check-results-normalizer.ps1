function Normalize-CheckResult {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Record
    )

    $definition = Get-AuditCheckDefinition -CheckName $Record.checkName
    if (-not $definition) {
        throw "Unknown checkName: $($Record.checkName)"
    }

    $status = [string]$Record.status
    if ($status -notin @('executed', 'failed', 'blocked')) {
        throw "Unsupported status for $($Record.checkName): $status"
    }

    $scope = if ([string]::IsNullOrWhiteSpace([string]$Record.scope)) { $definition.scope } else { [string]$Record.scope }
    $directCause = [string]$Record.directCause
    $outputRef = [string]$Record.outputRef
    $confidenceImpact = if ([string]::IsNullOrWhiteSpace([string]$Record.confidenceImpact)) {
        $definition.defaultConfidenceImpact.$status
    } else {
        [string]$Record.confidenceImpact
    }

    if (($status -eq 'failed' -or $status -eq 'blocked') -and [string]::IsNullOrWhiteSpace($directCause)) {
        throw "directCause is required when $($Record.checkName) is $status"
    }

    return [PSCustomObject]@{
        checkName = $definition.checkName
        scope = $scope
        status = $status
        directCause = $directCause.Trim()
        confidenceImpact = $confidenceImpact
        outputRef = $outputRef.Trim()
    }
}

function Normalize-CheckResults {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Records
    )

    return @($Records | ForEach-Object { Normalize-CheckResult -Record $_ })
}
