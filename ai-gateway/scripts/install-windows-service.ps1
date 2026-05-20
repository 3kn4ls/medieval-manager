<#
.SYNOPSIS
  Installs the AI Gateway as a Windows service via NSSM so it survives reboots.

.DESCRIPTION
  - Verifies node.exe is available
  - Installs NSSM via winget if missing
  - Validates .env has a real GATEWAY_API_KEY
  - Runs `npm install` if node_modules is missing
  - Removes any previous "AIGateway" service
  - Creates the service with delayed auto-start, auto-restart, and rotating logs
  - Starts it and runs a smoke test against /healthz
  - Verifies Tailscale Funnel mapping, re-applies it if missing

.NOTES
  Run from PowerShell as Administrator. From the ai-gateway folder:
    powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-service.ps1
#>

[CmdletBinding()]
param(
  [string]$ServiceName = "AIGateway",
  [string]$Port = "8080",
  [string]$FunnelPath = "/ai-gateway"
)

$ErrorActionPreference = "Stop"

# Resolve ai-gateway directory (script lives in <ai-gateway>/scripts/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$gatewayDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $gatewayDir ".env"
$entryFile = Join-Path $gatewayDir "server.js"

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warn2($msg) { Write-Host "    !!: $msg" -ForegroundColor Yellow }

