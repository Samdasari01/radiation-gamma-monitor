const { insertReading, getReadings, getLatestReading, getReadingsForMap, getDoseStats, exportCSV } = require('../database/readings');
const { startSession, endSession, getSessions } = require('../database/sessions');
const { getSettings, saveSettings } = require('./settings');
const { DataProcessor } = require('../serial/dataProcessor');

function registerIpcHandlers(ipcMain, serialManager, tileUrl) {
  const dataProcessor = new DataProcessor();

  serialManager.on('sensorData', (data) => {
    const processed = dataProcessor.process(data);
    if (serialManager.mainWindow && !serialManager.mainWindow.isDestroyed()) {
      serialManager.mainWindow.webContents.send('serial:data', processed);
    }
  });

  serialManager.on('nmea', (sentence) => {
    const processed = dataProcessor.process(sentence);
    if (serialManager.mainWindow && !serialManager.mainWindow.isDestroyed()) {
      serialManager.mainWindow.webContents.send('serial:data', processed);
    }
  });

  serialManager.on('customData', (data) => {
    const processed = dataProcessor.process(data);
    if (serialManager.mainWindow && !serialManager.mainWindow.isDestroyed()) {
      serialManager.mainWindow.webContents.send('serial:data', processed);
    }
  });

  serialManager.on('status', (status) => {
    if (serialManager.mainWindow && !serialManager.mainWindow.isDestroyed()) {
      serialManager.mainWindow.webContents.send('serial:status', status);
    }
  });

  // Serial handlers
  ipcMain.handle('serial:getPorts', async () => {
    return await serialManager.getAvailablePorts();
  });

  ipcMain.handle('serial:connect', async (_, port, baudRate) => {
    return serialManager.connect(port, baudRate);
  });

  ipcMain.handle('serial:disconnect', async () => {
    return serialManager.disconnect();
  });

  // Database handlers
  ipcMain.handle('db:insertReading', async (_, reading) => {
    return insertReading(reading);
  });

  ipcMain.handle('db:getReadings', async (_, filters) => {
    return getReadings(filters);
  });

  ipcMain.handle('db:getLatestReading', async () => {
    return getLatestReading();
  });

  ipcMain.handle('db:getReadingsForMap', async () => {
    return getReadingsForMap();
  });

  ipcMain.handle('db:getDoseStats', async (_, sessionId) => {
    return getDoseStats(sessionId);
  });

  ipcMain.handle('db:getSessionStats', async (_, sessionId) => {
    return getDoseStats(sessionId);
  });

  ipcMain.handle('db:startSession', async (_, notes) => {
    return startSession(notes);
  });

  ipcMain.handle('db:endSession', async (_, id) => {
    return endSession(id);
  });

  ipcMain.handle('db:getSessions', async () => {
    return getSessions();
  });

  ipcMain.handle('db:exportCSV', async (_, filters) => {
    return exportCSV(filters);
  });

  // Settings handlers
  ipcMain.handle('settings:get', async () => {
    return getSettings();
  });

  ipcMain.handle('settings:save', async (_, settings) => {
    return saveSettings(settings);
  });

  // Map / Tile server handlers
  ipcMain.handle('map:getTileUrl', async () => {
    return tileUrl || null;
  });

  ipcMain.handle('map:hasOfflineTiles', async () => {
    const { hasOfflineTiles } = require('../tileServer');
    return hasOfflineTiles();
  });

  ipcMain.handle('map:isPackaged', async () => {
    const { app } = require('electron');
    return app.isPackaged;
  });
}

module.exports = { registerIpcHandlers };
