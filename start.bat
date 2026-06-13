@echo off
chcp 65001 >nul
title 算法学习助手 - 一键启动

echo ========================================
echo   算法与程序实现学习助手
echo   正在启动...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 启动后端服务...
cd backend
start /B python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ..\server.log 2>&1
cd ..
timeout /t 3 >nul

echo [2/2] 服务已启动！
echo.
echo ========================================
echo   访问地址：
echo.
echo   本机:     http://localhost:8000
echo   手机:     http://100.90.61.158:8000
echo.
echo   按 Ctrl+C 停止服务
echo ========================================
echo.

:: 自动打开浏览器
start http://localhost:8000

:: 等待用户按键
pause >nul

:: 停止服务
taskkill /f /im python.exe >nul 2>&1
echo 服务已停止。
