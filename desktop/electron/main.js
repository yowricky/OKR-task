// Electron main process
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '任务管理',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // DEV: load from Vite
  mainWindow.loadURL('http://localhost:1420');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
