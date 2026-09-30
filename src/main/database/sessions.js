const { queryAll, queryOne, runSql } = require('./db');

function startSession(notes = '') {
  return runSql(
    'INSERT INTO sessions (start_time, notes) VALUES (?, ?)',
    [new Date().toISOString(), notes]
  );
}

function endSession(sessionId) {
  const stats = queryOne(`
    SELECT
      COUNT(*) as total_readings,
      AVG(dose_rate) as avg_dose_rate,
      MAX(dose_rate) as max_dose_rate,
      MIN(dose_rate) as min_dose_rate,
      AVG(temperature) as avg_temperature,
      AVG(humidity) as avg_humidity
    FROM readings
    WHERE session_id = ?
  `, [sessionId]);

  runSql(`
    UPDATE sessions SET
      end_time = ?,
      total_readings = ?,
      avg_dose_rate = ?,
      max_dose_rate = ?,
      min_dose_rate = ?,
      avg_temperature = ?,
      avg_humidity = ?
    WHERE id = ?
  `, [
    new Date().toISOString(),
    stats?.total_readings || 0,
    stats?.avg_dose_rate || 0,
    stats?.max_dose_rate || 0,
    stats?.min_dose_rate || 0,
    stats?.avg_temperature || 0,
    stats?.avg_humidity || 0,
    sessionId
  ]);

  return stats;
}

function getSessions() {
  return queryAll('SELECT * FROM sessions ORDER BY start_time DESC');
}

module.exports = { startSession, endSession, getSessions };
