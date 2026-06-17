@echo off
echo 正在启动算法学习助手...
echo.
echo 请在浏览器中打开: http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务器
echo.
cd /d "%~dp0"
python -m http.server 8080
pause