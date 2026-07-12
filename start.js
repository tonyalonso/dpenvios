const { spawn } = require('child_process');
const path = require('path');

// Render asigna el puerto via PORT, usar 3000 como fallback
const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

process.env.PORT = port;
process.env.HOSTNAME = hostname;

const serverPath = path.join(__dirname, '.next', 'standalone', 'server.js');

console.log(`Starting server on ${hostname}:${port}`);
console.log(`Server file: ${serverPath}`);

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});
