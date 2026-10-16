@echo off
title Smart Learning Platform - Seed All Database Collections
color 0B

echo ===================================================
echo     SMART LEARNING PLATFORM - SEED DATABASE
echo ===================================================
echo.

set "PROJECT_ROOT=%~dp0"
set "SERVER_DIR=%PROJECT_ROOT%server"

cd /d "%SERVER_DIR%"

echo [1/4] Seeding core courses, modules, lessons and users...
node seed.js
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to run seed.js. Make sure MongoDB is running.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [2/4] Seeding internship projects (SLP-15)...
node seed-projects.js
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to seed internship projects.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [3/4] Seeding coding challenges (SLP-14)...
node seed-challenges.js
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to seed coding challenges.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo [4/4] Seeding skill assessments...
node seed-assessment.js
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to seed skill assessments.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo ===================================================
echo [SUCCESS] All collections seeded successfully!
echo ===================================================
echo.
pause
