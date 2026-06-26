@echo off
chcp 65001 >nul
title cpolar 隧道测试

echo ========================================
echo   cpolar 隧道测试
echo ========================================
echo.

set CPOLAR=%USERPROFILE%\cpolar\cpolar.exe

echo [1] cpolar 版本:
"%CPOLAR%" version
echo.

echo [2] 确保后端正在运行...
curl -s http://localhost:8000/api/health >nul 2>&1
if errorlevel 1 (
    echo [!] 后端未运行，正在启动...
    cd /d "%~dp0backend"
    start "算法助手-后端" python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
    cd /d "%~dp0"
    timeout /t 4 >nul
)
echo [√] 后端就绪
echo.

echo [3] 启动 cpolar 隧道...
echo ========================================
echo 请查看下方是否出现 Forwarding 地址
echo 按 Ctrl+C 停止
echo ========================================
echo.

"%CPOLAR%" http 8000

pause
