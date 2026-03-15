@echo off
echo =========================================
echo    Starting The Great Nizam POS System
echo =========================================

echo Cleaning up any stuck processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo Starting Backend (auto-restart enabled)...
start "The Great Nizam - Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "The Great Nizam - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are starting!
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:3001
echo.
echo Backend will auto-restart if it crashes.
echo.
pause
