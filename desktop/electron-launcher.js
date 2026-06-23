// Use local electron binary path directly
const electronPath = require('./node_modules/electron');
// This path returns the electron.exe, not the npm module
// The main.js must be run BY electron.exe, not by node.exe
console.log('Electron binary:', electronPath);
console.log('Run with: ' + electronPath + ' ./electron/main.js');
