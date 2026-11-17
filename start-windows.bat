@echo off
cd /d "%~dp0"
if not exist ".env" (
  echo Create .env from .env.example and set TEACHER_PASSWORD and SESSION_SECRET first.
  pause
  exit /b 1
)
node --env-file=.env server.js
pause
