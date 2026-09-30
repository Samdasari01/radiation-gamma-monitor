const { queryAll, queryOne, runSql, saveDatabase } = require('./db');

function insertReading(reading) {
  return runSql(
    `INSERT INTO readings (session_id, timestamp, dose_rate, temperature, humidity, latitude, longitude, satellites)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      reading.sessionId || null,
      reading.timestamp || new Date().toISOString(),
      reading.doseRate || 0,
      reading.temperature || 0,
      reading.humidity || 0,
      reading.latitude || null,
      reading.longitude || null,
      reading.satellites || 0
    ]
  );
}

function getReadings(filters = {}) {
  let query = 'SELECT * FROM readings WHERE 1=1';
  const params = [];

  if (filters.sessionId) {
    query += ' AND session_id = ?';
    params.push(filters.sessionId);
  }

  if (filters.startDate) {
    query += ' AND timestamp >= ?';
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ' AND timestamp <= ?';
    params.push(filters.endDate);
  }

  if (filters.minDose !== undefined) {
    query += ' AND dose_rate >= ?';
    params.push(filters.minDose);
  }

  if (filters.maxDose !== undefined) {
    query += ' AND dose_rate <= ?';
    params.push(filters.maxDose);
  }

  query += ' ORDER BY timestamp DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  return queryAll(query, params);
}

function getLatestReading() {
  return queryOne('SELECT * FROM readings ORDER BY created_at DESC LIMIT 1');
}

function getReadingsForMap() {
  return queryAll(`
    SELECT latitude, longitude, dose_rate, timestamp
    FROM readings
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY timestamp DESC
  `);
}

function getDoseStats(sessionId = null) {
  let query = `
    SELECT
      COUNT(*) as totalReadings,
      AVG(dose_rate) as avgDose,
      MAX(dose_rate) as maxDose,
      MIN(dose_rate) as minDose,
      AVG(temperature) as avgTemp,
      AVG(humidity) as avgHumidity
    FROM readings
  `;

  const params = [];
  if (sessionId) {
    query += ' WHERE session_id = ?';
    params.push(sessionId);
  }

  return queryOne(query, params);
}

function exportCSV(filters = {}) {
  const readings = getReadings(filters);

  const headers = ['Timestamp', 'Dose Rate (uSv/h)', 'Temperature', 'Humidity', 'Latitude', 'Longitude', 'Satellites'];
  const rows = readings.map(r => [
    r.timestamp,
    r.dose_rate,
    r.temperature,
    r.humidity,
    r.latitude || '',
    r.longitude || '',
    r.satellites || 0
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });

  return csv;
}

module.exports = {
  insertReading,
  getReadings,
  getLatestReading,
  getReadingsForMap,
  getDoseStats,
  exportCSV
};
