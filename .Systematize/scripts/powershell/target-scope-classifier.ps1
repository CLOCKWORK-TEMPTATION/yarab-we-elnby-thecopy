function Get-TargetLayerProfile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$TargetType
    )

    switch ($TargetType) {
        'web' { return @('config', 'toolchain', 'frontend', 'integration', 'security', 'performance', 'production') }
        'backend' { return @('config', 'toolchain', 'server', 'shared', 'integration', 'security', 'performance', 'production') }
        'shared-linked' { return @('config', 'toolchain', 'shared', 'integration', 'security', 'performance', 'production') }
        default { return @('config', 'toolchain', 'shared', 'integration', 'security', 'performance', 'production') }
    }
}

function Classify-TargetScope {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$Target,
        [string[]]$InspectedLayers = @(),
        [string[]]$BlockedLayers = @(),
        [hashtable]$BlockedReasons = @{},
        [hashtable]$NotPresentReasons = @{},
        [string]$BlockedReason = ''
    )

    $canonicalLayers = @('config', 'toolchain', 'server', 'shared', 'frontend', 'integration', 'security', 'performance', 'production')
    $expectedLayers = if ($Target.expectedLayers -and $Target.expectedLayers.Count -gt 0) {
        @($Target.expectedLayers)
    } else {
        Get-TargetLayerProfile -TargetType ([string]$Target.targetType)
    }

    $expectedLayers = @($expectedLayers | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ } | Select-Object -Unique)
    $inspected = @($InspectedLayers | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ } | Select-Object -Unique)
    $blocked = @($BlockedLayers | ForEach-Object { ([string]$_).Trim() } | Where-Object { $_ } | Select-Object -Unique)

    $layerStates = foreach ($layer in $canonicalLayers) {
        if ($layer -notin $expectedLayers) {
            [PSCustomObject]@{
                layer = $layer
                status = 'out_of_scope'
                reason = 'Layer is خارج نطاق الهدف الحالي.'
            }
            continue
        }

        if ($layer -in $blocked) {
            [PSCustomObject]@{
                layer = $layer
                status = 'blocked'
                reason = if ($BlockedReasons.ContainsKey($layer)) { [string]$BlockedReasons[$layer] } elseif ($BlockedReason) { $BlockedReason } else { 'Layer inspection was blocked.' }
            }
            continue
        }

        if ($layer -in $inspected) {
            [PSCustomObject]@{
                layer = $layer
                status = 'inspected'
                reason = ''
            }
            continue
        }

        [PSCustomObject]@{
            layer = $layer
            status = 'not_present'
            reason = if ($NotPresentReasons.ContainsKey($layer)) { [string]$NotPresentReasons[$layer] } else { 'No usable evidence was collected for this expected layer.' }
        }
    }

    $blockedExpectedLayers = @($layerStates | Where-Object { $_.status -eq 'blocked' } | ForEach-Object { $_.layer })
    $notPresentLayers = @($layerStates | Where-Object { $_.status -eq 'not_present' } | ForEach-Object { $_.layer })

    if ($blockedExpectedLayers.Count -gt 0) {
        $coverageStatus = 'blocked'
    } elseif ($inspected.Count -gt 0 -and $notPresentLayers.Count -eq 0) {
        $coverageStatus = 'inspected'
    } elseif ($inspected.Count -gt 0) {
        $coverageStatus = 'blocked'
    } else {
        $coverageStatus = 'not_present'
    }

    if ($blockedExpectedLayers.Count -gt 0) {
        $inferredBlockedReason = @(
            foreach ($layer in $blockedExpectedLayers) {
                if ($BlockedReasons.ContainsKey($layer)) { [string]$BlockedReasons[$layer] }
                elseif ($BlockedReason) { $BlockedReason }
                else { "$layer blocked" }
            }
        ) -join '; '
    } elseif ($inspected.Count -gt 0 -and $notPresentLayers.Count -gt 0) {
        $inferredBlockedReason = "Partial layer coverage: $($notPresentLayers -join ', ')"
    } else {
        $inferredBlockedReason = ([string]$Target.blockedReason).Trim()
    }

    return [PSCustomObject]@{
        path = ([string]$Target.path).Trim()
        relativePath = ([string]$Target.relativePath).Trim()
        targetType = ([string]$Target.targetType).Trim()
        expectedLayers = @($expectedLayers)
        coverageStatus = $coverageStatus
        blockedReason = $inferredBlockedReason
        inspectedLayers = @($layerStates | Where-Object { $_.status -eq 'inspected' } | ForEach-Object { $_.layer })
        blockedLayers = @($blockedExpectedLayers)
        outOfScopeLayers = @($layerStates | Where-Object { $_.status -eq 'out_of_scope' } | ForEach-Object { $_.layer })
        notPresentLayers = @($notPresentLayers)
        layerStates = @($layerStates)
    }
}

function Classify-TargetScopeByPath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$CandidatePath,
        [string[]]$InspectedLayers = @(),
        [string[]]$BlockedLayers = @(),
        [hashtable]$BlockedReasons = @{},
        [hashtable]$NotPresentReasons = @{},
        [string]$BlockedReason = ''
    )

    $target = Get-AuditTargetByPath -CandidatePath $CandidatePath
    if (-not $target) { throw "Unknown audit target path: $CandidatePath" }

    return Classify-TargetScope -Target $target -InspectedLayers $InspectedLayers -BlockedLayers $BlockedLayers -BlockedReasons $BlockedReasons -NotPresentReasons $NotPresentReasons -BlockedReason $BlockedReason
}
