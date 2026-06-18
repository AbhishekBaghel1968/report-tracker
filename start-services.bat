@echo off
echo ===================================================
echo Starting Cyber Crime Portal Services...
echo ===================================================

echo [1/3] Starting MySQL Database Server...
start "MySQL Database" /min "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="%~dp0mysql_data" --console --port=3306 --shared-memory

echo Waiting for MySQL to initialize...
timeout /t 5 /nobreak > NUL

echo [2/3] Starting Node.js Backend...
cd /d "%~dp0backend"
start "Node.js Backend" cmd /c npm run dev

echo [3/3] Starting Vite Frontend...
cd /d "%~dp0"
start "Vite Frontend" cmd /c npm run dev

echo ===================================================
echo All services have been launched in the background:
echo - Database Server (MySQL) on port 3306
echo - Backend API on http://localhost:8080
echo - Frontend App on http://localhost:5173 (opening in browser...)
echo ===================================================
timeout /t 3 /nobreak > NUL
start http://localhost:5173
pause
