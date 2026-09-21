// Universal Single-File Starter for CivicConnect
// Starts MongoDB check, Python AI Service (:8000), Java Spring Boot (:5000), and React Client (:5173)

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================================================');
console.log('🚀 STARTING CIVICCONNECT UNIFIED PLATFORM (Govt of Jharkhand)');
console.log('========================================================================\n');

// 1. Check / Start MongoDB on Windows
console.log('🔹 [1/4] Checking MongoDB Database Service (Port 27017)...');
try {
  if (process.platform === 'win32') {
    try {
      execSync('net start MongoDB', { stdio: 'ignore' });
      console.log('   [OK] MongoDB Service is active.');
    } catch (e) {
      console.log('   [OK] MongoDB Service checked.');
    }
  }
} catch (err) {
  console.log('   [INFO] Proceeding with database connection.');
}

// 2. Start Python AI Microservice (:8000)
console.log('🔹 [2/4] Launching Python AI Microservice (Port 8000)...');
const aiProcess = spawn('python', ['main.py'], {
  cwd: path.join(__dirname, 'ai-service'),
  stdio: 'inherit',
  shell: true
});

// 3. Start Java Spring Boot Backend (:5000)
console.log('🔹 [3/4] Launching Java Spring Boot Backend (Port 5000)...');
const jdkPath = 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot';
const springEnv = { ...process.env, JAVA_HOME: jdkPath };
const mvnwCmd = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';
const springProcess = spawn(mvnwCmd, ['spring-boot:run'], {
  cwd: path.join(__dirname, 'server-spring'),
  env: springEnv,
  stdio: 'inherit',
  shell: true
});

// 4. Start React Frontend (:5173)
console.log('🔹 [4/4] Launching React Frontend (Port 5173)...');
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\n🛑 Shutting down CivicConnect services...');
  try { aiProcess.kill(); } catch (e) {}
  try { springProcess.kill(); } catch (e) {}
  try { clientProcess.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

