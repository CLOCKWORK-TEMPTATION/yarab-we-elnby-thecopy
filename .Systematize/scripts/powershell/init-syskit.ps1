#!/usr/bin/env pwsh

[CmdletBinding()]
param(
    [string]$TargetPath = (Get-Location).Path,
    [string]$Platforms,
    [switch]$Force,
    [switch]$Json,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

. "$PSScriptRoot/common.ps1"

$InstallStateRelativePath = Join-Path '.Systematize' 'memory/install-state.json'
$CoreInstallMarkers = @(
    (Join-Path 'commands' 'syskit.init.md'),
    (Join-Path '.Systematize' 'config/syskit-config.yml'),
    (Join-Path '.Systematize' 'templates/agent-file-template.md'),
    (Join-Path '.Systematize' 'scripts/powershell/init-syskit.ps1'),
    (Join-Path '.Systematize' 'scripts/node/cli.mjs')
)
$ManagedCoreDirectories = @(
    'commands',
    (Join-Path '.Systematize' 'config'),
    (Join-Path '.Systematize' 'templates'),
    (Join-Path '.Systematize' 'scripts'),
    (Join-Path '.Systematize' 'presets')
)
$ManagedDynamicFiles = @(
    (Join-Path '.Systematize' 'extensions/README.md'),
    (Join-Path '.Systematize' 'extensions/commands/.gitkeep'),
    (Join-Path '.Systematize' 'extensions/templates/.gitkeep'),
    (Join-Path '.Systematize' 'memory/analytics.json'),
    (Join-Path '.Systematize' 'memory/sync-state.json'),
    (Join-Path '.Systematize' 'memory/constitution.md'),
    $InstallStateRelativePath
)
$PlatformBundleDirectories = @(
    @{ source_segments = @('commands'); target_name = 'commands' }
)

function New-DirectoryIfMissing {
    param([Parameter(Mandatory = $true)][string]$Path)
    Ensure-Dir -Path $Path
}

function Write-JsonUtf8 {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$Data
    )

    $parent = Split-Path -Parent $Path
    if ($parent) {
        New-DirectoryIfMissing -Path $parent
    }

    $Data | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $Path -Encoding utf8
}

function Read-JsonUtf8 {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $null
    }

    return Get-Content -LiteralPath $Path -Raw -Encoding utf8 | ConvertFrom-Json
}

function Track-Write {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][bool]$ExistedBefore
    )

    $Summary.written.Add($Path) | Out-Null

    if ($ExistedBefore) {
        $Summary.overwritten_paths.Add($Path) | Out-Null
    } else {
        $Summary.created_paths.Add($Path) | Out-Null
    }
}

function Write-ManagedFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    $existedBefore = Test-Path -LiteralPath $Path -PathType Leaf
    if ($existedBefore -and -not $ForceWrite) {
        $Summary.skipped.Add($Path) | Out-Null
        return
    }

    $parent = Split-Path -Parent $Path
    if ($parent) {
        New-DirectoryIfMissing -Path $parent
    }

    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
    Track-Write -Summary $Summary -Path $Path -ExistedBefore:$existedBefore
}

function Copy-ManagedTree {
    param(
        [Parameter(Mandatory = $true)][string]$SourceDir,
        [Parameter(Mandatory = $true)][string]$TargetDir,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    if (-not (Test-Path -LiteralPath $SourceDir -PathType Container)) {
        return
    }

    $resolvedSource = [System.IO.Path]::GetFullPath($SourceDir)
    $resolvedTarget = [System.IO.Path]::GetFullPath($TargetDir)
    if ($resolvedSource -eq $resolvedTarget) {
        return
    }

    New-DirectoryIfMissing -Path $TargetDir

    foreach ($item in (Get-ChildItem -LiteralPath $SourceDir -Force)) {
        $sourcePath = $item.FullName
        $targetPath = Join-Path $TargetDir $item.Name

        if ($item.PSIsContainer) {
            Copy-ManagedTree -SourceDir $sourcePath -TargetDir $targetPath -Summary $Summary -ForceWrite:$ForceWrite
            continue
        }

        $existedBefore = Test-Path -LiteralPath $targetPath -PathType Leaf
        if ($existedBefore -and -not $ForceWrite) {
            $Summary.skipped.Add($targetPath) | Out-Null
            continue
        }

        New-DirectoryIfMissing -Path (Split-Path -Parent $targetPath)
        Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
        Track-Write -Summary $Summary -Path $targetPath -ExistedBefore:$existedBefore
    }
}

function Add-GitIgnoreBlock {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    $block = @(
        '# Systematize KIT',
        '.Systematize/exports/',
        '.Systematize/snapshots/',
        ''
    ) -join "`n"

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Write-ManagedFile -Path $Path -Content $block -Summary $Summary -ForceWrite:$ForceWrite
        return
    }

    $current = Get-Content -LiteralPath $Path -Raw -Encoding utf8
    if ($current -match [regex]::Escape('# Systematize KIT')) {
        $Summary.skipped.Add($Path) | Out-Null
        return
    }

    $next = $current.TrimEnd() + "`n`n" + $block
    Set-Content -LiteralPath $Path -Value $next -Encoding utf8
    Track-Write -Summary $Summary -Path $Path -ExistedBefore:$true
}

function Convert-TemplateTokens {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][hashtable]$Replacements
    )

    $output = $Content
    foreach ($key in $Replacements.Keys) {
        $output = $output.Replace($key, [string]$Replacements[$key])
    }

    return $output
}

function New-AgentGuidance {
    param(
        [Parameter(Mandatory = $true)][string]$TemplateContent,
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][string[]]$SupportedPlatforms,
        [Parameter(Mandatory = $true)][string]$DateText
    )

    $commands = @(
        'PowerShell:',
        'pwsh -File .Systematize/scripts/powershell/create-new-feature.ps1 "Feature description" -Json',
        '',
        'Node.js:',
        'node .Systematize/scripts/node/cli.mjs create-feature "Feature description" --json',
        '',
        'Bootstrap:',
        'pwsh -File .Systematize/scripts/powershell/init-syskit.ps1',
        'node .Systematize/scripts/node/cli.mjs init'
    ) -join "`n"

    $style = @(
        'Follow repository conventions and update these instructions after plan.md is created.',
        'Prefer the Systematize workflow: sys -> clarify -> constitution -> research -> plan -> tasks -> implement.'
    ) -join "`n"

    $content = Convert-TemplateTokens -Content $TemplateContent -Replacements @{
        '[PROJECT NAME]' = $ProjectName
        '[DATE]' = $DateText
        '[EXTRACTED FROM ALL PLAN.MD FILES]' = '- Bootstrap stage: no plan-derived technologies yet'
        '[ACTUAL STRUCTURE FROM PLANS]' = "commands/`n.Systematize/`nspecs/"
        '[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]' = $commands
        '[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]' = $style
        '[LAST 3 FEATURES AND WHAT THEY ADDED]' = '- bootstrap: Installed Systematize KIT'
    }

    $lines = [System.Collections.Generic.List[string]]::new()
    foreach ($line in ($content -split "`r?`n")) {
        $lines.Add($line) | Out-Null
    }

    $lines.Insert(3, '') | Out-Null
    $lines.Insert(3, "Supported platforms: $($SupportedPlatforms -join ', ')") | Out-Null
    return ($lines -join "`n")
}

