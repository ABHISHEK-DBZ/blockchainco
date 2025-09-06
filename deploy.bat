@echo off
echo 🌟 Blockchain Carbon Credit System - Quick Deploy
echo ================================================================

echo.
echo 🎯 Starting services...
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop all services
echo ================================================================

cd /d "%~dp0"

echo 🚀 Starting Flask Backend Server...
start "Backend Server" cmd /k "cd /d backend && python enhanced_backend.py"

timeout /t 3

echo 🚀 Starting React Frontend Server...
cd web-dashboard
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ Both services are starting in separate windows
echo ✅ Close the command windows to stop the services
echo ✅ System is now deployed and ready to use!

pause
