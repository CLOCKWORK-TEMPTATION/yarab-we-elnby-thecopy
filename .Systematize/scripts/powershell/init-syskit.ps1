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

# Load common functions
. "$PSScriptRoot/common.ps1"

# Use ensureDir from common.ps1 if available, otherwise define New-DirectoryIfMissing
function New-DirectoryIfMissing {
    param([Parameter(Mandatory = $true)][string]$Path)
    Ensure-Dir -Path $Path
}

function Write-ManagedFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Content,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    if ((Test-Path $Path) -and -not $ForceWrite) {
        $Summary.skipped.Add($Path)
        return
    }

    $parent = Split-Path -Parent $Path
    if ($parent) {
        New-DirectoryIfMissing -Path $parent
    }

    Set-Content -LiteralPath $Path -Value $Content -Encoding utf8
    $Summary.written.Add($Path)
}

function Copy-ManagedTree {
    param(
        [Parameter(Mandatory = $true)][string]$SourceDir,
        [Parameter(Mandatory = $true)][string]$TargetDir,
        [Parameter(Mandatory = $true)][hashtable]$Summary,
        [switch]$ForceWrite
    )

    if (-not (Test-Path $SourceDir)) {
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

        if ((Test-Path $targetPath) -and -not $ForceWrite) {
            $Summary.skipped.Add($targetPath)
            continue
        }

        New-DirectoryIfMissing -Path (Split-Path -Parent $targetPath)
        Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
        $Summary.written.Add($targetPath)
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

    if (-not (Test-Path $Path)) {
        Write-ManagedFile -Path $Path -Content $block -Summary $Summary -ForceWrite:$ForceWrite
        return
    }

    $current = Get-Content -LiteralPath $Path -Raw -Encoding utf8
    if ($current -match [regex]::Escape('# Systematize KIT')) {
        $Summary.skipped.Add($Path)
        return
    }

    $next = ($current.TrimEnd() + "`n`n" + $block)
    Set-Content -LiteralPath $Path -Value $next -Encoding utf8
    $Summary.written.Add($Path)
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
        $lines.Add($line)
    }
    $lines.Insert(3, '')
    $lines.Insert(3, "Supported platforms: $($SupportedPlatforms -join ', ')")
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
    if (Test-Path $constitutionTemplatePath) {
        $constitutionContent = Get-Content -LiteralPath $constitutionTemplatePath -Raw -Encoding utf8
    } else {
        $constitutionContent = '# دستور المشروع [PROJECT_NAME]'
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

function Group-PlatformOutputs {
    param([Parameter(Mandatory = $true)][object[]]$Platforms)

    $map = @{}
    foreach ($platform in $Platforms) {
        foreach ($outputFile in $platform.output_files) {
            if (-not $map.ContainsKey($outputFile)) {
                $map[$outputFile] = [System.Collections.Generic.List[string]]::new()
            }
            $map[$outputFile].Add($platform.display_name)
        }
    }
    return $map
}

if ($Help) {
    Write-Output @"
Usage: init-syskit.ps1 [OPTIONS]

OPTIONS:
  -TargetPath <path>   Target repository path (default: current location)
  -Platforms <list>    Comma-separated platform keys to initialize (default: all)
  -Force               Overwrite existing managed files
  -Json                Output JSON summary
  -Help                Show this help message
"@
    exit 0
}

$sourceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$targetRoot = [System.IO.Path]::GetFullPath($TargetPath)
$projectName = Split-Path $targetRoot -Leaf
$catalogPath = Join-Path $sourceRoot '.Systematize/config/platform-catalog.json'

if (-not (Test-Path $catalogPath)) {
    Write-Error "Platform catalog not found: $catalogPath"
    exit 1
}

$catalog = Get-Content -LiteralPath $catalogPath -Raw -Encoding utf8 | ConvertFrom-Json
$allPlatforms = @($catalog.platforms)

if ($Platforms) {
    $requestedKeys = @($Platforms -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
} else {
    $requestedKeys = @($allPlatforms | ForEach-Object { $_.key })
}

$allKeys = @($allPlatforms | ForEach-Object { $_.key })
$unknownKeys = @($requestedKeys | Where-Object { $_ -notin $allKeys })
if ($unknownKeys.Count -gt 0) {
    Write-Error "Unknown platform keys: $($unknownKeys -join ', ')"
    exit 1
}

$selectedPlatforms = @($allPlatforms | Where-Object { $_.key -in $requestedKeys })
$summary = @{
    target_root = $targetRoot
    written = [System.Collections.Generic.List[string]]::new()
    skipped = [System.Collections.Generic.List[string]]::new()
    platforms = [System.Collections.Generic.List[string]]::new()
}

$selectedPlatforms | ForEach-Object { $summary.platforms.Add($_.key) }

New-DirectoryIfMissing -Path $targetRoot

Copy-ManagedTree -SourceDir (Join-Path $sourceRoot 'commands') -TargetDir (Join-Path $targetRoot 'commands') -Summary $summary -ForceWrite:$Force
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/config') -TargetDir (Join-Path $targetRoot '.Systematize/config') -Summary $summary -ForceWrite:$Force
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/templates') -TargetDir (Join-Path $targetRoot '.Systematize/templates') -Summary $summary -ForceWrite:$Force
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/scripts') -TargetDir (Join-Path $targetRoot '.Systematize/scripts') -Summary $summary -ForceWrite:$Force
Copy-ManagedTree -SourceDir (Join-Path $sourceRoot '.Systematize/presets') -TargetDir (Join-Path $targetRoot '.Systematize/presets') -Summary $summary -ForceWrite:$Force

$extensionsReadme = Join-Path $sourceRoot '.Systematize/extensions/README.md'
if (Test-Path $extensionsReadme) {
    Write-ManagedFile -Path (Join-Path $targetRoot '.Systematize/extensions/README.md') -Content (Get-Content -LiteralPath $extensionsReadme -Raw -Encoding utf8) -Summary $summary -ForceWrite:$Force
}

Initialize-Directories -TargetRoot $targetRoot
Initialize-Extensions -TargetRoot $targetRoot -Summary $summary -ForceWrite:$Force
Initialize-Memory -SourceRoot $sourceRoot -TargetRoot $targetRoot -ProjectName $projectName -Summary $summary -ForceWrite:$Force

$templatePath = Join-Path $sourceRoot '.Systematize/templates/agent-file-template.md'
if (Test-Path $templatePath) {
    $templateContent = Get-Content -LiteralPath $templatePath -Raw -Encoding utf8
} else {
    $templateContent = @"
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
        Add-GitIgnoreBlock -Path $absolutePath -Summary $summary -ForceWrite:$Force
        continue
    }

    if ($relativePath -eq '.vscode/tasks.json') {
        Write-ManagedFile -Path $absolutePath -Content (New-VSCodeTasksJson) -Summary $summary -ForceWrite:$Force
        continue
    }

    if ($relativePath -eq '.vscode/settings.json') {
        Write-ManagedFile -Path $absolutePath -Content (New-VSCodeSettingsJson) -Summary $summary -ForceWrite:$Force
        continue
    }

    if ($relativePath -eq '.vscode/extensions.json') {
        Write-ManagedFile -Path $absolutePath -Content (New-VSCodeExtensionsJson) -Summary $summary -ForceWrite:$Force
        continue
    }

    $markdownContent = New-AgentGuidance -TemplateContent $templateContent -ProjectName $projectName -SupportedPlatforms $groupedOutputs[$relativePath].ToArray() -DateText $dateText
    $content = if ($absolutePath.EndsWith('.mdc')) { New-MdcGuidance -MarkdownContent $markdownContent } else { $markdownContent }
    Write-ManagedFile -Path $absolutePath -Content $content -Summary $summary -ForceWrite:$Force
}

if ($Json) {
    $summary | ConvertTo-Json -Depth 6
} else {
    Write-Output "Initialized Systematize KIT in: $targetRoot"
    Write-Output "Platforms: $($summary.platforms -join ', ')"
    Write-Output "Written: $($summary.written.Count)"
    Write-Output "Skipped: $($summary.skipped.Count)"
}
