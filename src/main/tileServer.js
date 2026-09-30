const express = require('express');
const path = require('path');
const fs = require('fs');

let server = null;
let port = 0;

function getOfflineTilesPath() {
  const { app } = require('electron');
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'offline-tiles');
  }
  return path.join(__dirname, '..', 'assets', 'offline-tiles');
}

function startTileServer() {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve({ port });
      return;
    }

    const app = express();
    const tilesPath = getOfflineTilesPath();

    if (!fs.existsSync(tilesPath)) {
      console.warn('Offline tiles directory not found at:', tilesPath);
      console.warn('Online tiles will be used as fallback.');
    }

    app.use('/tiles', express.static(tilesPath, {
      maxAge: '1d',
      immutable: true,
      fallthrough: true
    }));

    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      console.log(`Tile server running on http://127.0.0.1:${port}`);
      resolve({ port });
    });

    server.on('error', (err) => {
      console.error('Tile server error:', err);
      reject(err);
    });
  });
}

function stopTileServer() {
  if (server) {
    server.close();
    server = null;
    port = 0;
  }
}

function getTileServerUrl() {
  return `http://127.0.0.1:${port}/tiles`;
}

function hasOfflineTiles() {
  const tilesPath = getOfflineTilesPath();
  if (!fs.existsSync(tilesPath)) return false;

  const dirs = fs.readdirSync(tilesPath);
  return dirs.some(d => !isNaN(parseInt(d)));
}

module.exports = { startTileServer, stopTileServer, getTileServerUrl, hasOfflineTiles };
