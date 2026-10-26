@echo off
setlocal
cd /d "%~dp0"
title TheGamingGrimoire (local)

echo.
echo   TheGamingGrimoire - local development
echo   ======================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js was not found. Install Node.js 20 or newer from https://nodejs.org and run this again.
  pause
  exit /b 1
)

if not exist "node_modules\embedded-postgres" (
  echo Installing dependencies - this only happens the first time...
  call npm install
  if errorlevel 1 (
    echo [!] npm install failed. See the messages above.
    pause
    exit /b 1
  )
)

echo Starting the database, API and website...
echo The site will open at http://localhost:5173 in a few seconds.
echo Press Ctrl+C in this window to stop everything.
echo.

rem Open the browser once the dev servers have had a moment to start.
start "" /b cmd /c "ping -n 9 127.0.0.1 >nul & start http://localhost:5173"

call npm run dev

endlocal
