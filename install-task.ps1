$taskName = "RulaDiet Listing Watcher"
$scriptPath = "C:\Users\moham\AppData\Local\Temp\opencode\listing-watcher.js"
$nodePath = (Get-Command node).Source

$action = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -Force

Write-Host "✅ Task '$taskName' created. It will run automatically at system startup."
Write-Host "Script: $scriptPath"
Write-Host "Node: $nodePath"
