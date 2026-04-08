# BOS KPI Importer – Windows Task Scheduler Setup
# Run this script ONCE as Administrator to register the scheduled task.
#
# Usage:
#   Right-click PowerShell → "Run as Administrator"
#   .\scheduler\setup-task.ps1

# ─── CONFIGURE THIS PATH ─────────────────────────────────────────────────────
$ProjectRoot = "C:\Users\Andre\Documents\Claude\Projects\MCP Dashboard Test"
# ─────────────────────────────────────────────────────────────────────────────

$BatchFile = "$ProjectRoot\scheduler\run-importer.bat"
$LogDir    = "$ProjectRoot\importer\logs"

# Validate the batch file exists
if (-not (Test-Path $BatchFile)) {
    Write-Error "Batch file not found: $BatchFile"
    Write-Error "Make sure the project is at the correct path and try again."
    exit 1
}

# Create log directory if missing
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
    Write-Host "Created log directory: $LogDir"
}

# Build task components
$Action = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$BatchFile`""

# Repeat every 15 minutes, starting now, running indefinitely
$Trigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 15) `
    -RepetitionDuration ([System.TimeSpan]::MaxValue)

$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -RestartCount 2 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

# Register (or overwrite existing) task
Register-ScheduledTask `
    -TaskName   "BOS-KPI-Importer" `
    -TaskPath   "\BOS\" `
    -Action     $Action `
    -Trigger    $Trigger `
    -Settings   $Settings `
    -RunLevel   Highest `
    -Force | Out-Null

Write-Host ""
Write-Host "Task registered successfully!" -ForegroundColor Green
Write-Host "  Name:     \BOS\BOS-KPI-Importer"
Write-Host "  Interval: every 15 minutes"
Write-Host "  Log:      $LogDir\import.log"
Write-Host ""
Write-Host "To run immediately: Start-ScheduledTask -TaskName 'BOS-KPI-Importer' -TaskPath '\BOS\'"
Write-Host "To remove:          Unregister-ScheduledTask -TaskName 'BOS-KPI-Importer' -TaskPath '\BOS\' -Confirm:`$false"
