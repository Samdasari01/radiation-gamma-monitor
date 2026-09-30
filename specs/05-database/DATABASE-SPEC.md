# ARGM — Database Specification

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Engine

| Attribute | Value |
|-----------|-------|
| Engine | SQLite via sql.js 1.14 (WebAssembly) |
| WASM binary | `node_modules/sql.js/dist/sql-wasm.wasm` |
| Storage | Synchronous file export on every write |
| File path (dev) | `data/radiation_monitor.db` |
| File path (packaged) | `process.resourcesPath/data/radiation_monitor.db` |
| Native deps | None required |

## 2. Schema

### 2.1 readings

```sql
CREATE TABLE readings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER,
  timestamp  TEXT NOT NULL,
  dose_rate  REAL NOT NULL DEFAULT 0,
  temperature REAL DEFAULT 0,
  humidity   REAL DEFAULT 0,
  latitude   REAL,
  longitude  REAL,
  satellites INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 2.2 sessions

```sql
CREATE TABLE sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  start_time      TEXT NOT NULL,
  end_time        TEXT,
  total_readings  INTEGER DEFAULT 0,
  avg_dose_rate   REAL DEFAULT 0,
  max_dose_rate   REAL DEFAULT 0,
  min_dose_rate   REAL DEFAULT 999999,
  avg_temperature REAL DEFAULT 0,
  avg_humidity    REAL DEFAULT 0,
  notes           TEXT
);
```

### 2.3 settings

```sql
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## 3. Indexes

```sql
CREATE INDEX idx_readings_timestamp ON readings(timestamp);
CREATE INDEX idx_readings_session   ON readings(session_id);
CREATE INDEX idx_readings_dose      ON readings(dose_rate);
```

These support the most frequent query patterns: time-range scans, session joins, and dose-range filtering.

## 4. Query API

### 4.1 readings DAO

| Function | SQL | Parameters | Returns |
|----------|-----|-----------|---------|
| `insertReading()` | INSERT with all columns | Array of 8 values | `{lastId, changes}` |
| `getReadings(filters)` | SELECT * WHERE 1=1 + optional clauses | sessionId, startDate, endDate, minDose, maxDose, limit | Array of rows |
| `getLatestReading()` | SELECT * ORDER BY created_at DESC LIMIT 1 | — | Row or null |
| `getReadingsForMap()` | SELECT lat/lon/dose/timestamp WHERE lat+lon NOT NULL | — | Array of rows |
| `getDoseStats(sessionId?)` | SELECT COUNT/AVG/MAX/MIN | sessionId (optional) | `{totalReadings, avgDose, maxDose, minDose, avgTemp, avgHumidity}` |
| `exportCSV(filters)` | Delegates to `getReadings(filters)` then serializes | Same as getReadings | CSV string |

### 4.2 sessions DAO

| Function | Operation | Notes |
|----------|-----------|-------|
| `startSession(notes)` | INSERT session row | start_time = now |
| `endSession(id)` | SELECT aggregates → UPDATE session | Computes total, avg, max, min dose/temp/humidity |
| `getSessions()` | SELECT ORDER BY start_time DESC | All sessions |

### 4.3 settings DAO

| Function | Operation |
|----------|-----------|
| `getSettings()` | SELECT all rows → parse JSON → merge over `DEFAULT_SETTINGS` |
| `saveSettings(settings)` | For each key/value: `INSERT OR REPLACE` with JSON string |

## 5. Aggregation Queries

```sql
-- getDoseStats
SELECT
  COUNT(*)       as totalReadings,
  AVG(dose_rate) as avgDose,
  MAX(dose_rate) as maxDose,
  MIN(dose_rate) as minDose,
  AVG(temperature) as avgTemp,
  AVG(humidity)  as avgHumidity
FROM readings
[WHERE session_id = ?];

-- endSession roll-up
SELECT
  COUNT(*),
  AVG(dose_rate), MAX(dose_rate), MIN(dose_rate),
  AVG(temperature), AVG(humidity)
FROM readings WHERE session_id = ?
```

## 6. Persistence Strategy

| Event | Action |
|-------|--------|
| Any write (INSERT/UPDATE) | `db.export()` → `writeFileSync(dbPath, buffer)` |
| App startup | If file exists → `readFileSync` → `new SQL.Database(buffer)` |
| App startup | If file missing → `new SQL.Database()` (empty) → create tables → save |
| App quit | (implicit) last mutation was already flushed |

This ensures crash-safety to the last successful write without journaling complexity.

---

*Next: See `../06-api-integration/API-REFERENCE.md`.*