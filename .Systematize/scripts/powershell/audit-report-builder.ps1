function Build-AuditReport {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$InputObject
    )

    $sectionOrder = @(
        @{ key = 'packageToolchain'; title = 'package.json and toolchain' },
        @{ key = 'automatedChecks'; title = 'automated checks' },
        @{ key = 'devVsProduction'; title = 'dev vs production boundaries' },
        @{ key = 'serverApi'; title = 'server and API' },
        @{ key = 'sharedLogic'; title = 'shared logic' },
        @{ key = 'frontend'; title = 'frontend' },
        @{ key = 'frontendBackendIntegration'; title = 'frontend-backend integration' },
        @{ key = 'security'; title = 'security' },
        @{ key = 'performanceAndProductionReadiness'; title = 'performance and production readiness' }
    )

    $severityWeight = @{
        'حرج' = 4
        'عالٍ' = 3
        'متوسط' = 2
        'منخفض' = 1
    }

    $actionTitles = @(
        'المرحلة 1: إيقاف النزيف',
        'المرحلة 2: تثبيت العقود وحدود الطبقات',
        'المرحلة 3: تنظيف المنطق المشترك',
        'المرحلة 4: ضبط الواجهة والتكامل',
        'المرحلة 5: رفع الجاهزية الإنتاجية'
    )

    $clean = {
        param($Value)
        if ($null -eq $Value) { return '' }
        return ([string]$Value).Trim()
    }

    $escapeCell = {
        param($Value)
        $text = & $clean $Value
        if ([string]::IsNullOrWhiteSpace($text)) { return '—' }
        return $text.Replace('|', '\|')
    }

    $normalizeFindingList = {
        param($Records)
        $safeRecords = @()
        if ($null -ne $Records) {
            foreach ($record in $Records) {
                $safeRecords += $record
            }
        }
        if ($safeRecords.Count -eq 0) {
            return @()
        }
        $merged = Merge-FindingRecords -Records $safeRecords
        return @($merged | Sort-Object @{ Expression = { $severityWeight[$_.severity] } ; Descending = $true }, @{ Expression = { $_.findingId } ; Descending = $false })
    }

    $findingsBySection = if ($InputObject.findingsBySection) { $InputObject.findingsBySection } else { @{} }
    $allFindings = New-Object System.Collections.Generic.List[object]
    foreach ($section in $sectionOrder) {
        foreach ($record in @($findingsBySection[$section.key])) {
            $allFindings.Add($record) | Out-Null
        }
    }

    $allMergedFindings = @(& $normalizeFindingList $allFindings)

    $confidenceInput = if ($InputObject.confidenceStatement) {
        $InputObject.confidenceStatement
    } else {
        @{
            CheckResults = $InputObject.checkResults
            Targets = $InputObject.targets
            EnvironmentBlockers = $InputObject.environmentBlockers
            ManualConstraints = $InputObject.manualConstraints
        }
    }

    $confidenceStatement = if ($confidenceInput.reviewMode -and $confidenceInput.confidenceLevel) {
        $confidenceInput
    } else {
        Get-ConfidenceStatement @confidenceInput
    }

    $topFiveIssues = if ($InputObject.topFiveIssues) {
        @(& $normalizeFindingList $InputObject.topFiveIssues | Select-Object -First 5)
    } else {
        @($allMergedFindings | Select-Object -First 5)
    }

    $criticalIssues = if ($InputObject.criticalIssues) {
        @(& $normalizeFindingList $InputObject.criticalIssues)
    } else {
        @($allMergedFindings | Where-Object { $_.severity -in @('حرج', 'عالٍ') })
    }

    $generalState = & $clean $InputObject.generalState
    if (-not $generalState) {
        if ($allMergedFindings | Where-Object { $_.severity -eq 'حرج' } | Select-Object -First 1) {
            $generalState = 'Confirmed critical issues exist across core audit layers.'
        } elseif ($allMergedFindings | Where-Object { $_.severity -eq 'عالٍ' } | Select-Object -First 1) {
            $generalState = 'The workspace remains unstable for new development until high-severity findings are resolved.'
        } else {
            $generalState = 'No blocking engineering finding was confirmed in the scoped targets.'
        }
    }

    $executiveJudgment = & $clean $InputObject.executiveJudgment
    if (-not $executiveJudgment) {
        if ($allMergedFindings | Where-Object { $_.severity -eq 'حرج' } | Select-Object -First 1) {
            $executiveJudgment = 'غير مستقر ويحتاج تثبيت فوري'
        } elseif ($allMergedFindings | Where-Object { $_.severity -eq 'عالٍ' } | Select-Object -First 1) {
            $executiveJudgment = 'يحتاج إصلاحات قبل تطوير جديد'
        } else {
            $executiveJudgment = 'صالح للاستمرار كما هو'
        }
    }

    $formatPriorityItems = {
        param([object[]]$Items, [string]$Fallback)
        if (-not $Items -or $Items.Count -eq 0) { return @($Fallback) }

        $result = foreach ($item in $Items) {
            if ($item -is [string]) {
                ([string]$item).Trim()
            } elseif ($item -is [pscustomobject]) {
                "$($item.findingId) — $(if ($item.problem) { $item.problem } else { 'Unspecified item' })"
            }
        }

        return @($result | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    }

    $priorityMap = if ($InputObject.repairPriorityMap) { $InputObject.repairPriorityMap } else { @{} }
    $immediate = & $formatPriorityItems $priorityMap.immediate 'No immediate blocking fix is currently recorded.'
    $beforeNewFeatures = & $formatPriorityItems $priorityMap.beforeNewFeatures 'No pre-feature fix is currently recorded.'
    $deferrable = & $formatPriorityItems $priorityMap.deferrable 'No deferrable item is currently recorded.'
    $optionalImprovements = & $formatPriorityItems $priorityMap.optionalImprovements 'No optional improvement is currently recorded.'

    $defaultActionPlan = @(
        [PSCustomObject]@{
            title = $actionTitles[0]
            goal = 'Stop any confirmed blocker from spreading across additional targets.'
            scope = 'Critical and high-severity findings that currently affect execution.'
            requiredChanges = ($immediate -join ' | ')
            successCriteria = 'No critical issue remains untriaged.'
        },
        [PSCustomObject]@{
            title = $actionTitles[1]
            goal = 'Restore stable contracts and clear layer ownership.'
            scope = 'Coverage rules, report contracts, and scope boundaries.'
            requiredChanges = ($beforeNewFeatures -join ' | ')
            successCriteria = 'Contracts and layer boundaries are stable and reviewable.'
        },
        [PSCustomObject]@{
            title = $actionTitles[2]
            goal = 'Normalize shared logic and remove duplicated root causes.'
            scope = 'Merged findings, shared utilities, and reusable policy rules.'
            requiredChanges = ($deferrable -join ' | ')
            successCriteria = 'Repeated root causes are represented once with linked evidence.'
        },
        [PSCustomObject]@{
            title = $actionTitles[3]
            goal = 'Repair interface and integration assumptions without widening scope.'
            scope = 'Frontend, backend, and cross-layer integration findings.'
            requiredChanges = ($beforeNewFeatures -join ' | ')
            successCriteria = 'Cross-layer contracts are consistent and testable.'
        },
        [PSCustomObject]@{
            title = $actionTitles[4]
            goal = 'Raise production readiness and confidence reporting quality.'
            scope = 'Security, performance, production readiness, and observability notes.'
            requiredChanges = ($optionalImprovements -join ' | ')
            successCriteria = 'The final report can support a go/no-go decision without hidden gaps.'
        }
    )

    $actionPlan = if ($InputObject.actionPlan) { @($InputObject.actionPlan) } else { $defaultActionPlan }
    if ($actionPlan.Count -ne $actionTitles.Count) {
        throw "Action plan must contain exactly $($actionTitles.Count) phases."
    }

    $buildLayerSection = {
        param([string]$Title, [object[]]$Records)

        if ($Records.Count -eq 0) {
            return @("### $Title", '', '- No confirmed finding.') -join "`n"
        }

        $lines = @("### $Title", '')
        foreach ($record in $Records) {
            $lines += "- **$($record.findingId)** | $($record.severity) | $($record.type) | $($record.location) | $($record.problem) | $($record.impact) | $($record.fix)"
        }

        return $lines -join "`n"
    }

    $reportLines = @(
        "# Executive Audit Report: $(if (& $clean $InputObject.featureName) { (& $clean $InputObject.featureName) } else { 'Unnamed Feature' })"
        ''
        "**Branch**: ``$(if (& $clean $InputObject.branch) { (& $clean $InputObject.branch) } else { 'unknown-branch' })``"
        "**Date**: $(if (& $clean $InputObject.date) { (& $clean $InputObject.date) } else { (Get-Date).ToString('yyyy-MM-dd') })"
        "**Reviewer**: $(if (& $clean $InputObject.reviewer) { (& $clean $InputObject.reviewer) } else { 'AI Review' })"
        "**Review Mode**: $($confidenceStatement.reviewMode)"
        "**Confidence Level**: $($confidenceStatement.confidenceLevel)"
        ''
        '---'
        ''
        '## Executive Summary'
        ''
        "- **General State**: $generalState"
        '- **Top Five Issues**:'
    )

    if ($topFiveIssues.Count -gt 0) {
        for ($index = 0; $index -lt $topFiveIssues.Count; $index++) {
            $reportLines += "  $($index + 1). $($topFiveIssues[$index].findingId) — $($topFiveIssues[$index].problem) ($($topFiveIssues[$index].layer))"
        }
    } else {
        $reportLines += '  1. No confirmed issue entered the top-five list.'
    }

    $reportLines += @(
        "- **Executive Judgment**: $executiveJudgment"
        ''
        '---'
        ''
        '## Critical Issues Table'
        ''
        '| ID | Severity | Type | Layer | Location | Description | Impact | Fix |'
        '|----|----------|------|-------|----------|-------------|--------|-----|'
    )

    if ($criticalIssues.Count -eq 0) {
        $criticalIssues = @([PSCustomObject]@{
            findingId = 'NONE'
            severity = 'منخفض'
            type = 'تحسين مقترح'
            layer = 'toolchain'
            location = 'N/A'
            problem = 'No confirmed critical issue.'
            impact = 'Continue monitoring.'
            fix = 'No immediate fix required.'
        })
    }

    foreach ($issue in $criticalIssues) {
        $reportLines += "| $(& $escapeCell $issue.findingId) | $(& $escapeCell $issue.severity) | $(& $escapeCell $issue.type) | $(& $escapeCell $issue.layer) | $(& $escapeCell $issue.location) | $(& $escapeCell $issue.problem) | $(& $escapeCell $issue.impact) | $(& $escapeCell $issue.fix) |"
    }

    $reportLines += @('', '---', '', '## Layer-by-Layer Findings', '')

    foreach ($section in $sectionOrder) {
        $reportLines += (& $buildLayerSection $section.title (& $normalizeFindingList $findingsBySection[$section.key]))
        $reportLines += ''
    }

    $reportLines += @(
        '---'
        ''
        (Build-ConfidenceCoverageSection -InputObject $confidenceStatement)
        ''
        '---'
        ''
        '## Repair Priority Map'
        ''
        '### يجب إصلاحه فورًا'
        ''
    )

    foreach ($item in $immediate) { $reportLines += "- $item" }
    $reportLines += @('', '### يجب إصلاحه قبل أي ميزة جديدة', '')
    foreach ($item in $beforeNewFeatures) { $reportLines += "- $item" }
    $reportLines += @('', '### يمكن تأجيله', '')
    foreach ($item in $deferrable) { $reportLines += "- $item" }
    $reportLines += @('', '### تحسينات اختيارية', '')
    foreach ($item in $optionalImprovements) { $reportLines += "- $item" }

    $reportLines += @('', '---', '', '## Action Plan', '')
    for ($index = 0; $index -lt $actionPlan.Count; $index++) {
        $phase = $actionPlan[$index]
        $title = if (& $clean $phase.title) { (& $clean $phase.title) } else { $actionTitles[$index] }
        $reportLines += @(
            "### $title"
            ''
            "- **الهدف**: $(if (& $clean $phase.goal) { (& $clean $phase.goal) } else { 'Goal not provided.' })"
            "- **النطاق**: $(if (& $clean $phase.scope) { (& $clean $phase.scope) } else { 'Scope not provided.' })"
            "- **التغييرات المطلوبة**: $(if (& $clean $phase.requiredChanges) { (& $clean $phase.requiredChanges) } else { 'Required changes not provided.' })"
            "- **معيار النجاح**: $(if (& $clean $phase.successCriteria) { (& $clean $phase.successCriteria) } else { 'Success criteria not provided.' })"
            ''
        )
    }

    return (($reportLines -join "`n").TrimEnd() + "`n")
}
