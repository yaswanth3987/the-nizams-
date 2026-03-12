@echo off
echo =========================================
echo    Starting Great Nizam Production Server
echo =========================================

echo 1. Building latest frontend statically...
cd frontend
call npm run build
cd ..

echo.
echo 2. Starting unified Backend server to serve API and Frontend...
cd backend
echo Server is running! Open http://localhost:3001 in your browser.
call npm start
pause
