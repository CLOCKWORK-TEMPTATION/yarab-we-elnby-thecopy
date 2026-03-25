function Normalize-FindingRecord {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Record
    )

    if ([string]::IsNullOrWhiteSpace([string]$Record.findingId)) {
        throw 'findingId is required'
    }

    $allowedTypes = @('خطأ مؤكد', 'خطر محتمل', 'ضعف تصميمي', 'تحسين مقترح')
    $allowedSeverities = @('حرج', 'عالٍ', 'متوسط', 'منخفض')
    $allowedLayers = @('config', 'toolchain', 'server', 'shared', 'frontend', 'integration', 'security', 'performance', 'production')

    if ([string]$Record.type -notin $allowedTypes) { throw "Unsupported finding type: $($Record.type)" }
    if ([string]$Record.severity -notin $allowedSeverities) { throw "Unsupported severity: $($Record.severity)" }
    if ([string]$Record.layer -notin $allowedLayers) { throw "Unsupported layer: $($Record.layer)" }

    foreach ($field in @('location', 'problem', 'evidence', 'impact', 'fix')) {
        if ([string]::IsNullOrWhiteSpace([string]$Record.$field)) {
            throw "$field is required for finding $($Record.findingId)"
        }
    }

    return [PSCustomObject]@{
        findingId = ([string]$Record.findingId).Trim()
        type = ([string]$Record.type).Trim()
        severity = ([string]$Record.severity).Trim()
        layer = ([string]$Record.layer).Trim()
        location = ([string]$Record.location).Trim()
        problem = ([string]$Record.problem).Trim()
        evidence = ([string]$Record.evidence).Trim()
        impact = ([string]$Record.impact).Trim()
        fix = ([string]$Record.fix).Trim()
        mergedFrom = @($Record.mergedFrom | Where-Object { $_ } | ForEach-Object { ([string]$_).Trim() } | Select-Object -Unique)
    }
}

function Merge-FindingRecords {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Records
    )

    $severityWeight = @{
        'حرج' = 4
        'عالٍ' = 3
        'متوسط' = 2
        'منخفض' = 1
    }

    $merged = @{}

    foreach ($rawRecord in $Records) {
        $record = Normalize-FindingRecord -Record $rawRecord
        $key = "$($record.type)::$($record.layer)::$($record.problem.ToLowerInvariant())::$($record.fix.ToLowerInvariant())"

        if (-not $merged.ContainsKey($key)) {
            $merged[$key] = [PSCustomObject]@{
                findingId = $record.findingId
                type = $record.type
                severity = $record.severity
                layer = $record.layer
                location = $record.location
                problem = $record.problem
                evidence = $record.evidence
                impact = $record.impact
                fix = $record.fix
                mergedFrom = @($record.findingId) + @($record.mergedFrom)
            }
            continue
        }

        $current = $merged[$key]
        if ($severityWeight[$record.severity] -gt $severityWeight[$current.severity]) {
            $current.severity = $record.severity
        }

        if ($current.location -notmatch [regex]::Escape($record.location)) {
            $current.location = "$($current.location); $($record.location)"
        }

        if ($current.evidence -notmatch [regex]::Escape($record.evidence)) {
            $current.evidence = "$($current.evidence)`n---`n$($record.evidence)"
        }

        $current.mergedFrom = @($current.mergedFrom + $record.findingId + $record.mergedFrom | Where-Object { $_ } | Select-Object -Unique)
    }

    return @($merged.Values)
}
