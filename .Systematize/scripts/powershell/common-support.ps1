function Get-SyskitConfig {
    # يقرأ ملف التكوين العام syskit-config.yml
    param([string]$RepoRoot = (Get-RepoRoot))
    $configPath = Join-Path $RepoRoot '.Systematize/config/syskit-config.yml'
    if (-not (Test-Path $configPath)) { return $null }
    $config = @{}
    Get-Content $configPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line -match '^([^:]+):\s*(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            if ($val -eq 'true')  { $val = $true }
            elseif ($val -eq 'false') { $val = $false }
            elseif ($val -eq 'null')  { $val = $null }
            elseif ($val -match '^\d+$') { $val = [int]$val }
            $config[$key] = $val
        }
    }
    return $config
}

function Ensure-Dir {
    param([Parameter(Mandatory=$true)][string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Find-UnresolvedPlaceholders {
    param([Parameter(Mandatory=$true)][string]$Content)
    return ([regex]::Matches($Content, '\[[A-Z_]{3,}(?::[^\]]+)?\]') | ForEach-Object { $_.Value } | Sort-Object -Unique)
}
