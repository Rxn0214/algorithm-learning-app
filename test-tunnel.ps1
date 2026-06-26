# PowerShell tunnel test script
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  cpolar Tunnel Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cpolar = "$env:USERPROFILE\cpolar\cpolar.exe"

# Check cpolar
Write-Host "[1] cpolar version:" -ForegroundColor Yellow
& $cpolar version
Write-Host ""

# Check and start backend
Write-Host "[2] Checking backend..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 3 -UseBasicParsing
    Write-Host "[OK] Backend is running" -ForegroundColor Green
} catch {
    Write-Host "[!] Backend not running, starting..." -ForegroundColor Yellow
    $backendDir = Join-Path $PSScriptRoot "backend"
    Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $backendDir -WindowStyle Minimized
    Start-Sleep -Seconds 4
    Write-Host "[OK] Backend started" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3] Starting cpolar tunnel..." -ForegroundColor Yellow
Write-Host "Look for the Forwarding URL below:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try different regions (cn first, then us)
Write-Host "Trying region: cn (China)..." -ForegroundColor Yellow
& $cpolar http 8000 -region cn

Write-Host ""
Write-Host "cn failed, trying default region..." -ForegroundColor Yellow
& $cpolar http 8000

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
