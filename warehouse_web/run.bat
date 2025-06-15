@echo off
echo Starting Warehouse Web Application...

:: Create directories if they don't exist
if not exist backend\uploads mkdir backend\uploads
if not exist backend\results mkdir backend\results

:: Start the backend server in a new window
start cmd /k "cd backend && run_server.bat"

:: Wait a moment for the backend to start
timeout /t 5

:: Start the frontend server in a new window
start cmd /k "cd frontend && run_frontend.bat"

echo.
echo Warehouse Web Application is starting...
echo Backend server will be available at http://localhost:5000
echo Frontend server will be available at http://localhost:3000
echo.

pause