function New-MdcGuidance {
    param([Parameter(Mandatory = $true)][string]$MarkdownContent)

    $frontmatter = @(
        '---',
        'description: Project Development Guidelines',
        'globs: ["**/*"]',
        'alwaysApply: true',
        '---',
        ''
    ) -join "`n"

    return $frontmatter + $MarkdownContent
}

function Assert-NoRuntimePlaceholders {
    param(
        [Parameter(Mandatory = $true)][string]$Content,
        [Parameter(Mandatory = $true)][string]$TargetPath
    )

    $placeholders = @(Find-UnresolvedPlaceholders -Content $Content | Where-Object { $_ -ne '[PROJECT_NAME]' })
    if ($placeholders.Count -gt 0) {
        throw "Unresolved placeholders in ${TargetPath}: $($placeholders -join ', ')"
    }
}

function New-VSCodeTasksJson {
    $payload = [ordered]@{
        version = '2.0.0'
        tasks = @(
            [ordered]@{
                label = 'Syskit: Create Feature (PowerShell)'
                type = 'shell'
                command = 'pwsh'
                args = @('-File', '.Systematize/scripts/powershell/create-new-feature.ps1', 'Feature description', '-Json')
                problemMatcher = @()
            },
            [ordered]@{
                label = 'Syskit: Healthcheck (PowerShell)'
                type = 'shell'
                command = 'pwsh'
                args = @('-File', '.Systematize/scripts/powershell/run-healthcheck.ps1')
                problemMatcher = @()
            },
            [ordered]@{
                label = 'Syskit: Status (Node)'
                type = 'shell'
                command = 'node'
                args = @('.Systematize/scripts/node/cli.mjs', 'feature-status', '--json')
                problemMatcher = @()
            }
        )
    }

    return ($payload | ConvertTo-Json -Depth 6)
}

function New-VSCodeSettingsJson {
    $payload = [ordered]@{
        'files.exclude' = [ordered]@{
            '**/.Systematize/exports' = $true
            '**/.Systematize/snapshots' = $true
        }
        'search.exclude' = [ordered]@{
            '**/.Systematize/exports' = $true
            '**/.Systematize/snapshots' = $true
        }
    }

    return ($payload | ConvertTo-Json -Depth 6)
}

function New-VSCodeExtensionsJson {
    $payload = [ordered]@{
        recommendations = @(
            'github.copilot',
            'Continue.continue'
        )
    }

    return ($payload | ConvertTo-Json -Depth 6)
}

