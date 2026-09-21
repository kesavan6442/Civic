# ========================================================================
# CivicConnect Unified PowerShell Launcher (Govt. of Jharkhand)
# Starts MongoDB, Python AI Service (:8000), Spring Boot (:5000), React (:5173)
# ========================================================================

Clear-Host
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "   CIVICCONNECT ENTERPRISE PLATFORM (Govt. of Jharkhand)" -ForegroundColor Green
Write-Host "   Unified Multi-Service Launcher: Database + AI + Backend + UI" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

# ------------------------------------------------------------------------
# 1. MongoDB Database Check & Start (Port 27017)
# ------------------------------------------------------------------------
Write-Host "[1/4] Checking MongoDB Database (Port 27017)..." -ForegroundColor Magenta
$mongoSvc = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if ($mongoSvc -and $mongoSvc.Status -eq "Running") {
    Write-Host "  [OK] MongoDB Windows Service is active and running." -ForegroundColor Green
} elseif ($mongoSvc) {
    Write-Host "  [INFO] Starting MongoDB Windows Service..." -ForegroundColor Yellow
    try {
        Start-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "  [OK] MongoDB Service started successfully." -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Could not auto-start MongoDB service (it may already be running or require admin rights)." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [INFO] MongoDB service check completed." -ForegroundColor Gray
}

# ------------------------------------------------------------------------
# 2. Python AI Microservice (Port 8000)
# ------------------------------------------------------------------------
Write-Host "[2/4] Starting Python AI Microservice (Port 8000)..." -ForegroundColor Cyan
$aiPath = Join-Path $root "ai-service"
$aiCmd = "cd /d ""$aiPath"" && title CivicConnect - Python AI Service (Port 8000) && python main.py"
Start-Process "cmd.exe" -ArgumentList "/k", "$aiCmd"
Write-Host "  [OK] Python AI Microservice launched in dedicated window (http://localhost:8000)." -ForegroundColor Green

# ------------------------------------------------------------------------
# 3. Java Spring Boot Backend (Port 5000)
# ------------------------------------------------------------------------
Write-Host "[3/4] Detecting Java JDK & Starting Spring Boot Backend (Port 5000)..." -ForegroundColor Yellow

$candidateJdks = @(
    "C:\Program Files\Java\jdk-24",
    "C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot",
    "C:\Program Files\Java\jdk-17",
    $env:JAVA_HOME
)

$jdkPath = ""
foreach ($candidate in $candidateJdks) {
    if ($candidate -and (Test-Path (Join-Path $candidate "bin\javac.exe"))) {
        $jdkPath = $candidate
        break
    }
}

if (-not $jdkPath) {
    $adoptiumDir = "C:\Program Files\Eclipse Adoptium"
    if (Test-Path $adoptiumDir) {
        $found = Get-ChildItem -Path $adoptiumDir -Directory | Where-Object { $_.Name -like "jdk*" } | Select-Object -First 1
        if ($found) { $jdkPath = $found.FullName }
    }
}

if ($jdkPath) {
    Write-Host "  [OK] Using Java JDK: $jdkPath" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Using default system Java." -ForegroundColor Yellow
}

$serverPath = Join-Path $root "server-spring"
$springCmd = if ($jdkPath) {
    "cd /d ""$serverPath"" && title CivicConnect - Spring Boot Backend (Port 5000) && set JAVA_HOME=$jdkPath&& mvnw.cmd spring-boot:run"
} else {
    "cd /d ""$serverPath"" && title CivicConnect - Spring Boot Backend (Port 5000) && mvnw.cmd spring-boot:run"
}

Start-Process "cmd.exe" -ArgumentList "/k", "$springCmd"
Write-Host "  [OK] Spring Boot Backend launched in dedicated window (http://localhost:5000)." -ForegroundColor Green

# ------------------------------------------------------------------------
# 4. React Vite Frontend Client (Port 5173)
# ------------------------------------------------------------------------
Write-Host "[4/4] Starting React Frontend Client (Port 5173)..." -ForegroundColor Blue
$clientPath = Join-Path $root "client"
$clientCmd = "cd /d ""$clientPath"" && title CivicConnect - React Frontend (Port 5173) && npm run dev"
Start-Process "cmd.exe" -ArgumentList "/k", "$clientCmd"
Write-Host "  [OK] React Frontend launched in dedicated window (http://localhost:5173)." -ForegroundColor Green

# ------------------------------------------------------------------------
# Completion & Browser Launch
# ------------------------------------------------------------------------
Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "   ALL 4 CIVICCONNECT COMPONENTS LAUNCHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "   - Database:        MongoDB (localhost:27017)" -ForegroundColor Cyan
Write-Host "   - Python AI:       http://localhost:8000" -ForegroundColor Cyan
Write-Host "   - Java Backend:    http://localhost:5000 (MCP Server: /mcp)" -ForegroundColor Cyan
Write-Host "   - React Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Opening web portal (http://localhost:5173) in default browser..." -ForegroundColor Yellow

Start-Sleep -Seconds 4
Start-Process "http://localhost:5173"

