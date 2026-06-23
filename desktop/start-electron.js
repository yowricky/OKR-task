// Launch the packaged Electron app directly
const { spawn } = require('child_process');
const path = require('path');

const electronPath = 'D:\\AI code\\task-app\\node_modules\\.pnpm\\electron@42.4.1\\node_modules\\electron\\dist\\electron.exe';
const mainPath = 'D:\\AI code\\task-app\\desktop\\electron\\main.js';

console.log('Starting Electron...');
console.log('Electron:', electronPath);
console.log('Main:', mainPath);

const child = spawn(electronPath, [mainPath], {
  stdio: 'inherit',
  detached: true,
});

child.on('error', (err) => {
  console.error('Failed:', err.message);
});

child.unref();
console.log('PID:', child.pid);
