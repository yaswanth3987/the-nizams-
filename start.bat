@echo off
echo =========================================
echo    Starting The Great Nizam POS System
echo =========================================

echo Starting Backend API and Socket Server...
start "The Great Nizam - Backend" cmd /k "cd backend && npm start"

echo.
echo Starting Frontend Application...
start "The Great Nizam - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo The servers are starting in new windows.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:3001
echo.
pause
