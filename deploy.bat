
@echo off
cd /d C:\nisit-match

echo ===========================
echo  NISIT MATCH AUTO DEPLOY
echo ===========================

git add -A
if errorlevel 1 goto failed

git diff --cached --quiet
if errorlevel 1 (
    git commit -m "Update NISIT MATCH"
    if errorlevel 1 goto failed
)

git push origin main
if errorlevel 1 goto failed

echo.
echo GitHub updated!
echo Vercel will deploy automatically.
goto end

:failed
echo.
echo ERROR - Check the messages above.

:end
pause
