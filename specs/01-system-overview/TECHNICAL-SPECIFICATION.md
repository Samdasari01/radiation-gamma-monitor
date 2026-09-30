# ARGM — Advanced Radiation Gamma Monitor

## Complete Technical Specification

**Document Version:** 1.0.0
**System Version:** 1.0.0
**Date:** 14 September 2026
**Classification:** Technical Specification — For Proposal Submission

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [System Composition](#2-system-composition)
3. [Hardware Specification](#3-hardware-specification)
4. [Firmware Specification](#4-firmware-specification)
5. [Software Specification](#5-software-specification)
6. [System Architecture](#6-system-architecture)
7. [Data Specifications](#7-data-specifications)
8. [Communication Protocols](#8-communication-protocols)
9. [Database Specification](#9-database-specification)
10. [Mapping & Geolocation](#10-mapping--geolocation)
11. [Radiation Classification System](#11-radiation-classification-system)
12. [Alert & Alarm System](#12-alert--alarm-system)
13. [User Interface Specification](#13-user-interface-specification)
14. [Security Specifications](#14-security-specifications)
15. [Performance & Reliability](#15-performance--reliability)
16. [Deployment & Distribution](#16-deployment--distribution)
17. [Testing & Quality](#17-testing--quality)
18. [Standards Compliance](#18-standards-compliance)
19. [Specifications Summary](#19-specifications-summary)
20. [Glossary](#20-glossary)

---

## 1. Product Overview

### 1.1 Purpose

ARGM (Advanced Radiation Gamma Monitor) is a complete, self-contained IoT radiation monitoring platform. It consists of an ESP32-based hardware sensor node and a desktop monitoring application. The system acquires real-time gamma radiation dose rates from a Geiger-Müller tube, merges them with environmental telemetry (temperature, humidity) and GPS position data, and provides laboratory-grade visualization, historical logging, geospatial mapping, and multi-level audio alarming.

### 1.2 Design Objectives

| Objective | Description |
|-----------|-------------|
| Real-time monitoring | Continuous radiation dose-rate display at 1-second resolution |
| Accurate geolocation | GPS-tracked measurements displayed on an interactive map |
| Full offline operation | Complete functionality without internet access |
| Data integrity | Persistent, queryable, exportable historical data |
| Safety alerting | Timely, escalating audio/visual alarms for radiation levels |
| Standards alignment | IAEA-aligned radiation classification scheme |

### 1.3 Key Capabilities

- Real-time radiation dose rate monitoring (µSv/h) and CPM (Counts Per Minute)
- GPS-tracked measurements rendered on an offline Leaflet map
- Environmental telemetry: temperature (°C) and relative humidity (%)
- Session-based data collection with automatic statistics
- Multi-criteria historical data query and CSV export
- IAEA 5-level radiation classification with color-coded presentation
- 4-level programmable audio alarm system (Web Audio API, no audio files)
- Offline tile map covering India (zoom 5–9, ~2,900 tiles, ~43 MB)
- Animated boot splash screen with parallel backend initialization
- Custom multi-format serial data ingestion (JSON, NMEA, key=value, delimited)

### 1.4 Target Users

- Radiation safety professionals and environmental monitoring teams
- Industrial and institutional users performing site surveys
- Field personnel conducting area radiation assessments
- Regulatory and emergency response personnel

---

## 2. System Composition

The ARGM platform comprises two distinct subsystems that communicate over a USB serial link:

```
┌─────────────────────────┐        USB-Serial        ┌────────────────────────────┐
│                         │  (115200 baud, 8N1)      │                            │
│  HARDWARE SENSOR NODE   │ ◄──────────────────────► │  DESKTOP MONITORING APP     │
│                         │      JSON @ 1 Hz         │                            │
│  • ESP32 Dev Board      │                          │  • Electron 43 runtime      │
│  • Geiger-Müller Tube   │                          │  • React 19 SPA             │
│  • DHT22 Temp/Humidity  │                          │  • SQLite (sql.js) DB       │
│  • NEO-6M GPS Module    │                          │  • Leaflet offline map      │
│                         │                          │  • Recharts visualizations  │
│  • Arduino Firmware     │                          │  • Web Audio alarm system   │
└─────────────────────────┘                          └────────────────────────────┘
```

### 2.1 Hardware Node

The hardware node is a battery- or USB-powered field instrument that measures ambient gamma radiation and environmental conditions, geolocates itself via GPS, and emits a normalized JSON telemetry frame once per second.

### 2.2 Desktop Application

A desktop application for Windows/Linux that ingests, processes, stores, visualizes, and annunciates the telemetry. It is fully self-contained: all map data, the database engine, and the alarm synthesis are local.

---

## 3. Hardware Specification

### 3.1 Component Inventory

| Component | Model/Type | Role |
|-----------|-----------|------|
| Microcontroller | ESP32 (Xtensa LX6 dual-core) | System control, sensing, GPS, telemetry output |
| Radiation Sensor | Geiger-Müller tube | Gamma/beta detection via pulse counting |
| Temperature/Humidity | DHT22 | Ambient environmental telemetry |
| GPS Receiver | NEO-6M (u-blox) | Positioning, UTC time, speed |
| Power | USB 5V / 3.3V regulated | Board supply |
| Host Interface | USB-Serial (CP210x/CH340) | Telemetry output to host |

### 3.2 Pin Configuration

| GPIO | Function | Mode | Detail |
|------|----------|------|--------|
| GPIO 2 | Geiger tube pulse input | `INPUT_PULLUP` | Falling-edge hardware interrupt |
| GPIO 4 | DHT22 data line | Digital I/O | 1-Wire protocol |
| GPIO 16 | GPS module TX → ESP RX | SoftwareSerial RX | 9600 baud |
| GPIO 17 | ESP TX → GPS module RX | SoftwareSerial TX | 9600 baud |

### 3.3 Electrical & Interface Specification

| Interface | Specification |
|-----------|--------------|
| USB baud rate | 115200 (configurable in app) |
| GPS baud rate | 9600 |
| Frame interval | 1000 ms (configurable in firmware) |
| Pulse input | Falling-edge, internal pull-up, interrupt-driven |
| Operating voltage | 3.3 V logic (5 V tolerant USB) |
| Geiger tube supply | ~400–600 V (external booster circuit assumed per tube model) |

### 3.4 Calibration

| Parameter | Value | Equation |
|-----------|-------|----------|
| CPM calculation | count × 60 | `CPM = pulses_in_1s × 60` |
| Calibration factor | 0.0081 | Tube-specific, constant per detector |
| Dose rate | CPM × 0.0081 | `µSv/h = CPM × CALIBRATION_FACTOR` |

The calibration factor encodes the Geiger-Müller tube's sensitivity (conversion from raw count rate to effective dose equivalent rate in µSv/h) and must be verified per tube model.

---

## 4. Firmware Specification

### 4.1 Firmware Overview

- **Platform:** Arduino (C++), ESP32 board package
- **Language:** C++17 (Arduino Core)
- **File:** `firmware/radiation_monitor/radiation_monitor.ino`
- **Libraries:** `SoftwareSerial`, `TinyGPS++`, `DHT`

### 4.2 Firmware Responsibilities

- Count Geiger tube pulses via hardware interrupt (`IRAM_ATTR` ISR)
- Compute CPM and dose rate from pulse counts
- Read temperature and humidity from DHT22
- Parse NMEA sentences from the GPS module continuously
- Assemble and emit a JSON telemetry frame every 1000 ms
- Handle `isnan()` sensor failures with graceful zero fallback

### 4.3 Interrupt Handler

```cpp
volatile unsigned long pulseCount = 0;
void IRAM_ATTR countPulse() { pulseCount++; }
```

The ISR is declared `IRAM_ATTR` for RAM execution, and the shared counter is read under `noInterrupts()/interrupts()` mutual exclusion to prevent torn reads.

### 4.4 Output Frame Specification

Emitted once per second on the USB serial at 115200 baud:

```json
{
  "lat": 28.613900,
  "lon": 77.209000,
  "satellites": 8,
  "gps_valid": true,
  "dose": 0.1234,
  "cpm": 15.2,
  "temp": 28.5,
  "hum": 65.3,
  "time": "14:30:45"
}
```

### 4.5 Firmware Field Reference

| Field | Type | Precision | Range/Notes |
|-------|------|-----------|-------------|
| `lat` | float / null | 6 decimals | Decimal degrees; `null` when GPS invalid |
| `lon` | float / null | 6 decimals | Decimal degrees; `null` when GPS invalid |
| `satellites` | integer | — | GPS satellites in fix |
| `gps_valid` | boolean | — | Live GPS lock status |
| `dose` | float | 4 decimals | Dose rate in µSv/h |
| `cpm` | float | 1 decimal | Counts per minute |
| `temp` | float | 1 decimal | °C; `0` on sensor failure |
| `hum` | float | 1 decimal | % RH; `0` on sensor failure |
| `time` | string | — | `HH:MM:SS` UTC when GPS time valid |

---

## 5. Software Specification

### 5.1 Runtime & Framework Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Electron | ^43.2.0 |
| UI Framework | React | ^19.2.8 |
| Build Tool | Vite | ^8.1.5 |
| CSS Framework | Tailwind CSS | ^4.3.3 |
| Map Library | Leaflet | ^1.9.4 |
| Map React Bindings | react-leaflet | ^5.0.0 |
| Charting | Recharts | ^3.10.0 |
| Database | sql.js (SQLite WASM) | ^1.14.1 |
| Serial Communication | serialport | ^13.0.0 |
| Serial Parser | @serialport/parser-readline | ^13.0.0 |
| Embedded Tile Server | Express | ^5.2.1 |
| Date Utilities | dayjs | ^1.11.21 |
| UUID Generation | uuid | ^14.0.1 |
| Audio Synthesis | Web Audio API (native) | — |

### 5.2 Development Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| electron-builder | ^26.15.3 | Packaging and installers |
| @vitejs/plugin-react | ^6.0.4 | Vite React integration |
| @tailwindcss/vite | ^4.3.3 | Tailwind integration into Vite |
| concurrently | ^10.0.3 | Parallel development processes |
| cross-env | ^10.1.0 | Cross-platform environment variables |
| wait-on | ^9.1.0 | Orchestrates dev server readiness |

### 5.3 Application Modes

| Mode | Behavior |
|------|----------|
| Development | Vite dev server on port 5173 + Electron with DevTools open |
| Production | Loads bundled renderer from `src/renderer/dist/index.html` |

---

## 6. System Architecture

### 6.1 Process Architecture

The application is a two-process Electron application with strict process isolation.

```
┌──────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS                             │
│                                                               │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │ SerialManager│  │ Tile Server   │  │ Database (sql.js)  │  │
│  │  • ports     │  │  Express 5    │  │  • readings        │  │
│  │  • connect   │  │  127.0.0.1    │  │  • sessions        │  │
│  │  • classify  │  │  /tiles/*     │  │  • settings        │  │
│  │  • throttle  │  │  dynamic port │  │  • CSV export      │  │
│  └──────┬───────┘  └──────┬────────┘  └────────┬───────────┘  │
│         │                 │                    │              │
│         └──────┬──────────┴────────────────────┘              │
│                ▼                                               │
│        ┌─────────────────┐                                    │
│        │  IPC Handlers   │  ipcMain.handle / ipcMain.send     │
│        └────────┬────────┘                                    │
└─────────────────┼──────────────────────────────────────────────┘
                  │ contextBridge (preload.js)
┌─────────────────┼──────────────────────────────────────────────┐
│           RENDERER PROCESS                                     │
│                 │                                              │
│  ┌──────────────┴───────────────┐                              │
│  │  App.jsx (state + alarms)    │                              │
│  ├───────┬───────┬──────┬───────┤                              │
│  │Dashboard│Charts│History│Settings│                            │
│  ├──────────────────────────────┤                              │
│  │ Sidebar | LiveGauges | DoseChart | MapView                  │
│  ├──────────────────────────────┤                              │
│  │ AlarmSystem (Web Audio) | IAEA Scale utils                  │
│  └──────────────────────────────┘                              │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 Module Inventory (Main Process)

| Module | File | Responsibility |
|--------|------|----------------|
| Application Entry | `src/main/main.js` | Window lifecycle, boot orchestration, splash |
| Preload Bridge | `src/main/preload.js` | `contextBridge` exposure of `window.electronAPI` |
| Splash Screen | `src/main/splash.html` | Frameless boot animation |
| Tile Server | `src/main/tileServer.js` | Express static tile host, offline detection |
| Serial Manager | `src/main/serial/serialManager.js` | Port list/connect/disconnect, line routing |
| NMEA Parser | `src/main/serial/nmeaParser.js` | GGA/RMC/GLL parsing, checksum verification |
| Data Processor | `src/main/serial/dataProcessor.js` | Multi-source state merging, normalization |
| Database Core | `src/main/database/db.js` | sql.js bootstrap, schema, persistence |
| Readings DAO | `src/main/database/readings.js` | Reading CRUD, stats, CSV |
| Sessions DAO | `src/main/database/sessions.js` | Session lifecycle and roll-up stats |
| IPC Handlers | `src/main/ipc/handlers.js` | Register all `ipcMain.handle` channels |
| Settings Module | `src/main/ipc/settings.js` | Defaults, read/write settings table |

### 6.3 Module Inventory (Renderer Process)

| Module | File | Responsibility |
|--------|------|----------------|
| React Root | `src/renderer/src/main.jsx` | Mounts `<App/>` |
| App Shell | `src/renderer/src/App.jsx` | Global state, alarm monitoring, auto-log |
| Sidebar | `components/Sidebar.jsx` | Navigation, live dose, alarm, connection status |
| Live Gauges | `components/LiveGauges.jsx` | 5 SVG arc gauge cards |
| Dose Chart | `components/DoseChart.jsx` | Real-time Recharts area chart (200 pts) |
| Map View | `components/MapView.jsx` | Leaflet map, markers, trail, popups |
| Dashboard | `pages/Dashboard.jsx` | Status bar, gauges, map, chart layout |
| Charts | `pages/Charts.jsx` | Analytics: dose/temp/humidity + IAEA legend |
| History | `pages/History.jsx` | Filterable table + CSV export |
| Settings | `pages/Settings.jsx` | All configuration forms |
| IAEA Scale | `utils/iaeaScale.js` | Classification, colors, formatting |
| Alarm System | `utils/alarmSystem.js` | Web Audio synthesis engine |

### 6.4 Boot Sequence

1. App ready → create frameless transparent `splashWindow` (520×480)
2. In parallel: `initializeDatabase()` → `startTileServer()` → `new SerialManager()` → `registerIpcHandlers()`
3. Minimum splash duration: 15 s (or until initialization completes, whichever is later)
4. Create main `BrowserWindow` (1400×900, min 1024×768, dark background `#0a0f1a`)
5. On `ready-to-show`: close splash, show and focus main window
6. Hand window reference to `SerialManager` for renderer push events

---

## 7. Data Specifications

### 7.1 Canonical Live Reading Object

Delivered renderer-side via `serial:data` and consumed by Charts/Dashboard:

```javascript
{
  doseRate: 0.1234,          // µSv/h
  cpm: 15,                   // counts per minute
  temperature: 28.5,         // °C
  humidity: 65.3,            // % RH
  latitude: 28.6139,         // decimal degrees or null
  longitude: 77.209,         // decimal degrees or null
  satellites: 8,             // GPS satellites
  timestamp: "2026-09-14T10:00:00.000Z"  // ISO 8601
}
```

### 7.2 Key Normalization Table

| Accepted Input Keys | Normalized Key |
|---------------------|----------------|
| `dose`, `doserate`, `doseRate` | `doseRate` |
| `temp`, `t`, `temperature` | `temperature` |
| `hum`, `h`, `humidity` | `humidity` |
| `lat`, `latitude` | `latitude` |
| `lon`, `longitude` | `longitude` |
| `satellites`, `sat` | `satellites` |
| `cpm` | `cpm` |

### 7.3 Line Classification Rules

| Condition | Interpretation | Route |
|-----------|---------------|-------|
| Starts with `$` | NMEA GPS sentence | NMEAParser → DataProcessor |
| Starts with `{` (valid JSON) | JSON telemetry | JSON.parse → DataProcessor |
| Starts with `DOSE:` / `TEMP:` / `HUM:` | Custom pipe-delimited | parseCustomFormat → DataProcessor |
| Contains `=` | key=value pairs | parseKeyValue → DataProcessor |

### 7.4 Processing Throttle

A 100 ms minimum inter-line processing interval guards the renderer against high-baud flooding.

---

## 8. Communication Protocols

### 8.1 Serial Protocol

| Parameter | Value |
|-----------|-------|
| Data bits | 8 |
| Stop bits | 1 |
| Parity | None |
| Line delimiter | `\r\n` |
| Default baud | 115200 (selectable up to 921600 in UI) |
| Throttle | 100 ms per processed line |

### 8.2 NMEA Parsing Support

| Sentence | Handler | Extracted Data |
|----------|---------|----------------|
| GGA / GNGGA | `parseGGA` | Position, fix quality, satellites, altitude |
| RMC / GNRMC | `parseRMC` | Position, speed (km/h), track |
| GLL / GNGLL | `parseGLL` | Position |

**Coordinate formats:** `DDMM.MMMM` (NMEA) and `DD.dddd` (decimal) both parsed; South/West hemisphere negation applied.

**Validation:** XOR checksum verified over characters between `$` and `*`.

### 8.3 Embedded Tile Server

| Property | Value |
|----------|-------|
| Framework | Express 5 |
| Bind address | `127.0.0.1` (loopback only) |
| Port | OS-assigned dynamic |
| Route | `/tiles/{z}/{x}/{y}.png` |
| Cache-control | `max-age=86400, immutable` |
| Fallback | Online OpenStreetMap when offline tiles missing |
| Purge | `stopTileServer()` on app quit |

---

## 9. Database Specification

### 9.1 Engine

- **sql.js 1.14** — SQLite compiled to WebAssembly
- In-memory engine with synchronous file export on every mutation
- Database file: `data/radiation_monitor.db`
- Packaged path: `process.resourcesPath/data/radiation_monitor.db`
- No native compilation required (pure WASM)

### 9.2 Schema — `readings`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| session_id | INTEGER | FK → sessions(id), NULLABLE |
| timestamp | TEXT | NOT NULL |
| dose_rate | REAL | NOT NULL DEFAULT 0 |
| temperature | REAL | DEFAULT 0 |
| humidity | REAL | DEFAULT 0 |
| latitude | REAL | NULLABLE |
| longitude | REAL | NULLABLE |
| satellites | INTEGER | DEFAULT 0 |
| created_at | TEXT | DEFAULT `datetime('now')` |

### 9.3 Schema — `sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| start_time | TEXT | NOT NULL |
| end_time | TEXT | NULLABLE |
| total_readings | INTEGER | DEFAULT 0 |
| avg_dose_rate | REAL | DEFAULT 0 |
| max_dose_rate | REAL | DEFAULT 0 |
| min_dose_rate | REAL | DEFAULT 999999 |
| avg_temperature | REAL | DEFAULT 0 |
| avg_humidity | REAL | DEFAULT 0 |
| notes | TEXT | NULLABLE |

### 9.4 Schema — `settings`

| Column | Type | Constraints |
|--------|------|-------------|
| key | TEXT | PRIMARY KEY |
| value | TEXT | NOT NULL (JSON-encoded) |
| updated_at | TEXT | DEFAULT `datetime('now')` |

### 9.5 Indexes

```sql
CREATE INDEX idx_readings_timestamp ON readings(timestamp);
CREATE INDEX idx_readings_session ON readings(session_id);
CREATE INDEX idx_readings_dose ON readings(dose_rate);
```

### 9.6 Query Operations

| Operation | Description |
|-----------|-------------|
| `insertReading(reading)` | Insert full sensor reading |
| `getReadings(filters)` | sessionId, startDate, endDate, minDose, maxDose, limit |
| `getLatestReading()` | Latest row by created_at |
| `getReadingsForMap()` | Geo-tagged rows ordered by timestamp |
| `getDoseStats(sessionId?)` | COUNT/AVG/MAX/MIN dose + avg temp/humidity |
| `startSession(notes)` | Create session |
| `endSession(id)` | Roll up aggregate stats into session |
| `getSessions()` | All sessions chronological |
| `exportCSV(filters)` | CSV string with headers + formatted rows |

### 9.7 CSV Export Format

| Header | Source |
|--------|--------|
| Timestamp | `timestamp` |
| Dose Rate (uSv/h) | `dose_rate` |
| Temperature | `temperature` |
| Humidity | `humidity` |
| Latitude | `latitude` |
| Longitude | `longitude` |
| Satellites | `satellites` |

---

## 10. Mapping & Geolocation

### 10.1 Offline Tile System

| Property | Value |
|----------|-------|
| Region | India (bounds: 6.0°S–37.0°N, 68.0°E–98.0°E) |
| Zoom range | 5–9 |
| Tile count | ~2,903 |
| Storage | ~43 MB |
| Tile format | PNG 256×256 |
| Source | OpenStreetMap |
| Bundled | `src/assets/offline-tiles/` → installed to `resources/offline-tiles/` |

### 10.2 Tile Downloader (`scripts/download-tiles.js`)

| Capability | Value |
|-----------|-------|
| Concurrency | 6 parallel |
| Polite delay | 50 ms per batch |
| Resumability | Skips existing tiles |
| CLI flags | `--min-zoom`, `--max-zoom`, `--bounds` |
| User agent | `RadiationMonitor/1.0` |
| Output | `src/assets/offline-tiles/{z}/{x}/{y}.png` |

### 10.3 Map Feature Set

- Offline-first tile selection with automatic online fallback
- Darkened tile filter: `brightness(0.65) contrast(1.15) saturate(0.8)`
- Pulsing ring current-position marker with dose label
- Color-coded dose markers (IAEA colors)
- GPS trail (configurable color, toggleable)
- Glass-styled popups with dose, level, and timestamp
- Animated map-loading state

---

## 11. Radiation Classification System

### 11.1 IAEA Scale (5 Levels)

| Severity | Label | Range (µSv/h) | Color | Description |
|----------|-------|---------------|-------|-------------|
| 0 | Normal Background | 0 – 0.5 | `#22c55e` | Normal background |
| 1 | Slightly Elevated | 0.5 – 2.0 | `#eab308` | Investigation recommended |
| 2 | Elevated — Caution | 2.0 – 10.0 | `#f97316` | Use caution |
| 3 | High — Warning | 10.0 – 100.0 | `#ef4444` | Restricted access |
| 4 | Dangerous — Critical | > 100.0 | `#991b1b` | Evacuate immediately |

### 11.2 Default Thresholds

| Threshold | Default (µSv/h) | Configurable |
|-----------|-----------------|--------------|
| Normal | 0.5 | Yes |
| Elevated | 2.0 | Yes |
| Caution | 10.0 | Yes |
| Warning | 100.0 | Yes |
| Alert trigger | 10.0 | Yes |

### 11.3 Utility API

| Function | Output |
|----------|--------|
| `getDoseColor(dose)` | Hex color string |
| `getDoseBgColor(dose)` | 20%-alpha background hex |
| `getDoseLabel(dose)` | Human label |
| `getDoseSeverity(dose)` | 0–4 (or -1 for no-data) |
| `getDoseLevel(dose)` | Full level object |
| `getAllLevels()` | All levels + display ranges |
| `formatDoseRate(value, unit)` | Formatted string (µSv/h, mSv/h, mR/h) |

---

## 12. Alert & Alarm System

### 12.1 Architecture

- Pure Web Audio API synthesis — no bundled audio assets
- Singleton `AlarmSystem` instance
- Lazy `AudioContext` creation on first user gesture (autoplay-policy compliant)
- Master gain node with smooth mute ramp (0.15 s time constant)
- Severity change events propagate to React state

### 12.2 Severity Trigger Logic

| Condition | Severity | Pattern |
|-----------|----------|---------|
| dose ≥ warning OR dose ≥ alert×5 | 4 | Dual-harmonic nuclear siren |
| dose ≥ caution OR dose ≥ alert×2 | 3 | Wailing sweep |
| dose ≥ elevated OR dose ≥ alert | 2 | Alternating triple-beep |
| dose ≥ normal | 1 | Slow double beep |
| otherwise | 0 | Silent |

### 12.3 Audio Pattern Specification

| Severity | Waveform | Frequency | Timbre | Cycle |
|----------|----------|-----------|--------|-------|
| 1 | sine | 880 Hz | 0.15 s beeps ×2 | 2 s |
| 2 | sine | 1000/1200 Hz | 0.12 s ×4 | 1.2 s |
| 3 | sawtooth | 600→1000→600 Hz | lowpass 2 kHz | 0.85 s/cycle, 1 s |
| 4 | sawtooth + sine | 300→1200 Hz + 600→2400 Hz | lowpass 3 kHz, dual harmonic | 1.6 s, 1.8 s cycle |

### 12.4 Visual Alert Behavior

- Screen flash overlay at severity ≥ 3 (red radial at 4, orange at 3)
- Sidebar severity bar (5 segments) and status label
- Mute toggle with animated speech-style indicator
- Neon glow on the live dose display

---

## 13. User Interface Specification

### 13.1 Window Specifications

| Property | Value |
|----------|-------|
| Main window | 1400 × 900 px |
| Minimum size | 1024 × 768 px |
| Background | `#0a0f1a` |
| Splash window | 520 × 480, frameless, transparent, always-on-top |
| Theme | Dark glassmorphism (slate-900 family) |

### 13.2 Pages

| Page | Functionality |
|------|---------------|
| Dashboard | Live gauges (5 cards), offline map, dose-rate chart, live status badge, GPS coords |
| Analytics | Time-range filter (1m/5m/15m/1h/all), area/line toggle, IAEA reference bands, temperature & humidity charts, IAEA legend |
| History | Filterable table (date range, dose range, limit), level badges, CSV export |
| Settings | Serial port/baud selection, connect/disconnect, IAEA thresholds, logging, map options, units, alerts |

### 13.3 Design System Elements

- Glass cards: `rgba(15,23,42,0.6)` + `backdrop-blur(16px)` + 1px bordered radius 16
- Gradient text, glow borders, noise overlay
- Neon utilities: green/yellow/orange/red/purple/blue
- Custom animations: float, shimmer, radar-sweep, glow-pulse, scan-line, fade-in-up, scale-in, ring-pulse, data-flow
- Staggered entrance delays (0.05–0.25 s)

### 13.4 Splash Screen Content

- Rotating double-ring animation around company logo
- Gradient ARGM title with subtitle
- Status text cycling through boot stages; footer loading bar with percentile counter
- Ambient floating particles

---

## 14. Security Specifications

| Controls | Configuration |
|----------|---------------|
| Renderer isolation | `contextIsolation: true` |
| Node integration | `nodeIntegration: false` |
| Preload bridge | `contextBridge.exposeInMainWorld('electronAPI', ...)` only |
| CSP | Meta header: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://127.0.0.1:* https://tile.openstreetmap.org; connect-src 'self' http://127.0.0.1:*; font-src 'self'` |
| Tile server | Loopback-bound only (`127.0.0.1`) |
| Sensitive data | No credentials, tokens, or keys used or stored |
| Firmware data | No external network calls made by firmware |

---

## 15. Performance & Reliability

| Area | Specification |
|------|---------------|
| Telemetry cadence | 1 reading/second |
| UI buffer | Last 500 readings in React state |
| Chart window | Last 200 readings |
| Serial throttle | 100 ms minimum inter-frame |
| Persistence | Synchronous file write after each mutation (crash-safe to last write) |
| Map performance | Local tile serving with 1-day immutable cache |
| Audio latency | Sub-50 ms scheduling; no audio file loading |
| Offline operation | 100% functional without network |
| Missing sensor data | Graceful zero/null fallbacks with `No Data` presentation |

---

## 16. Deployment & Distribution

### 16.1 Build Pipeline

```bash
npm run dev               # Development (Vite + Electron, hot reload)
npm run dev:renderer      # Vite only (localhost:5173)
npm run dev:electron      # Electron + DevTools (waits for Vite)
npm run build             # Production Windows build (NSIS)
npm run build:linux       # Production Linux build
npm run build:electron    # Renderer build + electron-builder
npm run download-tiles    # Tile downloader
npm run rebuild           # Electron native module rebuild
```

### 16.2 Packaging Configuration

| Setting | Value |
|---------|-------|
| App ID | `com.radiationmonitor.app` |
| Product name | Radiation Gamma Monitor |
| Output | `dist_electron/` |
| Win target | NSIS (non-oneClick, user-selectable install dir) |
| Files | `src/main/**`, `src/renderer/dist/**`, `src/assets/**` |
| Extra resources | `offline-tiles` → `resources/offline-tiles` |
| Icon | `src/assets/icon.ico` (Windows) |

### 16.3 Runtime Resources

| Resource | Location |
|----------|----------|
| Database (packaged) | `process.resourcesPath/data/radiation_monitor.db` |
| Offline tiles (packaged) | `process.resourcesPath/offline-tiles/` |
| Database (dev) | `data/radiation_monitor.db` (project root) |

---

## 17. Testing & Quality

### 17.1 Verification Approach

The system ships without an automated test harness; verification is performed through:

- Serial integration testing against the firmware telemetry stream (all 4 input formats)
- Database round-trip validation (insert → query → export)
- Offline tile server validation in dev vs. packaged mode
- Manual UI acceptance across all four pages
- Alarm audio verification across all 4 severities and mute states
- GPS fix/no-fix lat/lon null handling validation

### 17.2 Error Handling

| Failure | Behavior |
|---------|----------|
| Serial connect failure | Status event `{connected:false, error}` propagated to UI |
| Port in use | Error event surfaces status change |
| Invalid JSON on serial | Silent fallback to key=value parse |
| Missing tiles directory | Warning logged, online OSM fallback |
| Tile server failure | Caught, logged; renderer falls back to online tiles |
| DHT sensor fail (NaN) | Firmware emits 0; UI renders 0.0 |
| GPS no-fix | lat/lon null; markers skipped; map shows "No Data" |

---

## 18. Standards Compliance

| Reference | Application |
|-----------|-------------|
| IAEA General Safety Requirements | Radiation protection classification and level thresholds |
| NMEA 0183 | GPS sentence parsing (GGA/RMC/GLL) |
| RFC 8259 (JSON) | Telemetry frame serialization |
| CSV conventions | RFC 4180-style export layout |
| W3C Web Audio API | Alarm synthesis |
| OSM Tile Usage Policy | Rate-limited tile acquisition (50 ms batch delay, UA identified) |

---

## 19. Specifications Summary

| Specification | Details |
|---------------|---------|
| **Platform** | Windows (primary), Linux (supported) |
| **Runtime** | Electron 43.2 + Node.js main process |
| **UI** | React 19 SPA, Tailwind CSS 4, Vite 8 |
| **Database** | SQLite via sql.js WASM (3 tables, 3 indexes) |
| **Serial** | 115200 baud, 8N1, `\r\n` delimiter, 100 ms throttle |
| **Input Formats** | JSON, NMEA (GGA/RMC/GLL), key=value, pipe-delimited |
| **Map** | Leaflet 1.9 + local Express tile server; India zoom 5–9 (~2,903 tiles / ~43 MB) |
| **Charts** | Recharts 3 area/line; dose, temperature, humidity |
| **Classification** | IAEA 5-level; 0–4 severity; configurable thresholds |
| **Alarms** | 4-level Web Audio siren; mute; visual flash ≥ severity 3 |
| **Sessions** | Start/end with aggregate statistics |
| **Export** | CSV with 7 fields, date & dose filters |
| **IPC** | 18 request/response channels + 2 push events |
| **Security** | contextIsolation, no nodeIntegration, CSP, loopback-only server |
| **Offline** | Map tiles, database, alarms, serial — zero network dependency |
| **Firmware** | ESP32 Arduino; interrupt pulse counting; ×0.0081 calibration |
| **Boot** | 15 s animated splash with parallel init |

---

## 20. Glossary

| Term | Definition |
|------|-----------|
| ARGM | Advanced Radiation Gamma Monitor |
| CPM | Counts Per Minute — Geiger pulse rate |
| µSv/h | Microsievert per hour — dose equivalent rate |
| IAEA | International Atomic Energy Agency |
| GM Tube | Geiger-Müller tube — radiation detector |
| NMEA | National Marine Electronics Association GPS protocol |
| WASM | WebAssembly |
| W3C | World Wide Web Consortium |
| ISR | Interrupt Service Routine |
| NSIS | Nullsoft Scriptable Install System |

---

*End of Technical Specification — ARGM v1.0.0*