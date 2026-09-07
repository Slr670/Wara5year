@echo off
title Wara Dashboard Backend Server
echo Starting Backend Server on http://127.0.0.1:3001 ...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 3001
pause
