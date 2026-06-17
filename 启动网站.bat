@echo off
cd /d "%~dp0\backend"
start http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
