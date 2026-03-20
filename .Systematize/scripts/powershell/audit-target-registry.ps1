function Get-AuditTargetRegistry {
    [CmdletBinding()]
    param()

    $repoRoot = Get-RepoRoot

    $webBase = @('apps', 'web', 'src', 'app', '(main)')
    $backendBase = @('apps', 'backend', 'src')

    $webTargets = @(
        'brain-storm-ai',
        'BREAKAPP',
        'breakdown',
        'BUDGET',
        'cinematography-studio',
        'development',
        'directors-studio',
        'editor',
        'styleIST',
        'actorai-arabic',
        'analysis',
        'arabic-creative-writing-studio',
        'arabic-prompt-engineering-studio',
        'art-director',
        'brainstorm'
    )

    $backendTargets = @(
        'queues',
        'scripts',
        'services',
        'test',
        'types',
        'utils',
        '__tests__',
        'agents',
        'config',
        'controllers',
        'db',
        'examples',
        'middleware'
    )

    $webLayers = @('config', 'toolchain', 'frontend', 'integration', 'security', 'performance', 'production')
    $backendLayers = @('config', 'toolchain', 'server', 'shared', 'integration', 'security', 'performance', 'production')

    $targets = New-Object System.Collections.Generic.List[object]
    $webRoot = Join-Path -Path $repoRoot -ChildPath ($webBase -join [IO.Path]::DirectorySeparatorChar)
    $backendRoot = Join-Path -Path $repoRoot -ChildPath ($backendBase -join [IO.Path]::DirectorySeparatorChar)

    foreach ($target in $webTargets) {
        $absolutePath = Join-Path -Path $webRoot -ChildPath $target
        $relativePath = (($webBase + $target) -join '/')
        $targets.Add([PSCustomObject]@{
            path = $absolutePath
            relativePath = $relativePath
            targetType = 'web'
            expectedLayers = @($webLayers)
            coverageStatus = 'not_present'
            blockedReason = ''
            evidenceRef = ''
        }) | Out-Null
    }

    foreach ($target in $backendTargets) {
        $absolutePath = Join-Path -Path $backendRoot -ChildPath $target
        $relativePath = (($backendBase + $target) -join '/')
        $targets.Add([PSCustomObject]@{
            path = $absolutePath
            relativePath = $relativePath
            targetType = 'backend'
            expectedLayers = @($backendLayers)
            coverageStatus = 'not_present'
            blockedReason = ''
            evidenceRef = ''
        }) | Out-Null
    }

    return @($targets.ToArray())
}

function Get-AuditTargetByPath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$CandidatePath
    )

    $normalized = $CandidatePath.Replace('\', '/')
    return Get-AuditTargetRegistry | Where-Object {
        $_.path.Replace('\', '/') -eq $normalized -or $_.relativePath -eq $normalized
    } | Select-Object -First 1
}
