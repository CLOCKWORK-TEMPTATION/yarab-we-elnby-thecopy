function Get-AuditCheckCatalog {
    [CmdletBinding()]
    param()

    return @(
        [PSCustomObject]@{
            checkName = 'lint'
            scope = 'repo-root'
            allowedStatuses = @('executed', 'failed', 'blocked')
            defaultConfidenceImpact = [PSCustomObject]@{
                executed = 'low'
                failed = 'high'
                blocked = 'medium'
            }
        },
        [PSCustomObject]@{
            checkName = 'type-check'
            scope = 'repo-root'
            allowedStatuses = @('executed', 'failed', 'blocked')
            defaultConfidenceImpact = [PSCustomObject]@{
                executed = 'low'
                failed = 'high'
                blocked = 'high'
            }
        },
        [PSCustomObject]@{
            checkName = 'test'
            scope = 'repo-root'
            allowedStatuses = @('executed', 'failed', 'blocked')
            defaultConfidenceImpact = [PSCustomObject]@{
                executed = 'low'
                failed = 'high'
                blocked = 'high'
            }
        },
        [PSCustomObject]@{
            checkName = 'build'
            scope = 'repo-root'
            allowedStatuses = @('executed', 'failed', 'blocked')
            defaultConfidenceImpact = [PSCustomObject]@{
                executed = 'low'
                failed = 'high'
                blocked = 'high'
            }
        }
    )
}

function Get-AuditCheckDefinition {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$CheckName
    )

    return Get-AuditCheckCatalog | Where-Object { $_.checkName -eq $CheckName } | Select-Object -First 1
}
