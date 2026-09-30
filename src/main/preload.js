const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  serial: {
    getPorts: () => ipcRenderer.invoke('serial:getPorts'),
    connect: (port, baudRate) => ipcRenderer.invoke('serial:connect', port, baudRate),
    disconnect: () => ipcRenderer.invoke('serial:disconnect'),
    onData: (callback) => ipcRenderer.on('serial:data', (_, data) => callback(data)),
    onConnectionChange: (callback) => ipcRenderer.on('serial:status', (_, status) => callback(status)),
    onDataRateChange: (callback) => ipcRenderer.on('serial:dataRate', (_, rate) => callback(rate))
  },

  database: {
    insertReading: (reading) => ipcRenderer.invoke('db:insertReading', reading),
    getReadings: (filters) => ipcRenderer.invoke('db:getReadings', filters),
    getLatestReading: () => ipcRenderer.invoke('db:getLatestReading'),
    getReadingsForMap: () => ipcRenderer.invoke('db:getReadingsForMap'),
    getDoseStats: (sessionId) => ipcRenderer.invoke('db:getDoseStats', sessionId),
    getSessionStats: (sessionId) => ipcRenderer.invoke('db:getSessionStats', sessionId),
    startSession: (notes) => ipcRenderer.invoke('db:startSession', notes),
    endSession: (id) => ipcRenderer.invoke('db:endSession', id),
    getSessions: () => ipcRenderer.invoke('db:getSessions'),
    exportCSV: (filters) => ipcRenderer.invoke('db:exportCSV', filters)
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings)
  },

  map: {
    getTileUrl: () => ipcRenderer.invoke('map:getTileUrl'),
    hasOfflineTiles: () => ipcRenderer.invoke('map:hasOfflineTiles'),
    isPackaged: () => ipcRenderer.invoke('map:isPackaged')
  }
});