function Initialize-Memory {
    param(
        [Parameter(Mandatory = $true)][string]$SourceRoot,
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [Parameter(Mandatory = $true)][string]$ProjectName,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    $memoryDir = Join-Path $TargetRoot '.Systematize/memory'
    New-DirectoryIfMissing -Path $memoryDir

    Write-ManagedFile -Path (Join-Path $memoryDir 'analytics.json') -Content (@{
        schema_version = 1
        features = @{}
        extensions = @{
            hooks_executed = @()
            custom_commands_used = @()
        }
    } | ConvertTo-Json -Depth 6) -Summary $Summary -ForceWrite:$ForceWrite

    Write-ManagedFile -Path (Join-Path $memoryDir 'sync-state.json') -Content (@{
        schema_version = 1
        features = @{}
        extensions = @{}
        last_global_check = $null
    } | ConvertTo-Json -Depth 6) -Summary $Summary -ForceWrite:$ForceWrite

    $dateText = (Get-Date).ToString('yyyy-MM-dd')
    $constitutionTemplatePath = Join-Path $SourceRoot '.Systematize/templates/constitution-template.md'
    $constitutionContent = if (Test-Path -LiteralPath $constitutionTemplatePath -PathType Leaf) {
        Get-Content -LiteralPath $constitutionTemplatePath -Raw -Encoding utf8
    } else {
        '# دستور المشروع [PROJECT_NAME]'
    }

    $constitutionContent = Convert-TemplateTokens -Content $constitutionContent -Replacements @{
        '[PROJECT_NAME]' = $ProjectName
        '[CONSTITUTION_VERSION]' = '1.0.0'
        '[CONSTITUTION_DATE]' = $dateText
        '[LAST_AMENDED_DATE]' = $dateText
    }

    Write-ManagedFile -Path (Join-Path $memoryDir 'constitution.md') -Content $constitutionContent -Summary $Summary -ForceWrite:$ForceWrite
}

function Initialize-Extensions {
    param(
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    $extensionsRoot = Join-Path $TargetRoot '.Systematize/extensions'
    New-DirectoryIfMissing -Path (Join-Path $extensionsRoot 'commands')
    New-DirectoryIfMissing -Path (Join-Path $extensionsRoot 'templates')
    Write-ManagedFile -Path (Join-Path $extensionsRoot 'commands/.gitkeep') -Content '' -Summary $Summary -ForceWrite:$ForceWrite
    Write-ManagedFile -Path (Join-Path $extensionsRoot 'templates/.gitkeep') -Content '' -Summary $Summary -ForceWrite:$ForceWrite
}

function Initialize-Directories {
    param([Parameter(Mandatory = $true)][string]$TargetRoot)

    @(
        (Join-Path $TargetRoot '.Systematize/exports'),
        (Join-Path $TargetRoot '.Systematize/snapshots'),
        (Join-Path $TargetRoot 'specs')
    ) | ForEach-Object {
        New-DirectoryIfMissing -Path $_
    }
}

function Get-RelativeFilesRecursively {
    param(
        [Parameter(Mandatory = $true)][string]$BaseDir,
        [Parameter(Mandatory = $true)][string]$CurrentDir
    )

    if (-not (Test-Path -LiteralPath $CurrentDir -PathType Container)) {
        return @()
    }

    return @(Get-ChildItem -LiteralPath $CurrentDir -File -Recurse | ForEach-Object {
        [System.IO.Path]::GetRelativePath($BaseDir, $_.FullName)
    })
}

function Get-ManagedCoreRelativeFiles {
    param([Parameter(Mandatory = $true)][string]$SourceRoot)

    $relativeFiles = [System.Collections.Generic.List[string]]::new()

    foreach ($relativeDir in $ManagedCoreDirectories) {
        $absoluteDir = Join-Path $SourceRoot $relativeDir
        foreach ($relativeFile in (Get-RelativeFilesRecursively -BaseDir $SourceRoot -CurrentDir $absoluteDir)) {
            if ($relativeFile -notin $relativeFiles) {
                $relativeFiles.Add($relativeFile) | Out-Null
            }
        }
    }

    foreach ($relativeFile in $ManagedDynamicFiles) {
        if ($relativeFile -eq $InstallStateRelativePath) {
            if ($relativeFile -notin $relativeFiles) {
                $relativeFiles.Add($relativeFile) | Out-Null
            }
            continue
        }

        if (Test-Path -LiteralPath (Join-Path $SourceRoot $relativeFile) -PathType Leaf) {
            if ($relativeFile -notin $relativeFiles) {
                $relativeFiles.Add($relativeFile) | Out-Null
            }
        }
    }

    return $relativeFiles
}

function Get-ExpandedPlatformOutputs {
    param([Parameter(Mandatory = $true)]$Platform)

    $outputs = [System.Collections.Generic.List[string]]::new()
    $seen = @{}
    $mirrorDirectories = @()

    if ($null -ne $Platform.mirror_directories) {
        $mirrorDirectories = @($Platform.mirror_directories | Where-Object { $_ })
    }

    foreach ($outputFile in @($Platform.output_files)) {
        if (-not $seen.ContainsKey($outputFile)) {
            $seen[$outputFile] = $true
            $outputs.Add($outputFile) | Out-Null
        }

        if ($outputFile -match '[\\/]') {
            continue
        }

        foreach ($mirrorDirectory in $mirrorDirectories) {
            $mirrorPath = Join-Path $mirrorDirectory $outputFile
            if ($seen.ContainsKey($mirrorPath)) {
                continue
            }

            $seen[$mirrorPath] = $true
            $outputs.Add($mirrorPath) | Out-Null
        }
    }

    return $outputs
}

function Get-PlatformBundleRoots {
    param([Parameter(Mandatory = $true)]$Platform)

    $roots = [System.Collections.Generic.List[string]]::new()
    $seen = @{}
    $mirrorDirectories = @()

    if ($null -ne $Platform.mirror_directories) {
        $mirrorDirectories = @($Platform.mirror_directories | Where-Object { $_ })
    }

    foreach ($mirrorDirectory in $mirrorDirectories) {
        if (-not $seen.ContainsKey($mirrorDirectory)) {
            $seen[$mirrorDirectory] = $true
            $roots.Add($mirrorDirectory) | Out-Null
        }
    }

    foreach ($outputFile in @($Platform.output_files)) {
        $normalized = [string]$outputFile -replace '\\', '/'
        if ($normalized -notmatch '/') {
            continue
        }

        $root = ($normalized -split '/')[0]
        if (-not $root -or $seen.ContainsKey($root)) {
            continue
        }

        $seen[$root] = $true
        $roots.Add($root) | Out-Null
    }

    return $roots
}

function Get-PlatformBundleRelativeFiles {
    param(
        [Parameter(Mandatory = $true)][string]$SourceRoot,
        [Parameter(Mandatory = $true)][object[]]$SelectedPlatforms
    )

    $relativeFiles = [System.Collections.Generic.List[string]]::new()
    $seen = @{}
    $bundleRoots = [System.Collections.Generic.List[string]]::new()

    foreach ($platform in $SelectedPlatforms) {
        foreach ($bundleRoot in (Get-PlatformBundleRoots -Platform $platform)) {
            if ($bundleRoot -in $bundleRoots) {
                continue
            }
            $bundleRoots.Add($bundleRoot) | Out-Null
        }
    }

    foreach ($bundleRoot in $bundleRoots) {
        foreach ($bundleDirectory in $PlatformBundleDirectories) {
            $sourceDir = Join-Path $SourceRoot ($bundleDirectory.source_segments -join [System.IO.Path]::DirectorySeparatorChar)
            foreach ($filePath in (Get-RelativeFilesRecursively -BaseDir $sourceDir -CurrentDir $sourceDir)) {
                $relativePath = Join-Path (Join-Path $bundleRoot $bundleDirectory.target_name) $filePath
                if ($seen.ContainsKey($relativePath)) {
                    continue
                }

                $seen[$relativePath] = $true
                $relativeFiles.Add($relativePath) | Out-Null
            }
        }
    }

    return $relativeFiles
}

function Copy-PlatformBundles {
    param(
        [Parameter(Mandatory = $true)][string]$SourceRoot,
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [Parameter(Mandatory = $true)][object[]]$SelectedPlatforms,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    $copiedRoots = @{}

    foreach ($platform in $SelectedPlatforms) {
        foreach ($bundleRoot in (Get-PlatformBundleRoots -Platform $platform)) {
            if ($copiedRoots.ContainsKey($bundleRoot)) {
                continue
            }

            $copiedRoots[$bundleRoot] = $true

            foreach ($bundleDirectory in $PlatformBundleDirectories) {
                $sourceDir = Join-Path $SourceRoot ($bundleDirectory.source_segments -join [System.IO.Path]::DirectorySeparatorChar)
                $targetDir = Join-Path $TargetRoot (Join-Path $bundleRoot $bundleDirectory.target_name)
                Copy-ManagedTree -SourceDir $sourceDir -TargetDir $targetDir -Summary $Summary -ForceWrite:$ForceWrite
            }
        }
    }
}

function Get-PlatformStatus {
    param(
        [Parameter(Mandatory = $true)]$Platform,
        [Parameter(Mandatory = $true)][string]$TargetRoot
    )

    $outputs = @(Get-ExpandedPlatformOutputs -Platform $Platform)
    $existingOutputs = @($outputs | Where-Object { Test-Path -LiteralPath (Join-Path $TargetRoot $_) })
    $status = 'غير موجود'

    if ($existingOutputs.Count -gt 0 -and $existingOutputs.Count -lt $outputs.Count) {
        $status = 'موجود جزئيًا'
    } elseif ($existingOutputs.Count -gt 0 -and $existingOutputs.Count -eq $outputs.Count) {
        $status = 'موجود بالكامل'
    }

    return [pscustomobject]@{
        key = $Platform.key
        display_name = $Platform.display_name
        managed_outputs = $outputs
        existing_outputs = $existingOutputs
        status = $status
    }
}

function Get-InstallDetection {
    param([Parameter(Mandatory = $true)][string]$TargetRoot)

    $installStatePath = Join-Path $TargetRoot $InstallStateRelativePath
    $state = Read-JsonUtf8 -Path $installStatePath
    if ($null -ne $state) {
        return [ordered]@{
            detected = $true
            mode = 'state'
            state = $state
            markers_found = @($CoreInstallMarkers | Where-Object { Test-Path -LiteralPath (Join-Path $TargetRoot $_) })
        }
    }

    $markersFound = @($CoreInstallMarkers | Where-Object { Test-Path -LiteralPath (Join-Path $TargetRoot $_) })
    $detected = $markersFound.Count -ge 3

    return [ordered]@{
        detected = $detected
        mode = if ($detected) { 'legacy' } else { 'none' }
        state = $null
        markers_found = $markersFound
    }
}

function Test-InteractiveSession {
    param([switch]$JsonMode)

    if ($JsonMode) {
        return $false
    }

    try {
        return (-not [Console]::IsInputRedirected) -and (-not [Console]::IsOutputRedirected)
    } catch {
        return $false
    }
}

function Test-RawPlatformSelectionSupport {
    param([switch]$JsonMode)

    if (-not (Test-InteractiveSession -JsonMode:$JsonMode)) {
        return $false
    }

    try {
        $null = [Console]::WindowWidth
        return $true
    } catch {
        return $false
    }
}

function Test-AffirmativeAnswer {
    param([string]$Answer)

    $normalized = ($Answer ?? '').Trim().ToLowerInvariant()
    return $normalized -in @('y', 'yes', 'true', '1', 'ok', 'okay', 'نعم', 'ايوه', 'أيوه', 'اه', 'موافق')
}

function Get-PlatformStatusPromptText {
    param([string]$Status)

    switch ($Status) {
        'موجود بالكامل' { return 'fully present' }
        'موجود جزئيًا' { return 'partially present' }
        default { return 'not present' }
    }
}

function Get-PlatformStatusTag {
    param([string]$Status)

    switch ($Status) {
        'موجود بالكامل' { return 'present' }
        'موجود جزئيًا' { return 'partial' }
        default { return 'missing' }
    }
}

function Get-PlatformStatusSortValue {
    param([string]$Status)

    switch ($Status) {
        'موجود جزئيًا' { return 0 }
        'موجود بالكامل' { return 1 }
        default { return 2 }
    }
}

function Sort-PlatformStatuses {
    param([Parameter(Mandatory = $true)][object[]]$PlatformStatuses)

    return @($PlatformStatuses | Sort-Object `
        @{ Expression = { Get-PlatformStatusSortValue -Status $_.status } }, `
        @{ Expression = { [string]$_.key } })
}

function Get-PlatformSearchText {
    param([Parameter(Mandatory = $true)]$PlatformStatus)

    return ((@(
                $PlatformStatus.key,
                $PlatformStatus.display_name,
                (Get-PlatformStatusPromptText -Status $PlatformStatus.status)
            ) + @($PlatformStatus.managed_outputs)) -join ' ').ToLowerInvariant()
}

function Get-FilteredPlatformStatuses {
    param(
        [Parameter(Mandatory = $true)][object[]]$PlatformStatuses,
        [string]$SearchQuery
    )

    $normalizedQuery = ($SearchQuery ?? '').Trim().ToLowerInvariant()
    if (-not $normalizedQuery) {
        return $PlatformStatuses
    }

    return @($PlatformStatuses | Where-Object {
            (Get-PlatformSearchText -PlatformStatus $_).Contains($normalizedQuery)
        })
}

function New-SelectedKeySet {
    param([string[]]$Values = @())

    $set = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($value in $Values) {
        if ($value) {
            $set.Add([string]$value) | Out-Null
        }
    }

    return ,$set
}

function Clear-PlatformSelectionHost {
    try {
        Clear-Host
    } catch {
    }
}

function Get-NormalizedPlatformSelectionState {
    param(
        [Parameter(Mandatory = $true)][object[]]$PlatformStatuses,
        [Parameter(Mandatory = $true)]$State
    )

    $pageSize = 10
    if (($State.page_size -as [int]) -gt 0) {
        $pageSize = [int]$State.page_size
    }

    $filteredPlatforms = @(Get-FilteredPlatformStatuses -PlatformStatuses $PlatformStatuses -SearchQuery $State.search_query)
    $nextState = [pscustomobject]@{
        cursor_index = [Math]::Max(0, [int]($State.cursor_index ?? 0))
        scroll_offset = [Math]::Max(0, [int]($State.scroll_offset ?? 0))
        selected_keys = New-SelectedKeySet -Values @($State.selected_keys)
        search_query = [string]($State.search_query ?? '')
        message = [string]($State.message ?? '')
        page_size = $pageSize
    }

    if ($filteredPlatforms.Count -eq 0) {
        $nextState.cursor_index = 0
        $nextState.scroll_offset = 0
        return [pscustomobject]@{
            state = $nextState
            filtered_platforms = $filteredPlatforms
        }
    }

    $nextState.cursor_index = [Math]::Min($nextState.cursor_index, $filteredPlatforms.Count - 1)
    $maxScrollOffset = [Math]::Max(0, $filteredPlatforms.Count - $pageSize)

    if ($nextState.scroll_offset -gt $nextState.cursor_index) {
        $nextState.scroll_offset = $nextState.cursor_index
    }

    $visibleEndIndex = $nextState.scroll_offset + $pageSize - 1
    if ($nextState.cursor_index -gt $visibleEndIndex) {
        $nextState.scroll_offset = $nextState.cursor_index - $pageSize + 1
    }

    $nextState.scroll_offset = [Math]::Min([Math]::Max($nextState.scroll_offset, 0), $maxScrollOffset)
    return [pscustomobject]@{
        state = $nextState
        filtered_platforms = $filteredPlatforms
    }
}

function New-PlatformSelectionState {
    param([Parameter(Mandatory = $true)][object[]]$PlatformStatuses)

    return (Get-NormalizedPlatformSelectionState -PlatformStatuses (Sort-PlatformStatuses -PlatformStatuses $PlatformStatuses) -State ([pscustomobject]@{
                cursor_index = 0
                scroll_offset = 0
                selected_keys = (New-SelectedKeySet)
                search_query = ''
                message = ''
                page_size = 10
            })).state
}

function Get-PlatformSelectionView {
    param(
        [Parameter(Mandatory = $true)][object[]]$PlatformStatuses,
        [Parameter(Mandatory = $true)]$State
    )

    $orderedPlatforms = @(Sort-PlatformStatuses -PlatformStatuses $PlatformStatuses)
    $normalized = Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $State
    $filteredPlatforms = @($normalized.filtered_platforms)
    $pageItems = @()

    if ($filteredPlatforms.Count -gt 0) {
        $startIndex = $normalized.state.scroll_offset
        $endIndex = [Math]::Min($filteredPlatforms.Count - 1, $startIndex + $normalized.state.page_size - 1)
        if ($endIndex -ge $startIndex) {
            $pageItems = @($filteredPlatforms[$startIndex..$endIndex])
        }
    }

    return [pscustomobject]@{
        ordered_platforms = $orderedPlatforms
        filtered_platforms = $filteredPlatforms
        page_items = $pageItems
        current_item = if ($filteredPlatforms.Count -gt 0) { $filteredPlatforms[$normalized.state.cursor_index] } else { $null }
        has_more_above = $normalized.state.scroll_offset -gt 0
        has_more_below = ($normalized.state.scroll_offset + $normalized.state.page_size) -lt $filteredPlatforms.Count
        state = $normalized.state
    }
}

function Resolve-ReinstallDecision {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Detection,
        [switch]$ForceWrite,
        [switch]$Interactive
    )

    if (-not $Detection.detected) {
        return [ordered]@{
            approved = $true
            reinstall_performed = $false
            overwrite_mode = if ($ForceWrite) { 'force_initial' } else { 'initial_install' }
        }
    }

    if ($ForceWrite) {
        return [ordered]@{
            approved = $true
            reinstall_performed = $true
            overwrite_mode = 'force'
        }
    }

    if (-not $Interactive) {
        return [ordered]@{
            approved = $true
            reinstall_performed = $true
            overwrite_mode = 'non_interactive'
        }
    }

    $answer = Read-Host 'Systematize KIT is already installed. Reinstalling will create a snapshot and rewrite the managed files for the platforms you select. Continue? [y/N]'
    $approved = Test-AffirmativeAnswer -Answer $answer

    return [ordered]@{
        approved = $approved
        reinstall_performed = $approved
        overwrite_mode = if ($approved) { 'confirmed' } else { 'cancelled' }
    }
}

function Parse-PlatformSelectionCommand {
    param(
        [string]$Answer,
        [Parameter(Mandatory = $true)][object[]]$PlatformStatuses
    )

    $trimmed = ($Answer ?? '').Trim()
    if (-not $trimmed) {
        return @{ action = 'confirm' }
    }

    $normalized = $trimmed.ToLowerInvariant()
    if ($normalized -in @('all', '*', 'select-all')) {
        return @{ action = 'select_all' }
    }

    if ($normalized -in @('none', 'clear', 'clear-all', 'unselect-all')) {
        return @{ action = 'clear_selection' }
    }

    if ($normalized -in @('cancel', 'quit', 'exit')) {
        return @{ action = 'cancel' }
    }

    $selectedKeys = [System.Collections.Generic.List[string]]::new()
    $availableKeys = @{}
    $indexMap = @{}

    for ($index = 0; $index -lt $PlatformStatuses.Count; $index++) {
        $indexMap[[string]($index + 1)] = $PlatformStatuses[$index].key
        $availableKeys[$PlatformStatuses[$index].key.ToLowerInvariant()] = $PlatformStatuses[$index].key
    }

    foreach ($token in @($trimmed -split '[,\s]+' | Where-Object { $_ })) {
        if ($indexMap.ContainsKey($token)) {
            $selectedKeys.Add($indexMap[$token]) | Out-Null
            continue
        }

        $normalizedToken = $token.ToLowerInvariant()
        if ($availableKeys.ContainsKey($normalizedToken)) {
            $selectedKeys.Add($availableKeys[$normalizedToken]) | Out-Null
            continue
        }

        return $null
    }

    if ($selectedKeys.Count -eq 0) {
        return $null
    }

    return @{
        action = 'toggle'
        keys = @($selectedKeys | Select-Object -Unique)
    }
}

function Apply-PlatformSelectionKey {
    param(
        [Parameter(Mandatory = $true)]$State,
        [Parameter(Mandatory = $true)][object[]]$PlatformStatuses,
        [Parameter(Mandatory = $true)]$KeyInfo,
        [string]$Character = ''
    )

    $orderedPlatforms = @(Sort-PlatformStatuses -PlatformStatuses $PlatformStatuses)
    $normalized = Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $State
    $filteredPlatforms = @($normalized.filtered_platforms)
    $nextState = [pscustomobject]@{
        cursor_index = $normalized.state.cursor_index
        scroll_offset = $normalized.state.scroll_offset
        selected_keys = New-SelectedKeySet -Values @($normalized.state.selected_keys)
        search_query = $normalized.state.search_query
        message = ''
        page_size = $normalized.state.page_size
    }
    $lastIndex = [Math]::Max(0, $filteredPlatforms.Count - 1)

    if (($KeyInfo.Modifiers -band [ConsoleModifiers]::Control) -and $KeyInfo.Key -eq [ConsoleKey]::A) {
        if ($KeyInfo.Modifiers -band [ConsoleModifiers]::Shift) {
            $nextState.selected_keys.Clear()
        } else {
            $nextState.selected_keys.Clear()
            foreach ($platform in $orderedPlatforms) {
                $nextState.selected_keys.Add($platform.key) | Out-Null
            }
        }

        return @{
            done = $false
            cancelled = $false
            state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
        }
    }

    switch ($KeyInfo.Key) {
        ([ConsoleKey]::UpArrow) {
            $nextState.cursor_index = [Math]::Min([Math]::Max($nextState.cursor_index - 1, 0), $lastIndex)
            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::DownArrow) {
            $nextState.cursor_index = [Math]::Min([Math]::Max($nextState.cursor_index + 1, 0), $lastIndex)
            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::PageUp) {
            $nextState.cursor_index = [Math]::Min([Math]::Max($nextState.cursor_index - $nextState.page_size, 0), $lastIndex)
            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::PageDown) {
            $nextState.cursor_index = [Math]::Min([Math]::Max($nextState.cursor_index + $nextState.page_size, 0), $lastIndex)
            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::Home) {
            $nextState.cursor_index = 0
            $nextState.scroll_offset = 0
            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::End) {
            $nextState.cursor_index = $lastIndex
            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::Spacebar) {
            $currentItem = if ($filteredPlatforms.Count -gt 0) { $filteredPlatforms[$nextState.cursor_index] } else { $null }
            if ($null -eq $currentItem) {
                $nextState.message = 'No platforms match the current search.'
            } else {
                if ($nextState.selected_keys.Contains($currentItem.key)) {
                    $nextState.selected_keys.Remove($currentItem.key) | Out-Null
                } else {
                    $nextState.selected_keys.Add($currentItem.key) | Out-Null
                }
            }

            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::Backspace) {
            if ($nextState.search_query) {
                $nextState.search_query = $nextState.search_query.Substring(0, $nextState.search_query.Length - 1)
                $nextState.cursor_index = 0
                $nextState.scroll_offset = 0
            }

            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
        ([ConsoleKey]::Escape) {
            if ($nextState.search_query) {
                $nextState.search_query = ''
                $nextState.cursor_index = 0
                $nextState.scroll_offset = 0
                return @{
                    done = $false
                    cancelled = $false
                    state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
                }
            }

            return @{
                done = $false
                cancelled = $true
                state = $nextState
            }
        }
        ([ConsoleKey]::Enter) {
            if ($nextState.selected_keys.Count -eq 0) {
                $nextState.message = 'Select at least one platform to continue.'
                return @{
                    done = $false
                    cancelled = $false
                    state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
                }
            }

            return @{
                done = $true
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
    }

    if ($Character.Length -eq 1 -and -not ($KeyInfo.Modifiers -band [ConsoleModifiers]::Control) -and -not ($KeyInfo.Modifiers -band [ConsoleModifiers]::Alt)) {
        $characterCode = [int][char]$Character
        if ($characterCode -ge 32 -and $characterCode -le 126) {
            if ($Character -ne '/') {
                $nextState.search_query += $Character
                $nextState.cursor_index = 0
                $nextState.scroll_offset = 0
            }

            return @{
                done = $false
                cancelled = $false
                state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
            }
        }
    }

    return @{
        done = $false
        cancelled = $false
        state = (Get-NormalizedPlatformSelectionState -PlatformStatuses $orderedPlatforms -State $nextState).state
    }
}

function Write-PlatformSelectionScreen {
    param(
        [Parameter(Mandatory = $true)][object[]]$PlatformStatuses,
        [Parameter(Mandatory = $true)]$State
    )

    $view = Get-PlatformSelectionView -PlatformStatuses $PlatformStatuses -State $State

    Clear-PlatformSelectionHost
    Write-Host 'Select the platforms to reinstall'
    Write-Host 'Controls: Up/Down move | PageUp/PageDown page | Home/End jump'
    Write-Host 'Controls: Space toggle | Ctrl+A select all | Ctrl+Shift+A clear all | Enter confirm'
    Write-Host 'Controls: Type to filter | Backspace delete | Esc clear search or cancel'
    [object]$selectedKeySet = $view.state.selected_keys
    if ($null -eq $selectedKeySet) {
        $selectedKeySet = New-SelectedKeySet
    }
    Write-Host "Search: $(if ($view.state.search_query) { $view.state.search_query } else { '(type to filter)' })"
    Write-Host "Selected: $($selectedKeySet.Count) | Matching: $($view.filtered_platforms.Count) | Total: $($view.ordered_platforms.Count)"
    Write-Host ''

    if ($view.has_more_above) {
        Write-Host '↑ more above' -ForegroundColor DarkGray
    }

    if ($view.page_items.Count -eq 0) {
        Write-Host 'No platforms match the current search.'
    }

    for ($index = 0; $index -lt $view.page_items.Count; $index++) {
        $entry = $view.page_items[$index]
        $absoluteIndex = $view.state.scroll_offset + $index
        $pointer = if ($absoluteIndex -eq $view.state.cursor_index) { '>' } else { ' ' }
        $marker = if ($selectedKeySet.Contains($entry.key)) { '[x]' } else { '[ ]' }
        $statusTag = Get-PlatformStatusTag -Status $entry.status

        Write-Host "$pointer $marker $($entry.key) - $($entry.display_name) ($statusTag)"
    }

    if ($view.has_more_below) {
        Write-Host '↓ more below' -ForegroundColor DarkGray
    }

    if ($null -ne $view.current_item) {
        Write-Host ''
        Write-Host "Focused outputs: $($view.current_item.managed_outputs -join ', ')"
    }

    if ($view.state.message) {
        Write-Host ''
        Write-Host $view.state.message -ForegroundColor Yellow
    }
}

function Invoke-PlatformSelectionMenu {
    param([Parameter(Mandatory = $true)][object[]]$PlatformStatuses)

    $orderedPlatforms = @(Sort-PlatformStatuses -PlatformStatuses $PlatformStatuses)
    $state = New-PlatformSelectionState -PlatformStatuses $orderedPlatforms

    try {
        try {
            [Console]::CursorVisible = $false
        } catch {
        }

        Write-PlatformSelectionScreen -PlatformStatuses $orderedPlatforms -State $state

        while ($true) {
            $keyInfo = [Console]::ReadKey($true)

            if (($keyInfo.Modifiers -band [ConsoleModifiers]::Control) -and $keyInfo.Key -eq [ConsoleKey]::C) {
                throw 'Platform selection cancelled by user.'
            }

            $character = if ($keyInfo.KeyChar -ne [char]0) { [string]$keyInfo.KeyChar } else { '' }
            $result = Apply-PlatformSelectionKey -State $state -PlatformStatuses $orderedPlatforms -KeyInfo $keyInfo -Character $character
            $state = $result.state

            if ($result.cancelled) {
                Clear-PlatformSelectionHost
                throw 'Platform selection cancelled by user.'
            }

            if ($result.done) {
                Clear-PlatformSelectionHost
                return @($orderedPlatforms | Where-Object { $state.selected_keys.Contains($_.key) } | ForEach-Object { $_.key })
            }

            Write-PlatformSelectionScreen -PlatformStatuses $orderedPlatforms -State $state
        }
    } finally {
        try {
            [Console]::CursorVisible = $true
        } catch {
        }
    }
}

function Invoke-PlatformSelectionFallback {
    param([Parameter(Mandatory = $true)][object[]]$PlatformStatuses)

    $orderedPlatforms = @(Sort-PlatformStatuses -PlatformStatuses $PlatformStatuses)
    $selectedKeys = New-SelectedKeySet
    $message = ''

    while ($true) {
        Clear-PlatformSelectionHost
        Write-Host 'Select the platforms to reinstall'
        Write-Host 'Commands: type numbers or keys to toggle | "all" select all | "none" clear all'
        Write-Host 'Commands: press Enter to confirm | type "cancel" to cancel'
        Write-Host "Selected: $($selectedKeys.Count) | Total: $($orderedPlatforms.Count)"
        Write-Host ''

        for ($index = 0; $index -lt $orderedPlatforms.Count; $index++) {
            $platform = $orderedPlatforms[$index]
            $marker = if ($selectedKeys.Contains($platform.key)) { '[x]' } else { '[ ]' }
            $statusTag = Get-PlatformStatusTag -Status $platform.status
            Write-Host "[$($index + 1)] $marker $($platform.key) - $($platform.display_name) ($statusTag)"
        }

        if ($message) {
            Write-Host ''
            Write-Host $message -ForegroundColor Yellow
        }

        $answer = Read-Host 'Platform selection'
        $command = Parse-PlatformSelectionCommand -Answer $answer -PlatformStatuses $orderedPlatforms
        if ($null -eq $command) {
            $message = 'Invalid selection. Use numbers, platform keys, "all", "none", or "cancel".'
            continue
        }

        switch ($command.action) {
            'confirm' {
                if ($selectedKeys.Count -eq 0) {
                    $message = 'Select at least one platform to continue.'
                    continue
                }

                return @($orderedPlatforms | Where-Object { $selectedKeys.Contains($_.key) } | ForEach-Object { $_.key })
            }
            'cancel' {
                throw 'Platform selection cancelled by user.'
            }
            'select_all' {
                $selectedKeys.Clear()
                foreach ($platform in $orderedPlatforms) {
                    $selectedKeys.Add($platform.key) | Out-Null
                }
                $message = ''
                continue
            }
            'clear_selection' {
                $selectedKeys.Clear()
                $message = ''
                continue
            }
            'toggle' {
                foreach ($platformKey in @($command.keys)) {
                    if ($selectedKeys.Contains($platformKey)) {
                        $selectedKeys.Remove($platformKey) | Out-Null
                    } else {
                        $selectedKeys.Add($platformKey) | Out-Null
                    }
                }
                $message = ''
                continue
            }
        }
    }
}

function Resolve-SelectedPlatforms {
    param(
        [Parameter(Mandatory = $true)][object[]]$AllPlatforms,
        [string[]]$RequestedKeys,
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [switch]$SupportsPrompting,
        [switch]$SupportsRawMenu,
        [switch]$ShouldPrompt
    )

    if ($RequestedKeys -and $RequestedKeys.Count -gt 0) {
        return @($AllPlatforms | Where-Object { $_.key -in $RequestedKeys })
    }

    if (-not $ShouldPrompt -or -not $SupportsPrompting) {
        return $AllPlatforms
    }

    $platformStatuses = @(Sort-PlatformStatuses -PlatformStatuses @($AllPlatforms | ForEach-Object { Get-PlatformStatus -Platform $_ -TargetRoot $TargetRoot }))
    $selectedKeys = if ($SupportsRawMenu) {
        Invoke-PlatformSelectionMenu -PlatformStatuses $platformStatuses
    } else {
        Invoke-PlatformSelectionFallback -PlatformStatuses $platformStatuses
    }

    return @($AllPlatforms | Where-Object { $_.key -in $selectedKeys })
}

function Group-PlatformOutputs {
    param([Parameter(Mandatory = $true)][object[]]$Platforms)

    $map = @{}
    foreach ($platform in $Platforms) {
        foreach ($outputFile in (Get-ExpandedPlatformOutputs -Platform $platform)) {
            if (-not $map.ContainsKey($outputFile)) {
                $map[$outputFile] = [System.Collections.Generic.List[string]]::new()
            }

            if ($platform.display_name -notin $map[$outputFile]) {
                $map[$outputFile].Add($platform.display_name) | Out-Null
            }
        }
    }

    return $map
}

function New-InstallSnapshot {
    param(
        [Parameter(Mandatory = $true)][string]$SourceRoot,
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [Parameter(Mandatory = $true)][object[]]$SelectedPlatforms
    )

    $relativePaths = [System.Collections.Generic.List[string]]::new()

    foreach ($relativeFile in (Get-ManagedCoreRelativeFiles -SourceRoot $SourceRoot)) {
        if ($relativeFile -notin $relativePaths) {
            $relativePaths.Add($relativeFile) | Out-Null
        }
    }

    foreach ($relativeFile in (Get-PlatformBundleRelativeFiles -SourceRoot $SourceRoot -SelectedPlatforms $SelectedPlatforms)) {
        if ($relativeFile -notin $relativePaths) {
            $relativePaths.Add($relativeFile) | Out-Null
        }
    }

    foreach ($platform in $SelectedPlatforms) {
        foreach ($outputFile in (Get-ExpandedPlatformOutputs -Platform $platform)) {
            if ($outputFile -notin $relativePaths) {
                $relativePaths.Add($outputFile) | Out-Null
            }
        }
    }

    $existingPaths = @($relativePaths | Where-Object { Test-Path -LiteralPath (Join-Path $TargetRoot $_) -PathType Leaf })
    if ($existingPaths.Count -eq 0) {
        return $null
    }

    $timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH-mm-ss-fffffffZ')
    $snapshotRoot = Join-Path $TargetRoot ".Systematize/snapshots/install-$timestamp"
    New-DirectoryIfMissing -Path $snapshotRoot

    foreach ($relativePath in $existingPaths) {
        $sourcePath = Join-Path $TargetRoot $relativePath
        $snapshotPath = Join-Path $snapshotRoot $relativePath
        New-DirectoryIfMissing -Path (Split-Path -Parent $snapshotPath)
        Copy-Item -LiteralPath $sourcePath -Destination $snapshotPath -Force
    }

    Write-JsonUtf8 -Path (Join-Path $snapshotRoot 'manifest.json') -Data @{
        schema_version = 1
        created_at = (Get-Date).ToUniversalTime().ToString('o')
        files = $existingPaths
    }

    return $snapshotRoot
}

function Write-InstallState {
    param(
        [Parameter(Mandatory = $true)][string]$SourceRoot,
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [Parameter(Mandatory = $true)][object[]]$SelectedPlatforms,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [Parameter(Mandatory = $true)][hashtable]$Detection
    )

    $runtimeConfig = Get-SyskitConfig -RepoRoot $SourceRoot
    $installStatePath = Join-Path $TargetRoot $InstallStateRelativePath
    $managedOutputs = [System.Collections.Generic.List[string]]::new()

    foreach ($platform in $SelectedPlatforms) {
        foreach ($outputFile in (Get-ExpandedPlatformOutputs -Platform $platform)) {
            if ($outputFile -notin $managedOutputs) {
                $managedOutputs.Add($outputFile) | Out-Null
            }
        }
    }

    foreach ($relativeFile in (Get-PlatformBundleRelativeFiles -SourceRoot $SourceRoot -SelectedPlatforms $SelectedPlatforms)) {
        if ($relativeFile -notin $managedOutputs) {
            $managedOutputs.Add($relativeFile) | Out-Null
        }
    }

    $runtimeVersion = 'unknown'
    if ($runtimeConfig -and $runtimeConfig.ContainsKey('version')) {
        $runtimeVersion = $runtimeConfig.version
    }

    Write-JsonUtf8 -Path $installStatePath -Data @{
        schema_version = 1
        syskit_version = $runtimeVersion
        installed_at = (Get-Date).ToUniversalTime().ToString('o')
        install_mode = if ($Summary.reinstall_performed) { 'reinstall' } else { 'initial_install' }
        overwrite_mode = $Summary.overwrite_mode
        detection_mode = $Detection.mode
        selected_platforms = @($Summary.selected_platforms)
        managed_outputs = @($managedOutputs)
        created_paths = @($Summary.created_paths | ForEach-Object { [System.IO.Path]::GetRelativePath($TargetRoot, $_) })
        overwritten_paths = @($Summary.overwritten_paths | ForEach-Object { [System.IO.Path]::GetRelativePath($TargetRoot, $_) })
        snapshot_path = if ($Summary.snapshot_path) { [System.IO.Path]::GetRelativePath($TargetRoot, $Summary.snapshot_path) } else { $null }
    }
}

function New-Summary {
    param(
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [Parameter(Mandatory = $true)][hashtable]$Detection
    )

    return [ordered]@{
        target_root = $TargetRoot
        installation_detected = $Detection.detected
        detection_mode = $Detection.mode
        reinstall_performed = $false
        overwrite_mode = 'initial_install'
        selected_platforms = [System.Collections.Generic.List[string]]::new()
        written = [System.Collections.Generic.List[string]]::new()
        skipped = [System.Collections.Generic.List[string]]::new()
        created_paths = [System.Collections.Generic.List[string]]::new()
        overwritten_paths = [System.Collections.Generic.List[string]]::new()
        created_count = 0
        overwritten_count = 0
        snapshot_path = $null
        install_state_path = (Join-Path $TargetRoot $InstallStateRelativePath)
        cancelled = $false
    }
}

function Write-Summary {
    param([Parameter(Mandatory = $true)][hashtable]$Summary)

    Write-Output "Initialized Systematize KIT in: $($Summary.target_root)"
    Write-Output "Reinstall: $(if ($Summary.reinstall_performed) { 'yes' } else { 'no' })"
    Write-Output "Platforms selected: $(@($Summary.selected_platforms).Count)"
    Write-Output "Created: $($Summary.created_count) | Overwritten: $($Summary.overwritten_count) | Skipped: $($Summary.skipped.Count)"
    if ($Summary.snapshot_path) {
        Write-Output "Snapshot: $($Summary.snapshot_path)"
    }
    if ($Summary.cancelled) {
        Write-Output 'Installation cancelled by user.'
    }
}

if ($Help) {
    Write-Output @"
Usage: init-syskit.ps1 [OPTIONS]

OPTIONS:
  -TargetPath <path>   Target repository path (default: current location)
  -Platforms <list>    Comma-separated platform keys to initialize
  -Force               Bypass reinstall warning and rewrite managed files
  -Json                Output JSON summary
  -Help                Show this help message
"@
    exit 0
}

$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$targetRoot = [System.IO.Path]::GetFullPath($TargetPath)
$projectName = Split-Path $targetRoot -Leaf
$catalogPath = Join-Path $sourceRoot '.Systematize/config/platform-catalog.json'

if (-not (Test-Path -LiteralPath $catalogPath -PathType Leaf)) {
    Write-Error "Platform catalog not found: $catalogPath"
    exit 1
}

$catalog = Get-Content -LiteralPath $catalogPath -Raw -Encoding utf8 | ConvertFrom-Json
$allPlatforms = @($catalog.platforms)
$requestedKeys = if ($Platforms) {
    @($Platforms -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
} else {
    $null
}

if ($requestedKeys) {
    $unknownKeys = @($requestedKeys | Where-Object { $_ -notin @($allPlatforms | ForEach-Object { $_.key }) })
    if ($unknownKeys.Count -gt 0) {
        Write-Error "Unknown platform keys: $($unknownKeys -join ', ')"
        exit 1
    }
}

$detection = Get-InstallDetection -TargetRoot $targetRoot
$summary = New-Summary -TargetRoot $targetRoot -Detection $detection
$supportsPrompting = Test-InteractiveSession -JsonMode:$Json
$supportsRawMenu = Test-RawPlatformSelectionSupport -JsonMode:$Json
$reinstallDecision = Resolve-ReinstallDecision -Detection $detection -ForceWrite:$Force -Interactive:$supportsPrompting

$summary.reinstall_performed = $reinstallDecision.reinstall_performed
$summary.overwrite_mode = $reinstallDecision.overwrite_mode

if (-not $reinstallDecision.approved) {
    $summary.cancelled = $true
    if ($Json) {
        $summary | ConvertTo-Json -Depth 10
    } else {
        Write-Summary -Summary $summary
    }
    exit 0
}

try {
    $selectedPlatforms = @(Resolve-SelectedPlatforms -AllPlatforms $allPlatforms -RequestedKeys $requestedKeys -TargetRoot $targetRoot -SupportsPrompting:$supportsPrompting -SupportsRawMenu:$supportsRawMenu -ShouldPrompt:$detection.detected)
} catch {
    if ($_.Exception.Message -eq 'Platform selection cancelled by user.') {
        $summary.cancelled = $true
        if ($Json) {
            $summary | ConvertTo-Json -Depth 10
        } else {
            Write-Summary -Summary $summary
        }
        exit 0
    }

    throw
}

foreach ($platform in $selectedPlatforms) {
    $summary.selected_platforms.Add($platform.key) | Out-Null
}

if ($detection.detected -and $reinstallDecision.reinstall_performed) {
    $summary.snapshot_path = New-InstallSnapshot -SourceRoot $sourceRoot -TargetRoot $targetRoot -SelectedPlatforms $selectedPlatforms
}

$effectiveForce = $Force -or $reinstallDecision.reinstall_performed

New-DirectoryIfMissing -Path $targetRoot

Copy-ManagedTree -SourceDir (Join-Path $sourceRoot 'commands') -TargetDir (Join-Path $targetRoot 'commands') -Summary $summary -ForceWrite:$effectiveForce
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/config') -TargetDir (Join-Path $targetRoot '.Systematize/config') -Summary $summary -ForceWrite:$effectiveForce
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/templates') -TargetDir (Join-Path $targetRoot '.Systematize/templates') -Summary $summary -ForceWrite:$effectiveForce
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/scripts') -TargetDir (Join-Path $targetRoot '.Systematize/scripts') -Summary $summary -ForceWrite:$effectiveForce
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/presets') -TargetDir (Join-Path $targetRoot '.Systematize/presets') -Summary $summary -ForceWrite:$effectiveForce
Copy-PlatformBundles -SourceRoot $sourceRoot -TargetRoot $targetRoot -SelectedPlatforms $selectedPlatforms -Summary $summary -ForceWrite:$effectiveForce

$extensionsReadme = Join-Path $sourceRoot '.Systematize/extensions/README.md'
if (Test-Path -LiteralPath $extensionsReadme -PathType Leaf) {
    Write-ManagedFile -Path (Join-Path $targetRoot '.Systematize/extensions/README.md') -Content (Get-Content -LiteralPath $extensionsReadme -Raw -Encoding utf8) -Summary $summary -ForceWrite:$effectiveForce
}

Initialize-Directories -TargetRoot $targetRoot
Initialize-Extensions -TargetRoot $targetRoot -Summary $summary -ForceWrite:$effectiveForce
Initialize-Memory -SourceRoot $sourceRoot -TargetRoot $targetRoot -ProjectName $projectName -Summary $summary -ForceWrite:$effectiveForce

$templatePath = Join-Path $sourceRoot '.Systematize/templates/agent-file-template.md'
$templateContent = if (Test-Path -LiteralPath $templatePath -PathType Leaf) {
    Get-Content -LiteralPath $templatePath -Raw -Encoding utf8
} else {
@"
# [PROJECT NAME] Development Guidelines

Auto-generated from all feature plans. Last updated: [DATE]

## Active Technologies

[EXTRACTED FROM ALL PLAN.MD FILES]

## Project Structure

```text
[ACTUAL STRUCTURE FROM PLANS]
```

## Commands

[ONLY COMMANDS FOR ACTIVE TECHNOLOGIES]

## Code Style

[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]

## Recent Changes

[LAST 3 FEATURES AND WHAT THEY ADDED]

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
"@
}

$groupedOutputs = Group-PlatformOutputs -Platforms $selectedPlatforms
$dateText = (Get-Date).ToString('yyyy-MM-dd')

foreach ($relativePath in $groupedOutputs.Keys) {
    $absolutePath = Join-Path $targetRoot $relativePath

    if ($relativePath -eq '.gitignore') {
        Add-GitIgnoreBlock -Path $absolutePath -Summary $summary -ForceWrite:$effectiveForce
        continue
    }

    if ($relativePath -eq '.vscode/tasks.json') {
        Write-ManagedFile -Path $absolutePath -Content (New-VSCodeTasksJson) -Summary $summary -ForceWrite:$effectiveForce
        continue
    }

    if ($relativePath -eq '.vscode/settings.json') {
        Write-ManagedFile -Path $absolutePath -Content (New-VSCodeSettingsJson) -Summary $summary -ForceWrite:$effectiveForce
        continue
    }

    if ($relativePath -eq '.vscode/extensions.json') {
        Write-ManagedFile -Path $absolutePath -Content (New-VSCodeExtensionsJson) -Summary $summary -ForceWrite:$effectiveForce
        continue
    }

    $markdownContent = New-AgentGuidance -TemplateContent $templateContent -ProjectName $projectName -SupportedPlatforms $groupedOutputs[$relativePath].ToArray() -DateText $dateText
    $content = if ($absolutePath.EndsWith('.mdc')) { New-MdcGuidance -MarkdownContent $markdownContent } else { $markdownContent }
    Assert-NoRuntimePlaceholders -Content $content -TargetPath $absolutePath
    Write-ManagedFile -Path $absolutePath -Content $content -Summary $summary -ForceWrite:$effectiveForce
}

$summary.created_count = $summary.created_paths.Count
$summary.overwritten_count = $summary.overwritten_paths.Count

Write-InstallState -SourceRoot $sourceRoot -TargetRoot $targetRoot -SelectedPlatforms $selectedPlatforms -Summary $summary -Detection $detection

if ($Json) {
    $summary | ConvertTo-Json -Depth 10
} else {
    Write-Summary -Summary $summary
}
