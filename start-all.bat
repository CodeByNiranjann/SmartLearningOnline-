@echo off
title Smart Learning Platform - Launcher
color 0A

echo ===================================================
echo     SMART LEARNING ONLINE PLATFORM LAUNCHER
echo ===================================================
echo.

:: Get project root directory where this script lives
set "PROJECT_ROOT=%~dp0"
set "SERVER_DIR=%PROJECT_ROOT%server"

echo [1/3] Checking MongoDB service...
sc query MongoDB >nul 2>&1
if %ERRORLEVEL% equ 0 (
    net start MongoDB >nul 2>&1
    echo [OK] Local MongoDB service confirmed/started.
) else (
    echo [INFO] MongoDB Windows service not found.
    echo        Ensure MongoDB is active locally or accessible via MONGO_URI in server\.env.
)
echo.

echo [2/3] Starting Express Backend Server (Port 5000)...
start "SLP - Backend Server" cmd /k "cd /d "%SERVER_DIR%" && npm start"
timeout /t 3 /nobreak >nul
echo [OK] Backend server launched in a separate window.
echo.

echo [3/3] Starting Vite Frontend Client (Port 5173)...
start "SLP - Frontend Client" cmd /k "cd /d "%PROJECT_ROOT%" && npm run dev"
timeout /t 3 /nobreak >nul
echo [OK] Frontend client launched in a separate window.
echo.

echo ===================================================
echo  All services are up and running!
echo  - Frontend Client:  http://localhost:5173
echo  - Backend API:      http://localhost:5000/api
echo  - SLP-15 Projects:  http://localhost:5173/internship-projects
echo ===================================================
echo.
echo Opening browser...
start http://localhost:5173/internship-projects

pause
