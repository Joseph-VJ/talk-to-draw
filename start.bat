@echo off
echo Starting TalkDraw Application...
echo.

:: Start backend in background
start "TalkDraw Backend" cmd /c "cd /d %~dp0backend && python app.py"

:: Wait a moment for backend to start
timeout /t 2 /nobreak > nul

:: Start frontend (this will stay in foreground)
cd /d %~dp0frontend
echo.
echo Backend running at: http://localhost:5000
echo Frontend starting...
echo.
npm run dev
