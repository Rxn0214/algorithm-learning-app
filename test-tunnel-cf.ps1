# Cloudflare Tunnel test - no account needed
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cloudflare Tunnel Test (Free)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cloudflared = "$env:USERPROFILE\cloudflared\cloudflared.exe"

# Download if not exist
if (-not (Test-Path $cloudflared)) {
    Write-Host "[1] Downloading cloudflared..." -ForegroundColor Yellow
    $dir = Split-Path $cloudflared -Parent
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    # Try multiple download sources
    $urls = @(
        "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    )

    foreach ($url in $urls) {
        try {
            Write-Host "  Trying: $url"
            Invoke-WebRequest -Uri $url -OutFile $cloudflared -TimeoutSec 120 -UseBasicParsing
            Write-Host "[OK] Download complete" -ForegroundColor Green
            break
        } catch {
            Write-Host "  Failed, trying next..." -ForegroundColor Yellow
        }
    }

    if (-not (Test-Path $cloudflared)) {
        Write-Host "[ERROR] Download failed. Please download manually:" -ForegroundColor Red
        Write-Host "  https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Red
        Write-Host "  Choose: cloudflared-windows-amd64.exe" -ForegroundColor Red
        Write-Host "  Save to: $cloudflared" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host "[OK] cloudflared ready" -ForegroundColor Green
Write-Host ""

# Check backend
Write-Host "[2] Checking backend..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 3 -UseBasicParsing
    Write-Host "[OK] Backend is running" -ForegroundColor Green
} catch {
    Write-Host "[!] Starting backend..." -ForegroundColor Yellow
    $backendDir = Join-Path $PSScriptRoot "backend"
    Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" -WorkingDirectory $backendDir -WindowStyle Minimized
    Start-Sleep -Seconds 4
    Write-Host "[OK] Backend started" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "Your public URL will appear below:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start tunnel
& $cloudflared tunnel --url http://localhost:8000

pause
