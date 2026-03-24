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

function Test-AffirmativeAnswer {
    param([string]$Answer)

    $normalized = ($Answer ?? '').Trim().ToLowerInvariant()
    return $normalized -in @('y', 'yes', 'true', '1', 'ok', 'okay', 'نعم', 'ايوه', 'أيوه', 'اه', 'موافق')
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

    $answer = Read-Host 'تم اكتشاف أن Systematize KIT مثبتة مسبقًا. إعادة التثبيت ستنشئ نسخة احتياطية ثم تعيد كتابة الملفات المُدارة للمنصات التي ستختارها. هل تريد المتابعة؟ [y/N]'
    $approved = Test-AffirmativeAnswer -Answer $answer

    return [ordered]@{
        approved = $approved
        reinstall_performed = $approved
        overwrite_mode = if ($approved) { 'confirmed' } else { 'cancelled' }
    }
}

function Parse-PlatformSelectionAnswer {
    param(
        [string]$Answer,
        [Parameter(Mandatory = $true)][object[]]$PlatformStatuses
    )

    $trimmed = ($Answer ?? '').Trim()
    if (-not $trimmed -or $trimmed.ToLowerInvariant() -in @('all', '*', 'الكل', 'كلها')) {
        return @($PlatformStatuses | ForEach-Object { $_.key })
    }

    $selectedKeys = [System.Collections.Generic.List[string]]::new()
    $availableKeys = @($PlatformStatuses | ForEach-Object { $_.key })
    $indexMap = @{}

    for ($index = 0; $index -lt $PlatformStatuses.Count; $index++) {
        $indexMap[[string]($index + 1)] = $PlatformStatuses[$index].key
    }

    foreach ($token in @($trimmed -split '[,\s]+' | Where-Object { $_ })) {
        if ($indexMap.ContainsKey($token)) {
            $selectedKeys.Add($indexMap[$token]) | Out-Null
            continue
        }

        if ($token -in $availableKeys) {
            $selectedKeys.Add($token) | Out-Null
            continue
        }

        return $null
    }

    if ($selectedKeys.Count -eq 0) {
        return $null
    }

    return @($PlatformStatuses | Where-Object { $_.key -in $selectedKeys } | ForEach-Object { $_.key })
}

function Resolve-SelectedPlatforms {
    param(
        [Parameter(Mandatory = $true)][object[]]$AllPlatforms,
        [string[]]$RequestedKeys,
        [Parameter(Mandatory = $true)][string]$TargetRoot,
        [switch]$Interactive,
        [switch]$ShouldPrompt
    )

    if ($RequestedKeys -and $RequestedKeys.Count -gt 0) {
        return @($AllPlatforms | Where-Object { $_.key -in $RequestedKeys })
    }

    if (-not $ShouldPrompt -or -not $Interactive) {
        return $AllPlatforms
    }

    $platformStatuses = @($AllPlatforms | ForEach-Object { Get-PlatformStatus -Platform $_ -TargetRoot $TargetRoot })

    Write-Host 'اختر المنصات التي تريد أن تعيد المنظومة إنشاء ملفاتها ومجلداتها الآن:'
    for ($index = 0; $index -lt $platformStatuses.Count; $index++) {
        $platform = $platformStatuses[$index]
        Write-Host "[$($index + 1)] $($platform.key) - $($platform.display_name) - الحالة: $($platform.status)"
        Write-Host "    المخرجات: $($platform.managed_outputs -join ', ')"
    }
    Write-Host 'اضغط Enter لاختيار كل المنصات، أو اكتب الأرقام أو المفاتيح مفصولة بفواصل.'

    while ($true) {
        $answer = Read-Host 'اختيار المنصات'
        $selectedKeys = Parse-PlatformSelectionAnswer -Answer $answer -PlatformStatuses $platformStatuses
        if ($null -ne $selectedKeys) {
            return @($AllPlatforms | Where-Object { $_.key -in $selectedKeys })
        }

        Write-Host 'الاختيار غير صالح. استخدم أرقام القائمة أو مفاتيح المنصات كما هي.'
    }
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
    Write-Output "Installation detected: $(if ($Summary.installation_detected) { 'yes' } else { 'no' })"
    Write-Output "Reinstall performed: $(if ($Summary.reinstall_performed) { 'yes' } else { 'no' })"
    Write-Output "Overwrite mode: $($Summary.overwrite_mode)"
    Write-Output "Selected platforms: $(@($Summary.selected_platforms) -join ', ')"
    Write-Output "Created: $($Summary.created_count)"
    Write-Output "Overwritten: $($Summary.overwritten_count)"
    Write-Output "Skipped: $($Summary.skipped.Count)"
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
$interactive = Test-InteractiveSession -JsonMode:$Json
$reinstallDecision = Resolve-ReinstallDecision -Detection $detection -ForceWrite:$Force -Interactive:$interactive

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

$selectedPlatforms = @(Resolve-SelectedPlatforms -AllPlatforms $allPlatforms -RequestedKeys $requestedKeys -TargetRoot $targetRoot -Interactive:$interactive -ShouldPrompt:$detection.detected)
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
