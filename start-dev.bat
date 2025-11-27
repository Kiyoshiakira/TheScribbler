@echo off
REM Double-click this file to start the Scribbler dev server in a console on Windows
cd /d "%~dp0"
echo Starting TheScribbler dev server...
call npm run dev
pause
