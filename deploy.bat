@echo off
setlocal
cd /d "%~dp0"

echo ===========================
echo  NISIT MATCH AUTO DEPLOY
echo ===========================

if not exist package.json (
  echo ERROR: package.json not found. Run this file from the project folder.
  goto failed
)

call npm ci
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed

git add -A
if errorlevel 1 goto failed

git diff --cached --quiet
if errorlevel 1 (
    git commit -m "NISIT MATCH v71: instant swipe and photo preload"
    if errorlevel 1 goto failed
)

git push origin main
if errorlevel 1 goto failed

echo.
echo GitHub updated. Vercel should deploy automatically.
goto end

:failed
echo.
echo ERROR - Review the messages above. Deployment was not confirmed.

:end
pause
endlocal
