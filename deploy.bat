@echo off
cd /d C:\nisit-match

echo Deploying Nisit Match to Vercel...

call npx vercel --prod

if errorlevel 1 (
    echo Deployment failed!
) else (
    echo Deployment command completed!
)

pause
