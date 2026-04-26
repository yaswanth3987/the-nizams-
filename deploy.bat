@echo off
echo ==========================================
1: echo   🚀 The Great Nizam - Auto Deployer
2: echo ==========================================
3: echo.
4: 
5: echo 🛠️  Step 1: Running fixes (Encoding ^& Syntax)...
6: call npm run fix
7: if %ERRORLEVEL% NEQ 0 (
8:     echo ❌ Fix failed! Please check the errors.
9:     pause
10:     exit /b %ERRORLEVEL%
11: )
12: 
13: echo.
14: echo 📝 Step 2: Preparing Git...
15: git add .
16: 
17: set /p commit_msg="Enter commit message (or press Enter for 'Deployment update'): "
18: if "%commit_msg%"=="" set commit_msg="Deployment update"
19: 
20: git commit -m "%commit_msg%"
21: 
22: echo.
23: echo 🆙 Step 3: Pushing to GitHub (Triggers Render/Railway)...
24: git push
25: 
26: if %ERRORLEVEL% NEQ 0 (
27:     echo ❌ Push failed! Check your connection or Git state.
28: ) else (
29:     echo ✅ Push Successful! Check your Render dashboard for progress.
30: )
31: 
32: echo.
33: pause
