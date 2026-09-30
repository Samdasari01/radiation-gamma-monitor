const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;
let dbPath = null;

function getDbPath() {
  const { app } = require('electron');
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'data', 'radiation_monitor.db');
  }
  return path.join(__dirname, '..', '..', '..', 'data', 'radiation_monitor.db');
}

async function initializeDatabase() {
  dbPath = getDbPath();
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const wasmPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const SQL = await initSqlJs({
    locateFile: file => {
      if (file.endsWith('.wasm')) return wasmPath;
      return file;
    }
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  createTables();
  saveDatabase();

  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      timestamp TEXT NOT NULL,
      dose_rate REAL NOT NULL DEFAULT 0,
      temperature REAL DEFAULT 0,
      humidity REAL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      satellites INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      total_readings INTEGER DEFAULT 0,
      avg_dose_rate REAL DEFAULT 0,
      max_dose_rate REAL DEFAULT 0,
      min_dose_rate REAL DEFAULT 999999,
      avg_temperature REAL DEFAULT 0,
      avg_humidity REAL DEFAULT 0,
      notes TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_readings_session ON readings(session_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_readings_dose ON readings(dose_rate);`);
}

function saveDatabase() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDb() {
  return db;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return { changes: db.getRowsModified(), lastId: queryOne('SELECT last_insert_rowid() as id')?.id };
}

module.exports = { initializeDatabase, getDb, saveDatabase, queryAll, queryOne, runSql };
