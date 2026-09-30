const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeDatabase } = require('./database/db');
const { SerialManager } = require('./serial/serialManager');
const { registerIpcHandlers } = require('./ipc/handlers');
const { startTileServer, stopTileServer, getTileServerUrl, hasOfflineTiles } = require('./tileServer');

let mainWindow;
let splashWindow;
let serialManager;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 520,
    height: 480,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.center();
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  return splashWindow;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Advanced Radiation Gamma Monitor',
    backgroundColor: '#0a0f1a'
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  if (serialManager) {
    serialManager.setMainWindow(mainWindow);
  }

  return mainWindow;
}

app.whenReady().then(async () => {
  // Show splash immediately
  createSplashWindow();

  // Initialize everything in parallel while splash is showing
  const initPromise = (async () => {
    await initializeDatabase();

    let tileUrl = null;
    try {
      const result = await startTileServer();
      tileUrl = `http://127.0.0.1:${result.port}/tiles`;
      console.log('Tile server started at:', tileUrl);
      console.log('Has offline tiles:', hasOfflineTiles());
    } catch (err) {
      console.error('Failed to start tile server:', err);
    }

    serialManager = new SerialManager();
    registerIpcHandlers(ipcMain, serialManager, tileUrl);

    return tileUrl;
  })();

  // Wait for splash to finish (5 seconds) AND init to complete, whichever is later
  const SPLASH_DURATION = 15000;
  const startTime = Date.now();

  const [, tileUrl] = await Promise.all([
    new Promise(resolve => setTimeout(resolve, SPLASH_DURATION)),
    initPromise
  ]);

  createMainWindow();
});

app.on('window-all-closed', () => {
  stopTileServer();
  if (serialManager) serialManager.disconnect();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
