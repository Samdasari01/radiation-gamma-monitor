const { queryAll, runSql } = require('../database/db');

const DEFAULT_SETTINGS = {
  serialPort: '',
  baudRate: '115200',
  autoConnect: false,

  doseNormal: 0.5,
  doseElevated: 2.0,
  doseCaution: 10.0,
  doseWarning: 100.0,

  logInterval: 1000,
  autoLogEnabled: true,

  mapZoom: 15,
  mapCenterLat: 20.5937,
  mapCenterLon: 78.9629,
  showTrail: true,
  trailColor: '#22c55e',

  temperatureUnit: 'C',
  doseUnit: 'microSv',

  alertEnabled: true,
  alertThreshold: 10.0
};

function getSettings() {
  const rows = queryAll('SELECT * FROM settings');

  const settings = { ...DEFAULT_SETTINGS };
  rows.forEach(row => {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  });

  return settings;
}

function saveSettings(settings) {
  Object.entries(settings).forEach(([key, value]) => {
    runSql(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))',
      [key, JSON.stringify(value)]
    );
  });
  return { success: true };
}

module.exports = { getSettings, saveSettings };
