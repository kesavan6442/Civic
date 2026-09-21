@echo off
TITLE CivicConnect Unified Multi-Service Launcher (Govt of Jharkhand)
echo ========================================================================
echo        CIVICCONNECT PLATFORM (MongoDB + Java + React + Python AI)
echo ========================================================================
echo.

:: 1. Check and start MongoDB
echo [1/4] Checking MongoDB Database (Port 27017)...
sc query "MongoDB" | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB Service is running.
) else (
    echo [INFO] Starting MongoDB Windows Service...
    net start MongoDB >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MongoDB Service started successfully.
    ) else (
        echo [WARN] Could not auto-start MongoDB Service (may already be running).
    )
)
echo.

:: 2. Start Python AI Microservice (Port 8000)
echo [2/4] Starting Python AI Microservice (Port 8000)...
start "CivicConnect - Python AI Service (Port 8000)" cmd /k "cd /d %~dp0ai-service && title CivicConnect - Python AI Service (Port 8000) && python main.py"

:: 3. Start Java Spring Boot Backend (Port 5000) with JDK 17
echo [3/4] Starting Java Spring Boot Backend (Port 5000)...
set "JDK_PATH=C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
if not exist "%JDK_PATH%\bin\javac.exe" (
    set "JDK_PATH=C:\Program Files\Java\jdk-17"
)
if exist "%JDK_PATH%\bin\javac.exe" (
    start "CivicConnect - Java Spring Boot Backend (Port 5000)" cmd /k "cd /d %~dp0server-spring && title CivicConnect - Spring Boot Backend (Port 5000) && set JAVA_HOME=%JDK_PATH%&& mvnw.cmd spring-boot:run"
) else (
    start "CivicConnect - Java Spring Boot Backend (Port 5000)" cmd /k "cd /d %~dp0server-spring && title CivicConnect - Spring Boot Backend (Port 5000) && mvnw.cmd spring-boot:run"
)

:: 4. Start React Frontend (Port 5173)
echo [4/4] Starting React Frontend (Port 5173)...
start "CivicConnect - React Client (Port 5173)" cmd /k "cd /d %~dp0client && title CivicConnect - React Frontend (Port 5173) && npm run dev"

echo.
echo ========================================================================
echo All CivicConnect components are launching in dedicated windows!
echo - Database:           MongoDB on localhost:27017
echo - Java Backend:       http://localhost:5000 (MCP Server: /mcp)
echo - Python AI Service:  http://localhost:8000
echo - React Frontend:     http://localhost:5173
echo ========================================================================
echo.
timeout /t 5 >nul
start http://localhost:5173
