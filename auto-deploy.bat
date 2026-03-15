@echo off
echo ==========================================
echo   Automated Deployment Setup (via Railway)
echo ==========================================
echo.
echo Step 1: Installing Railway CLI...
call npm install -g @railway/cli

echo.
echo Step 2: Logging in to Railway...
echo IMPORTANT: A browser window will open. Please create an account or log in.
echo            Once logged in, return to this window.
call railway login

echo.
echo Step 3: Initializing Project...
echo IMPORTANT: Select "Empty Project" when prompted.
call railway init

echo.
echo Step 4: Deploying your Code...
call railway up

echo.
echo ==========================================
echo Deployment Complete! 
echo Railway will now build and host your site.
echo You can view your live URL in the Railway Dashboard.
echo ==========================================
pause
