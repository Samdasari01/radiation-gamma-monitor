# ARGM — Software Specification

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Software Components

| Component | Tech | Role |
|-----------|------|------|
| Electron main process | Electron 43 | System services, IPC, windows |
| React renderer | React 19 + Vite 8 | SPA user interface |
| Tailwind CSS | v4 | Styling engine |
| Leaflet | 1.9.4 | Offline map rendering |
| Recharts | 3.10 | Data visualization |
| sql.js | 1.14.1 | SQLite-in-WASM persistence |
| serialport | 13 | Serial COM port access |
| Express | 5.2 | Embedded tile HTTP server |
| dayjs / uuid | — | Utilities |

## 2. Main Process Modules

### 2.1 Application Entry (`main.js`)

- Creates transparent frameless `splashWindow` on ready
- Runs DB init, tile server, serial manager, IPC registration in parallel
- Waits a minimum 15-second splash duration
- Creates main window (1400×900 / min 1024×768, dark background)
- Handles `window-all-closed` and `activate` lifecycle

### 2.2 Preload Bridge (`preload.js`)

Exposes `window.electronAPI` with namespaces:

- `serial` — getPorts, connect, disconnect, onData, onConnectionChange
- `database` — insertReading, getReadings, getLatestReading, getReadingsForMap, getDoseStats, getSessionStats, startSession, endSession, getSessions, exportCSV
- `settings` — get, save
- `map` — getTileUrl, hasOfflineTiles, isPackaged

### 2.3 SerialManager (`serial/serialManager.js`)

- `SerialPort.list()` → sanitized port array
- Promise-based `connect`/`disconnect`
- `\r\n` ReadlineParser
- Line classification router (NMEA / JSON / custom / key=value)
- Key normalization + 100 ms throttle
- EventEmitter-based push (`status`, `rawData`, `nmea`, `sensorData`, `customData`)
- `sendToRenderer(channel, data)` guarded by window liveness

### 2.4 DataProcessor (`serial/dataProcessor.js`)

- Holds merged state: doseRate, cpm, temperature, humidity, lat/lon, satellites, timestamp
- Partial-update merge semantics (object inputs) or NMEA positional update
- ISO timestamp stamp on updates

### 2.5 TileServer (`tileServer.js`)

- Express static server bound to loopback
- `getOfflineTilesPath()` resolves resources path when packaged vs dev
- Dynamic port; `maxAge: '1d'`, `immutable: true`
- `hasOfflineTiles()` detects numeric zoom directories

## 3. Renderer Modules

### 3.1 App Shell (`App.jsx`)

State:
- `currentData`, `readings[500]`, `settings`, `connectionStatus`
- `alarmSeverity`, `alarmMuted`, `flashActive`

Behavior:
- Loads settings on mount
- Auto-connects when `autoConnect` enabled
- Auto-logs to DB at `logInterval`
- Monitors dose severity and drives alarm engine
- Red flash overlay at severity ≥ 3

### 3.2 Pages

| Page | State | Core UI |
|------|-------|---------|
| Dashboard | currentData, readings, settings | 5 gauges, map, chart, LIVE badge |
| Charts | readings, currentData | time pills, area/line toggle, 3 charts, IAEA legend |
| History | filters, readings | table, date/dose filters, CSV export |
| Settings | form, ports, status | sections: serial, thresholds, logging, map, units, alerts |

### 3.3 Components

- **Sidebar**: brand, live dose + neon color, progress bar, alarm panel + mute, connection dot, 4-item nav.
- **LiveGauges**: `ArcGauge` SVG component (animated easing, glow), dose "hero" card, CPM/temp/humidity/satellite arcs.
- **DoseChart**: Recharts `AreaChart`, gradients, IAEA ReferenceArea/ReferenceLine, glass tooltip, 200-point window.
- **MapView**: Leaflet map, div-icon current marker with ring-pulse + label, trail `circleMarker`s, color-coded markers + glass popups, load spinner, online fallback.

### 3.4 Utilities

**iaeaScale.js** — the single source of truth for levels, colors, labels, severity and unit formatting (µSv/h, mSv/h, mR/h).

**alarmSystem.js** — singleton audio engine:
- lazy AudioContext init + resume
- master gain (mute ramp 0.15s, level 0.0/0.6)
- severity→pattern scheduler
- oscillator/gain/filter node orchestration
- safe `destroy()` teardown

---

## 4. Settings Model

### 4.1 Default Configuration

| Key | Default | Category |
|-----|---------|----------|
| serialPort | `""` | Serial |
| baudRate | `"115200"` | Serial |
| autoConnect | `false` | Serial |
| doseNormal | `0.5` | Thresholds |
| doseElevated | `2.0` | Thresholds |
| doseCaution | `10.0` | Thresholds |
| doseWarning | `100.0` | Thresholds |
| logInterval | `1000` | Logging |
| autoLogEnabled | `true` | Logging |
| mapZoom | `15` | Map |
| mapCenterLat | `20.5937` | Map |
| mapCenterLon | `78.9629` | Map |
| showTrail | `true` | Map |
| trailColor | `#22c55e` | Map |
| temperatureUnit | `C` | Display |
| doseUnit | `microSv` | Display |
| alertEnabled | `true` | Alerts |
| alertThreshold | `10.0` | Alerts |

### 4.2 Persistence

Settings are JSON-stringified per key in the `settings` SQLite table with `INSERT OR REPLACE`, loaded at startup, merged over defaults (DB wins).

---

*Next: See `../05-database/DATABASE-SPEC.md`.*