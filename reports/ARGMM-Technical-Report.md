# ARGM — Advanced Radiation Gamma Monitor

## Technical Report & System Documentation

**Version:** 1.0.0  
**Date:** 25 July 2026  
**Classification:** Internal Technical Report  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [Software Architecture](#4-software-architecture)
5. [Firmware — ESP32 Radiation Monitor](#5-firmware--esp32-radiation-monitor)
6. [Serial Communication Protocol](#6-serial-communication-protocol)
7. [Data Processing Pipeline](#7-data-processing-pipeline)
8. [Database Layer](#8-database-layer)
9. [Map System — Offline Tiles](#9-map-system--offline-tiles)
10. [IAEA Radiation Classification](#10-iaea-radiation-classification)
11. [Alarm & Alert System](#11-alarm--alert-system)
12. [User Interface](#12-user-interface)
13. [IPC Communication Layer](#13-ipc-communication-layer)
14. [Settings & Configuration](#14-settings--configuration)
15. [Build & Deployment](#15-build--deployment)
16. [System Architecture Diagram](#16-system-architecture-diagram)
17. [Specifications Summary](#17-specifications-summary)

---

## 1. Executive Summary

ARGM (Advanced Radiation Gamma Monitor) is a complete IoT radiation monitoring platform consisting of an ESP32-based hardware sensor node and a desktop monitoring application. The system reads real-time radiation dose rates from a Geiger-Müller tube, GPS coordinates, temperature, and humidity data, and displays everything on a premium dark-themed UI with offline map support, historical charts, session-based data logging, and multi-level audio alarms conforming to IAEA radiation protection standards.

**Key Capabilities:**
- Real-time radiation dose rate monitoring (µSv/h) and CPM (Counts Per Minute)
- GPS-tracked measurements on an offline Leaflet map
- Session-based data collection with CSV export
- IAEA 5-level radiation classification with color-coded alerts
- 4-level programmable audio alarm system (Web Audio API)
- Offline tile map covering India (zoom 5–9, ~2,900 tiles)
- Splash screen boot sequence with animated loading indicators

---

## 2. System Overview

The system comprises two main subsystems:

### 2.1 Hardware Node (ESP32)
- ESP32 microcontroller running Arduino firmware
- Geiger-Müller tube connected via pulse-counting circuit on GPIO 2
- DHT22 temperature/humidity sensor on GPIO 4
- NEO-6M GPS module on SoftwareSerial (GPIO 16/17)
- Transmits sensor data as JSON over USB-Serial at 115200 baud

### 2.2 Desktop Application (Electron + React)
- Electron 43 desktop application
- React 19 single-page application
- SQLite database (sql.js WASM) for persistent storage
- Leaflet map with offline tile server
- Recharts for data visualization
- Web Audio API for alarm sounds

### 2.3 Data Flow

```
Geiger Tube (GPIO 2) ──┐
                        │
DHT22 (GPIO 4) ────────┤──► ESP32 Firmware ──► JSON over Serial (115200 baud)
GPS Module (GPIO 16/17)┘                                              │
                                                                      ▼
                                         Electron Main Process ──► React UI
                                         (SerialManager + DB)     (Dashboard)
```

---

## 3. Technology Stack

### 3.1 Desktop Application

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Electron | ^43.2.0 |
| **UI Framework** | React | ^19.2.8 |
| **Build Tool** | Vite | ^8.1.5 |
| **CSS Framework** | Tailwind CSS | ^4.3.3 |
| **Map Library** | Leaflet | ^1.9.4 |
| **Charting** | Recharts | ^3.10.0 |
| **Database** | sql.js (SQLite WASM) | ^1.14.1 |
| **Serial Communication** | serialport | ^13.0.0 |
| **Tile Server** | Express | ^5.2.1 |
| **Date Utilities** | Day.js | ^1.11.21 |
| **UUID Generation** | uuid | ^14.0.1 |
| **Sound System** | Web Audio API (native) | — |

### 3.2 Firmware

| Component | Library | Details |
|-----------|---------|---------|
| **GPS Parsing** | TinyGPS++ | NMEA sentence parsing |
| **GPS Serial** | SoftwareSerial | GPIO 16 (RX), GPIO 17 (TX) @ 9600 baud |
| **Temp/Humidity** | DHT | DHT22 sensor on GPIO 4 |
| **Radiation Sensing** | Hardware Interrupt | GPIO 2, FALLING edge, `INPUT_PULLUP` |

### 3.3 Dev Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| electron-builder | ^26.15.3 | Packaging & installer |
| @vitejs/plugin-react | ^6.0.4 | Vite React integration |
| @tailwindcss/vite | ^4.3.3 | Tailwind Vite plugin |
| concurrently | ^10.0.3 | Parallel dev scripts |
| cross-env | ^10.1.0 | Cross-platform env vars |
| wait-on | ^9.1.0 | Wait for dev server |

---

## 4. Software Architecture

### 4.1 Process Architecture

```
┌──────────────────────────────────────────────────┐
│                  Main Process                     │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ SerialManager│  │ Tile Server  │  │ Database │ │
│  │ (serialport) │  │ (Express 5)  │  │ (sql.js) │ │
│  └──────┬──────┘  └──────┬───────┘  └────┬─────┘ │
│         │                │               │        │
│  ┌──────┴────────────────┴───────────────┴──────┐ │
│  │           IPC Handlers (ipcMain)              │ │
│  └──────────────────┬───────────────────────────┘ │
└─────────────────────┼─────────────────────────────┘
                      │ contextBridge
┌─────────────────────┼─────────────────────────────┐
│              Renderer Process                      │
│                     │                              │
│  ┌──────────────────┴───────────────────────────┐ │
│  │          Preload Script (contextBridge)       │ │
│  └──────────────────┬───────────────────────────┘ │
│                     │                              │
│  ┌──────────┐ ┌─────┴────┐ ┌────────┐ ┌───────┐  │
│  │ Dashboard│ │ Charts   │ │History │ │Settings│  │
│  │ (Map,    │ │ (Recharts│ │ (Table │ │ (Form │  │
│  │  Gauges) │ │  Area)   │ │  +CSV) │ │  +Tgl)│  │
│  └──────────┘ └──────────┘ └────────┘ └───────┘  │
│                                                   │
│  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Alarm System │  │ IAEA Scale + Utils          │ │
│  │ (Web Audio)  │  │                             │ │
│  └──────────────┘  └────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### 4.2 File Structure

```
ARGM-Client Service/
├── logo12.png                          # Company logo
├── package.json                        # Project config
├── vite.config.js                      # Vite config
├── reports/                            # Documentation
│   └── ARGMM-Technical-Report.md
├── firmware/
│   └── radiation_monitor/
│       └── radiation_monitor.ino       # ESP32 firmware
├── scripts/
│   └── download-tiles.js              # Offline tile downloader
├── src/
│   ├── assets/
│   │   └── offline-tiles/             # ~2,903 PNG tiles (zoom 5-9)
│   │       ├── 5/
│   │       ├── 6/
│   │       ├── 7/
│   │       ├── 8/
│   │       └── 9/
│   ├── main/
│   │   ├── main.js                    # Electron entry point
│   │   ├── preload.js                 # Context bridge
│   │   ├── splash.html               # Boot splash screen
│   │   ├── logo12.png                 # Splash logo copy
│   │   ├── tileServer.js              # Express tile server
│   │   ├── serial/
│   │   │   ├── serialManager.js       # Serial port management
│   │   │   ├── nmeaParser.js          # GPS NMEA parser
│   │   │   └── dataProcessor.js       # Sensor data processor
│   │   ├── database/
│   │   │   ├── db.js                  # SQLite (sql.js) layer
│   │   │   ├── readings.js            # Readings CRUD + CSV
│   │   │   └── sessions.js            # Session management
│   │   └── ipc/
│   │       ├── handlers.js            # IPC event handlers
│   │       └── settings.js            # Settings persistence
│   └── renderer/
│       ├── index.html                 # Entry HTML (CSP headers)
│       └── src/
│           ├── main.jsx               # React root
│           ├── App.jsx                # Main app + alarm integration
│           ├── index.css              # Global styles + animations
│           ├── components/
│           │   ├── Sidebar.jsx        # Navigation + status
│           │   ├── LiveGauges.jsx     # SVG arc gauge cards
│           │   ├── DoseChart.jsx      # Real-time area chart
│           │   └── MapView.jsx        # Leaflet map
│           ├── pages/
│           │   ├── Dashboard.jsx      # Main dashboard
│           │   ├── Charts.jsx         # Analytics page
│           │   ├── History.jsx        # Data history table
│           │   └── Settings.jsx       # Configuration page
│           └── utils/
│               ├── iaeaScale.js       # IAEA radiation levels
│               └── alarmSystem.js     # Web Audio alarm engine
└── data/
    └── radiation_monitor.db           # SQLite database file
```

---

## 5. Firmware — ESP32 Radiation Monitor

### 5.1 Hardware Pin Configuration

| GPIO | Define | Function | Mode |
|------|--------|----------|------|
| 2 | `RADIATION_PIN` | Geiger tube pulse input | `INPUT_PULLUP` |
| 4 | `DHT_PIN` | DHT22 data line | Digital I/O |
| 16 | `GPS_RX` | GPS module TX → ESP RX | SoftwareSerial RX |
| 17 | `GPS_TX` | ESP TX → GPS module RX | SoftwareSerial TX |

### 5.2 Baud Rates

| Interface | Baud Rate |
|-----------|-----------|
| Main Serial (USB) | 115200 |
| GPS (SoftwareSerial) | 9600 |

### 5.3 Radiation Detection Method

The Geiger-Müller tube produces a voltage pulse on each radiation detection event. The firmware counts these pulses using a **hardware interrupt** on GPIO 2 (FALLING edge):

```cpp
volatile unsigned long pulseCount = 0;

void IRAM_ATTR countPulse() {
    pulseCount++;
}

// Setup:
attachInterrupt(digitalPinToInterrupt(RADIATION_PIN), countPulse, FALLING);
```

**Dose Rate Calculation:**
```
CPM = pulseCount × 60 (pulses per minute, sampled every second)
Dose Rate (µSv/h) = CPM × CALIBRATION_FACTOR
CALIBRATION_FACTOR = 0.0081
```

This calibration factor is specific to the Geiger-Müller tube model used and converts raw count rate to IAEA-standard dose equivalent rate.

### 5.4 Output Format

The firmware transmits a JSON payload every 1000ms over the main serial port:

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

| Field | Type | Precision | Notes |
|-------|------|-----------|-------|
| `lat` | float | 6 decimal places | `null` when GPS invalid |
| `lon` | float | 6 decimal places | `null` when GPS invalid |
| `satellites` | integer | — | Number of GPS satellites in fix |
| `gps_valid` | boolean | — | `true` when GPS has valid fix |
| `dose` | float | 4 decimal places | Dose rate in µSv/h |
| `cpm` | float | 1 decimal place | Counts per minute |
| `temp` | float | 1 decimal place | Temperature in °C |
| `hum` | float | 1 decimal place | Relative humidity in % |
| `time` | string | — | UTC time from GPS |

### 5.5 Libraries Required

| Library | Purpose |
|---------|---------|
| `SoftwareSerial` | UART communication with GPS module |
| `TinyGPS++` | NMEA sentence parsing for position data |
| `DHT` | DHT22 temperature and humidity reading |

---

## 6. Serial Communication Protocol

### 6.1 Connection Parameters

| Parameter | Value |
|-----------|-------|
| Baud Rate | 115200 (configurable) |
| Data Bits | 8 |
| Stop Bits | 1 |
| Parity | None |
| Line Delimiter | `\r\n` |

### 6.2 Line Classification

The `SerialManager` classifies each incoming line by its prefix to determine the data format:

| Prefix Pattern | Data Type | Handler |
|----------------|-----------|---------|
| `$` | NMEA GPS sentence | `NMEAParser` |
| `{` | JSON sensor payload | `JSON.parse()` |
| `DOSE:`, `TEMP:`, `HUM:` | Custom pipe-delimited format | `parseCustomFormat()` |
| Contains `=` | Key=value pairs | `parseKeyValue()` |

### 6.3 Key Normalization

Regardless of input format, all sensor keys are normalized to a standard schema:

| Input Key(s) | Normalized Key |
|-------------|----------------|
| `dose`, `doserate`, `doseRate` | `doseRate` |
| `temp`, `t`, `temperature` | `temperature` |
| `hum`, `h`, `humidity` | `humidity` |
| `lat`, `latitude` | `latitude` |
| `lon`, `longitude` | `longitude` |
| `satellites`, `sat` | `satellites` |
| `cpm` | `cpm` |

### 6.4 Throttle

A 100ms minimum interval is enforced between processed lines to prevent UI overload at high baud rates.

---

## 7. Data Processing Pipeline

### 7.1 NMEA GPS Parsing

The `NMEAParser` supports three sentence types:

| Sentence | Method | Data Extracted |
|----------|--------|---------------|
| `GPGGA` / `GNGGA` | `parseGGA()` | Latitude, longitude, fix quality, satellites, altitude |
| `GPRMC` / `GNRMC` | `parseRMC()` | Latitude, longitude, speed (km/h), track |
| `GPGLL` / `GNGLL` | `parseGLL()` | Latitude, longitude |

**Coordinate Parsing:** Handles both `DDMM.MMMM` (NMEA standard) and `DD.dddd` (decimal) formats. Hemisphere negation applied for South/West.

**Validation:** Checksum verified via XOR of all characters between `$` and `*`.

### 7.2 Data Processor State

```javascript
{
  doseRate: 0,        // µSv/h
  cpm: 0,             // Counts per minute
  temperature: 0,     // °C
  humidity: 0,        // %RH
  latitude: null,     // Decimal degrees
  longitude: null,    // Decimal degrees
  satellites: 0,      // GPS satellite count
  timestamp: null     // ISO 8601
}
```

The processor merges incoming data from all three sources (NMEA, JSON, key=value) into a unified state object. Each update includes an `updated: true` flag for downstream consumers.

---

## 8. Database Layer

### 8.1 Engine

**sql.js** — SQLite compiled to WebAssembly. Runs entirely in-memory with periodic file persistence. This eliminates the need for native C++ build tools (Visual Studio) while providing full SQLite capabilities.

**Database File:** `data/radiation_monitor.db`

### 8.2 Schema

#### `readings` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `session_id` | INTEGER | FOREIGN KEY → sessions(id) |
| `timestamp` | TEXT | NOT NULL |
| `dose_rate` | REAL | NOT NULL DEFAULT 0 |
| `temperature` | REAL | DEFAULT 0 |
| `humidity` | REAL | DEFAULT 0 |
| `latitude` | REAL | NULLABLE |
| `longitude` | REAL | NULLABLE |
| `satellites` | INTEGER | DEFAULT 0 |
| `created_at` | TEXT | DEFAULT datetime('now') |

#### `sessions` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `start_time` | TEXT | NOT NULL |
| `end_time` | TEXT | NULLABLE |
| `total_readings` | INTEGER | DEFAULT 0 |
| `avg_dose_rate` | REAL | DEFAULT 0 |
| `max_dose_rate` | REAL | DEFAULT 0 |
| `min_dose_rate` | REAL | DEFAULT 999999 |
| `avg_temperature` | REAL | DEFAULT 0 |
| `avg_humidity` | REAL | DEFAULT 0 |
| `notes` | TEXT | NULLABLE |

#### `settings` Table

| Column | Type | Constraints |
|--------|------|-------------|
| `key` | TEXT | PRIMARY KEY |
| `value` | TEXT | NOT NULL |
| `updated_at` | TEXT | DEFAULT datetime('now') |

### 8.3 Indexes

- `idx_readings_timestamp` — on `readings(timestamp)`
- `idx_readings_session` — on `readings(session_id)`
- `idx_readings_dose` — on `readings(dose_rate)`

### 8.4 Query Operations

| Function | Description |
|----------|-------------|
| `insertReading()` | Insert with all sensor fields |
| `getReadings(filters)` | Filtered query (sessionId, date range, dose range, limit) |
| `getLatestReading()` | Most recent reading |
| `getReadingsForMap()` | All geo-tagged readings |
| `getDoseStats(sessionId?)` | Aggregate statistics (COUNT, AVG, MAX, MIN) |
| `exportCSV(filters)` | Full CSV export with headers |

---

## 9. Map System — Offline Tiles

### 9.1 Tile Server

An Express 5 HTTP server runs in the main Electron process:

- **Bind:** `127.0.0.1` (localhost only)
- **Port:** OS-assigned dynamic port
- **Route:** `/tiles/{z}/{x}/{y}.png`
- **Cache:** `max-age: 86400`, `immutable: true`
- **Fallback:** Online OpenStreetMap tiles when offline tiles unavailable

### 9.2 Offline Tile Coverage

| Parameter | Value |
|-----------|-------|
| Region | India (bounding box: 6.0°S to 37.0°N, 68.0°E to 98.0°E) |
| Zoom Levels | 5 through 9 |
| Total Tiles | ~2,903 |
| Storage Size | ~43 MB |
| Format | PNG (256×256) |
| Source | OpenStreetMap |

### 9.3 Tile Downloader Script

`scripts/download-tiles.js` — Node.js CLI tool:

- Concurrency: 6 parallel downloads
- Rate limiting: 50ms delay between batches
- Resumable: skips existing files
- CLI args: `--min-zoom`, `--max-zoom`, `--bounds`
- User-Agent: `RadiationMonitor/1.0`

### 9.4 Map Integration

The `MapView` component uses Leaflet.js with:
- Darkened tile filter (`brightness(0.65) contrast(1.15) saturate(0.8)`)
- Animated current-position marker with pulsing rings
- Color-coded dose rate markers based on IAEA scale
- GPS trail visualization
- Custom glass-styled popup tooltips

---

## 10. IAEA Radiation Classification

The system implements the IAEA radiation protection standard with 5 classification levels:

| Level | Label | Range (µSv/h) | Color | Severity Code |
|-------|-------|---------------|-------|---------------|
| 0 | Normal Background | 0 – 0.5 | Green `#22c55e` | 0 |
| 1 | Slightly Elevated | 0.5 – 2.0 | Yellow `#eab308` | 1 |
| 2 | Elevated — Caution | 2.0 – 10.0 | Orange `#f97316` | 2 |
| 3 | High — Warning | 10.0 – 100.0 | Red `#ef4444` | 3 |
| 4 | Dangerous — Critical | 100.0+ | Dark Red `#991b1b` | 4 |

### Threshold Defaults

| Threshold | Default Value |
|-----------|---------------|
| Normal | 0.5 µSv/h |
| Elevated | 2.0 µSv/h |
| Caution | 10.0 µSv/h |
| Warning | 100.0 µSv/h |
| Alert Trigger | 10.0 µSv/h |

All thresholds are user-configurable through the Settings page.

---

## 11. Alarm & Alert System

### 11.1 Architecture

The alarm system uses the **Web Audio API** to generate sounds programmatically — no external audio files required. This ensures the system works fully offline.

**Singleton pattern** with lazy AudioContext initialization (browser autoplay policy compliant).

### 11.2 Sound Patterns

| Severity | Name | Pattern | Frequency | Description |
|----------|------|---------|-----------|-------------|
| 0 | Silent | None | — | No audio output |
| 1 | Warning | Slow double beep | 880 Hz sine | 0.15s duration, 2s interval |
| 2 | Caution | Alternating triple-beep | 1000/1200 Hz | 0.12s each, 1.2s interval |
| 3 | Alarm | Wailing sweep | 600→1000 Hz sawtooth | 0.8s sweep, lowpass 2000 Hz, 1s cycle |
| 4 | Siren | Dual-harmonic nuclear siren | 300→1200 Hz sawtooth + 600→2400 Hz sine | 1.6s sweep, lowpass 3000 Hz, 1.8s cycle |

### 11.3 Controls

- **Mute/Unmute:** Smooth gain ramp (0.15s time constant) between 0.0 and 0.6
- **Severity Update:** Automatic pattern switching when dose rate changes
- **Visual Feedback:** Red screen flash overlay at severity ≥ 3
- **Sidebar Indicator:** 5-segment severity bar + status label + mute toggle button

### 11.4 Trigger Logic

```
Dose Rate ≥ Alert Threshold × 5  →  Severity 4 (Siren)
Dose Rate ≥ Caution Threshold × 2  →  Severity 3 (Alarm)
Dose Rate ≥ Alert Threshold  →  Severity 2 (Caution)
Dose Rate ≥ Normal Threshold  →  Severity 1 (Warning)
Dose Rate < Normal Threshold  →  Severity 0 (Silent)
```

---

## 12. User Interface

### 12.1 Design System

- **Theme:** Dark mode (slate-900 base with glassmorphism cards)
- **Animations:** Custom CSS keyframe animations (float, shimmer, ring-pulse, fade-in-up)
- **Cards:** Glass-effect with backdrop-blur, subtle borders, and hover states
- **Typography:** Inter/system font stack with monospace for numeric values
- **Color System:** IAEA-aligned (green → yellow → orange → red → dark red)

### 12.2 Pages

| Page | Key Features |
|------|-------------|
| **Dashboard** | Live gauges (5 cards with SVG arcs), real-time map, dose rate chart, live timestamp badge |
| **Analytics** | Time-range filtering (1m/5m/15m/1h/all), line/area chart toggle, IAEA reference zones, temp & humidity charts |
| **History** | Filterable data table, dose rate coloring, level badges, CSV export |
| **Settings** | Serial port selection, connect/disconnect, IAEA threshold config, auto-log toggle, map settings, unit preferences, alert config |

### 12.3 Sidebar

- Animated radiation logo with connection status indicator
- Live dose rate display with neon glow effect and progress bar
- Alarm status panel with severity bar and mute toggle
- SVG navigation icons with active state gradient indicator
- Connection status dot

### 12.4 Boot Splash Screen

- Frameless, transparent 520×480 window
- Company logo (logo12.png) with orbital ring animations
- Gradient "ARGM" title text
- Centered status text cycling through 8 boot stages
- Full-width footer loading bar with percentage counter
- Duration: 15 seconds (with parallel backend initialization)

---

## 13. IPC Communication Layer

### 13.1 Main → Renderer (Events)

| Channel | Data | Trigger |
|---------|------|---------|
| `serial:data` | Processed sensor reading object | Each serial data line |
| `serial:status` | `{ connected: bool, port?: string, error?: string }` | Connect/disconnect/error |

### 13.2 Renderer → Main (Invoke/Handle)

| Channel | Args | Returns |
|---------|------|---------|
| `serial:getPorts` | — | `[{ path, manufacturer, vendorId, productId }]` |
| `serial:connect` | `(port, baudRate)` | `{ success, port }` |
| `serial:disconnect` | — | void |
| `db:insertReading` | `(reading)` | `{ lastId }` |
| `db:getReadings` | `(filters)` | `[reading, ...]` |
| `db:getLatestReading` | — | `reading` |
| `db:getReadingsForMap` | — | `[reading, ...]` |
| `db:getDoseStats` | `(sessionId?)` | `{ count, avg, max, min }` |
| `db:startSession` | `(notes)` | `{ lastId }` |
| `db:endSession` | `(id)` | void |
| `db:getSessions` | — | `[session, ...]` |
| `db:exportCSV` | `(filters)` | `string` (CSV) |
| `settings:get` | — | `{ key: value, ... }` |
| `settings:save` | `(settings)` | void |
| `map:getTileUrl` | — | `string` (URL) |
| `map:hasOfflineTiles` | — | `boolean` |
| `map:isPackaged` | — | `boolean` |

### 13.3 Security Model

- `contextIsolation: true` — Renderer cannot access Node.js APIs directly
- `nodeIntegration: false` — All Node.js operations go through preload bridge
- CSP headers enforced: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`
- Tile server access: `img-src http://127.0.0.1:*`

---

## 14. Settings & Configuration

### 14.1 Default Configuration

| Key | Default | Category |
|-----|---------|----------|
| `serialPort` | `""` | Serial |
| `baudRate` | `"115200"` | Serial |
| `autoConnect` | `false` | Serial |
| `doseNormal` | `0.5` | Thresholds |
| `doseElevated` | `2.0` | Thresholds |
| `doseCaution` | `10.0` | Thresholds |
| `doseWarning` | `100.0` | Thresholds |
| `autoLogEnabled` | `true` | Logging |
| `logInterval` | `1000` (ms) | Logging |
| `mapZoom` | `15` | Map |
| `mapCenterLat` | `20.5937` | Map |
| `mapCenterLon` | `78.9629` | Map |
| `showTrail` | `true` | Map |
| `trailColor` | `#22c55e` | Map |
| `temperatureUnit` | `"C"` | Display |
| `doseUnit` | `"microSv"` | Display |
| `alertEnabled` | `true` | Alerts |
| `alertThreshold` | `10.0` | Alerts |

### 14.2 Persistence

Settings are stored as JSON-stringified values in the `settings` SQLite table using `INSERT OR REPLACE`. They are loaded on app startup and applied immediately.

---

## 15. Build & Deployment

### 15.1 Development

```bash
npm run dev          # Full dev mode (Vite + Electron)
npm run dev:renderer # Vite dev server only (localhost:5173)
npm run dev:electron # Electron with dev tools (waits for Vite)
```

### 15.2 Production Build

```bash
npm run build        # Build renderer + package for Windows (NSIS)
npm run build:linux  # Build renderer + package for Linux
```

### 15.3 Tile Download

```bash
npm run download-tiles                              # Default: India zoom 5-9
node scripts/download-tiles.js --min-zoom 5 --max-zoom 10
node scripts/download-tiles.js --bounds 6,68,37,98
```

### 15.4 Output

- **Build Output:** `dist_electron/`
- **Installer:** NSIS (Windows)
- **Database:** Auto-created at `data/radiation_monitor.db`
- **Offline Tiles:** Bundled in `src/assets/offline-tiles/`

---

## 16. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ESP32 Hardware Node                      │
│                                                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐             │
│  │ Geiger   │   │ DHT22    │   │ NEO-6M GPS   │             │
│  │ Tube     │   │ Sensor   │   │ Module       │             │
│  │ (GPIO 2) │   │ (GPIO 4) │   │ (GPIO 16/17) │             │
│  └────┬─────┘   └────┬─────┘   └──────┬───────┘             │
│       │              │                │                       │
│       ▼              ▼                ▼                       │
│  ┌──────────────────────────────────────────────┐            │
│  │              Arduino Firmware                 │            │
│  │  • Interrupt pulse counting                   │            │
│  │  • CPM → µSv/h conversion (×0.0081)          │            │
│  │  • DHT22 temperature/humidity reading         │            │
│  │  • TinyGPS++ NMEA parsing                     │            │
│  │  • JSON serialization (1s interval)           │            │
│  └──────────────────────┬───────────────────────┘            │
│                         │ USB-Serial 115200                   │
└─────────────────────────┼─────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Electron Main Process                       │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                   SerialManager                         │  │
│  │  • Connection management (open/close/list)              │  │
│  │  • Line classification (NMEA/JSON/key=value/custom)     │  │
│  │  • Key normalization & 100ms throttle                    │  │
│  └───────────┬──────────────┬──────────────┬──────────────┘  │
│              │              │              │                   │
│     ┌────────▼──────┐ ┌────▼────┐ ┌──────▼───────┐          │
│     │ NMEAParser    │ │ JSON    │ │ KeyValue     │          │
│     │ (GGA/RMC/GLL) │ │ Parse   │ │ Parser       │          │
│     └────────┬──────┘ └────┬────┘ └──────┬───────┘          │
│              └─────────────┼─────────────┘                    │
│                            ▼                                  │
│                 ┌──────────────────────┐                     │
│                 │    DataProcessor     │                     │
│                 │  State merging &     │                     │
│                 │  timestamp gen       │                     │
│                 └──────────┬───────────┘                     │
│                            │                                  │
│              ┌─────────────┼──────────────┐                  │
│              ▼             ▼              ▼                   │
│     ┌──────────────┐ ┌──────────┐ ┌──────────────┐          │
│     │   Database   │ │   IPC    │ │  Tile Server │          │
│     │   (sql.js)   │ │ Handlers │ │  (Express)   │          │
│     │              │ │          │ │  Port: auto  │          │
│     │ readings     │ │ 18 chan. │ │  /tiles/*    │          │
│     │ sessions     │ │          │ └──────────────┘          │
│     │ settings     │ │          │                            │
│     └──────────────┘ └────┬─────┘                           │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ contextBridge
┌───────────────────────────┼──────────────────────────────────┐
│                    Renderer Process                            │
│                            │                                  │
│  ┌─────────────────────────┴───────────────────────────────┐ │
│  │                    App.jsx                               │ │
│  │  • State management (currentData, readings, settings)    │ │
│  │  • Alarm severity monitoring                             │ │
│  │  • Auto-logging to database                              │ │
│  └────┬──────────┬──────────┬──────────┬───────────────────┘ │
│       │          │          │          │                      │
│  ┌────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌───▼──────┐              │
│  │Sidebar │ │Dashboard│ │Charts│ │ Settings │              │
│  │        │ │         │ │      │ │          │              │
│  │• Nav   │ │• Gauges │ │• Area│ │• Serial  │              │
│  │• Dose  │ │• Map    │ │• Line│ │• Alerts  │              │
│  │• Alarm │ │• Chart  │ │• Temp│ │• Logging │              │
│  │• Mute  │ │• Status │ │• Hum │ │• Map     │              │
│  └────────┘ └─────────┘ └──────┘ └─────────┘              │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │   Alarm System   │  │      IAEA Scale Utils         │    │
│  │  Web Audio API   │  │  5-level classification       │    │
│  │  4 severity      │  │  Color mapping                │    │
│  │  patterns        │  │  Threshold comparison          │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## 17. Specifications Summary

| Specification | Details |
|---------------|---------|
| **Platform** | Windows (primary), Linux (supported) |
| **Framework** | Electron 43 + React 19 |
| **Database** | SQLite via sql.js (WASM) |
| **Serial Protocol** | 115200 baud, 8N1, `\r\n` delimited |
| **Data Formats** | NMEA, JSON, key=value, custom pipe-delimited |
| **Map** | Leaflet + offline tiles (India, zoom 5-9, ~43 MB) |
| **Charts** | Recharts (area/line, temperature, humidity) |
| **Classification** | IAEA 5-level (0–4 severity) |
| **Audio Alerts** | 4-level Web Audio API siren system |
| **Boot Screen** | 15-second animated splash with logo |
| **Database Schema** | 3 tables (readings, sessions, settings) |
| **IPC Channels** | 18 invoke/handle + 2 event channels |
| **Firmware Target** | ESP32 with Geiger tube, DHT22, NEO-6M GPS |
| **Calibration** | CPM × 0.0081 = µSv/h |
| **Export** | CSV with all sensor fields |
| **UI Theme** | Dark glassmorphism with IAEA color coding |
| **Security** | contextIsolation, CSP headers, no nodeIntegration |
| **Offline Support** | Full map tiles, database, serial — no internet required |

---

*Report generated for ARGM v1.0.0 — Advanced Radiation Gamma Monitor*
