$ErrorActionPreference = "Stop"

Write-Host "Stopping any running Expo CLI processes..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -and $_.Path -match "node" } |
  ForEach-Object {
    try {
      $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
      if ($cmdLine -match "expo start") {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
      }
    } catch {
      # Ignore process metadata access failures and continue.
    }
  }

Write-Host "Clearing project caches..." -ForegroundColor Cyan
$pathsToDelete = @(
  ".expo",
  ".expo-shared",
  "node_modules\.cache\metro"
)

foreach ($path in $pathsToDelete) {
  if (Test-Path -LiteralPath $path) {
    Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "Starting Expo in tunnel mode with bundler cache clear..." -ForegroundColor Cyan
npx expo start --tunnel --clear