# --- 0. Must be admin -------------------------------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal] `
  [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(`
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Error "Run this script from an elevated PowerShell (Run as Administrator)."
  exit 1
}

# --- 1. Validate gateway folder --------------------------------------------
Write-Step "Validating gateway folder"
if (-not (Test-Path $entryFile)) {
  Write-Error "server.js not found at $entryFile. Run this script from the ai-gateway repo folder."
  exit 1
}
Write-Ok "Gateway folder: $gatewayDir"

# --- 2. Validate .env -------------------------------------------------------
Write-Step "Validating .env"
if (-not (Test-Path $envFile)) {
  Write-Error ".env not found at $envFile. Copy .env.example to .env and set GATEWAY_API_KEY."
  exit 1
}
$envLines = Get-Content $envFile
$keyLine = $envLines | Where-Object { $_ -match '^\s*GATEWAY_API_KEY\s*=\s*(.+)\s*$' } | Select-Object -First 1
if (-not $keyLine) {
  Write-Error "GATEWAY_API_KEY not set in .env"
  exit 1
}
if ($keyLine -match 'change_me_to_a_long_random_string') {
  Write-Error "GATEWAY_API_KEY is still the placeholder. Generate with: -join ((1..32) | %{ '{0:x2}' -f (Get-Random -Max 256) })"
  exit 1
}
Write-Ok ".env has a real GATEWAY_API_KEY"

# --- 3. Node ----------------------------------------------------------------
Write-Step "Locating node.exe"
$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Error "node.exe not in PATH. Install Node.js LTS from https://nodejs.org and retry."
  exit 1
}
$nodePath = $nodeCmd.Source
Write-Ok "Node: $nodePath"

# --- 4. NSSM ----------------------------------------------------------------
Write-Step "Locating NSSM"
$nssmCmd = Get-Command nssm.exe -ErrorAction SilentlyContinue
if (-not $nssmCmd) {
  Write-Warn2 "NSSM not in PATH, installing via winget..."
  try {
    winget install --id NSSM.NSSM --accept-source-agreements --accept-package-agreements --silent
  } catch {
    Write-Error "winget install of NSSM failed. Install manually from https://nssm.cc/download and re-run."
    exit 1
  }
  # Refresh PATH from machine + user without reopening the shell
  $env:Path = `
    [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + `
    [System.Environment]::GetEnvironmentVariable("Path","User")
  $nssmCmd = Get-Command nssm.exe -ErrorAction SilentlyContinue
}
if (-not $nssmCmd) {
  Write-Error "NSSM still not in PATH. Reopen PowerShell as admin and re-run, or install manually."
  exit 1
}
$nssmPath = $nssmCmd.Source
Write-Ok "NSSM: $nssmPath"

# --- 5. npm install ---------------------------------------------------------
$nodeModulesDir = Join-Path $gatewayDir "node_modules"
if (-not (Test-Path $nodeModulesDir)) {
  Write-Step "Installing npm dependencies"
  Push-Location $gatewayDir
  try { npm install --omit=dev } finally { Pop-Location }
  Write-Ok "npm install done"
} else {
  Write-Ok "node_modules already present"
}

# --- 6. Remove previous service if it exists --------------------------------
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Step "Removing previous $ServiceName service"
  & $nssmPath stop $ServiceName confirm | Out-Null
  Start-Sleep -Seconds 1
  & $nssmPath remove $ServiceName confirm | Out-Null
  Start-Sleep -Seconds 1
  Write-Ok "Old service removed"
}

# --- 7. Install service -----------------------------------------------------
Write-Step "Installing service $ServiceName"
& $nssmPath install $ServiceName $nodePath "server.js" | Out-Null
& $nssmPath set $ServiceName AppDirectory $gatewayDir | Out-Null
& $nssmPath set $ServiceName DisplayName "Medieval Manager AI Gateway" | Out-Null
& $nssmPath set $ServiceName Description "Auth + rate-limit proxy in front of Ollama. Exposed via Tailscale Funnel." | Out-Null
# Delayed auto-start gives Tailscale + Ollama time to come up first
& $nssmPath set $ServiceName Start SERVICE_DELAYED_AUTO_START | Out-Null
# Auto-restart on crash, 5s backoff
& $nssmPath set $ServiceName AppExit Default Restart | Out-Null
& $nssmPath set $ServiceName AppRestartDelay 5000 | Out-Null
# Rotating logs
$logOut = Join-Path $gatewayDir "gateway.log"
$logErr = Join-Path $gatewayDir "gateway.err.log"
& $nssmPath set $ServiceName AppStdout $logOut | Out-Null
& $nssmPath set $ServiceName AppStderr $logErr | Out-Null
& $nssmPath set $ServiceName AppRotateFiles 1 | Out-Null
& $nssmPath set $ServiceName AppRotateBytes 10485760 | Out-Null    # 10 MB
& $nssmPath set $ServiceName AppStdoutCreationDisposition 4 | Out-Null
& $nssmPath set $ServiceName AppStderrCreationDisposition 4 | Out-Null
Write-Ok "Service registered with auto-start + auto-restart"

# --- 8. Start ---------------------------------------------------------------
Write-Step "Starting $ServiceName"
& $nssmPath start $ServiceName | Out-Null
Start-Sleep -Seconds 3
$status = (Get-Service -Name $ServiceName).Status
if ($status -ne 'Running') {
  Write-Error "Service did not reach Running state (current: $status). Check $logErr"
  exit 1
}
Write-Ok "Service is Running"

# --- 9. Local smoke test ----------------------------------------------------
Write-Step "Smoke test on http://127.0.0.1:$Port/healthz"
$tries = 0
$max = 5
$healthy = $false
while ($tries -lt $max -and -not $healthy) {
  $tries++
  try {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/healthz" -TimeoutSec 3
    if ($resp.ok) { $healthy = $true; break }
  } catch {
    Start-Sleep -Seconds 2
  }
}
if (-not $healthy) {
  Write-Error "Healthz did not return ok:true after $max attempts. See $logErr"
  exit 1
}
Write-Ok "Healthz: ok"

# --- 10. Tailscale Funnel ---------------------------------------------------
Write-Step "Verifying Tailscale Funnel"
$tsCmd = Get-Command tailscale.exe -ErrorAction SilentlyContinue
if (-not $tsCmd) {
  Write-Warn2 "tailscale.exe not in PATH. Skipping funnel check; verify manually."
} else {
  $serveOut = & tailscale.exe serve status 2>&1 | Out-String
  if ($serveOut -match [regex]::Escape($FunnelPath)) {
    Write-Ok "Funnel already maps $FunnelPath -> :$Port"
  } else {
    Write-Warn2 "Funnel mapping missing, applying..."
    & tailscale.exe funnel --bg --https=443 --set-path=$FunnelPath "http://localhost:$Port"
    Start-Sleep -Seconds 2
    & tailscale.exe serve status
  }
}

# --- 11. Done ---------------------------------------------------------------
Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  AI Gateway service installed and running" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service:   $ServiceName  (Get-Service $ServiceName)"
Write-Host "Logs:      $logOut"
Write-Host "Err logs:  $logErr"
Write-Host ""
Write-Host "Manage:"
Write-Host "  Restart-Service $ServiceName"
Write-Host "  Stop-Service $ServiceName"
Write-Host "  nssm edit $ServiceName       # GUI to tweak config"
Write-Host "  nssm remove $ServiceName confirm   # uninstall"
Write-Host ""
Write-Host "Reboot test:"
Write-Host "  Restart-Computer; then check: Get-Service $ServiceName"
Write-Host ""
