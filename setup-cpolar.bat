@echo off
chcp 65001 >nul
title cpolar 一键配置

echo ========================================
echo   cpolar 内网穿透 - 一键配置
echo ========================================
echo.

set CPOLAR=%USERPROFILE%\cpolar\cpolar.exe

if not exist "%CPOLAR%" (
    echo [!] 未找到 cpolar.exe
    echo 请确保 %CPOLAR% 存在
    pause
    exit /b 1
)

echo [检查] cpolar 已安装: v
"%CPOLAR%" version 2>&1 | findstr version

echo.
echo ========================================
echo 下一步需要你的 cpolar authtoken:
echo.
echo 1. 打开浏览器访问 https://www.cpolar.com
echo 2. 注册/登录账号
echo 3. 在左侧菜单找到 "验证" 或访问:
echo    https://dashboard.cpolar.com/auth
echo 4. 复制你的 authtoken
echo ========================================
echo.

set /p TOKEN="请粘贴你的 authtoken (直接回车跳过): "

if "%TOKEN%"=="" (
    echo [!] 未输入 token，跳过认证
    echo     你之后可以手动运行: "%CPOLAR%" authtoken YOUR_TOKEN
) else (
    echo 正在配置 authtoken...
    "%CPOLAR%" authtoken "%TOKEN%"
    echo [√] authtoken 配置完成！
)

echo.
echo ========================================
echo 测试隧道启动...
echo ========================================
echo.
echo 启动后你会看到类似这样的输出:
echo   Forwarding  https://xxxx.cpolar.cn -^> http://localhost:8000
echo.
echo 按 Ctrl+C 停止测试
echo ========================================
echo.

"%CPOLAR%" http 8000

pause
