@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.12 or newer from https://nodejs.org first.
  pause
  exit /b 1
)
if not exist .env (
  echo Configuration is missing. Copy .env.example to .env and fill in the values described in README.md.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
if not exist dist\index.html (
  call npm run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Open http://localhost:4000 in your browser after the server starts.
call npm start
pause
