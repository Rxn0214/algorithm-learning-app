@echo off
chcp 65001 >nul
title 算法学习助手 - 生产部署

echo ========================================
echo   算法与程序实现学习助手
echo   生产环境部署中...
echo ========================================
echo.

cd /d "%~dp0"

:: 检查前端是否已构建
if not exist "frontend\dist\index.html" (
    echo [!] 前端未构建，正在构建...
    cd frontend
    call npm run build
    cd ..
)

:: 检查后端依赖
echo [1/2] 启动后端服务 (端口 8000)...
cd backend
start "算法助手-后端" python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
cd ..

:: 等待后端启动
timeout /t 3 >nul

:: 启动 cpolar 隧道
echo [2/2] 启动内网穿透隧道...
set CPOLAR=%USERPROFILE%\cpolar\cpolar.exe
if not exist "%CPOLAR%" (
    echo [!] 未找到 cpolar，请先运行安装脚本
    pause >nul
    exit /b 1
)
start "算法助手-隧道" "%CPOLAR%" http 8000 -region cn

echo.
echo ========================================
echo   部署完成！
echo.
echo   本机访问:  http://localhost:8000
echo   管理面板:  http://localhost:9200
echo   外网地址:  查看上方 cpolar 窗口的 Forwarding 行
echo.
echo   按任意键停止所有服务...
echo ========================================
pause >nul

:: 停止服务
echo 正在停止服务...
taskkill /fi "WINDOWTITLE eq 算法助手-后端" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq 算法助手-隧道" /f >nul 2>&1
echo 服务已停止。
pause >nul
