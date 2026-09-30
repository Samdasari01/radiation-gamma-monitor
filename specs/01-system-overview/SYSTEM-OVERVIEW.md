# ARGM — System Overview

**Version:** 1.0.0 — For Proposal Submission

---

## 1. What Is ARGM?

**ARGM (Advanced Radiation Gamma Monitor)** is a complete IoT radiation monitoring platform integrating a portable ESP32 sensor node with a fully offline desktop monitoring application. It detects ambient gamma radiation with a Geiger-Müller tube, correlates it with GPS position and environmental conditions, and delivers real-time visualization, safety alarms, and durable data logging.

## 2. The Problem It Solves

Conventional radiation monitoring solutions require:

- Dedicated network infrastructure and cloud back-ends
- Internet connectivity for maps and services
- Proprietary software licenses
- Complex calibration and integration

ARGM is engineered to operate **100% offline and standalone** while still providing: real-time dashboards, geospatial mapping, historical analytics, session management, and CSV export.

## 3. Feature Summary

### 3.1 Real-Time Monitoring
- Live dose rate in µSv/h and CPM
- Temperature and humidity telemetry
- GPS satellite fix status
- 1-second refresh cadence

### 3.2 IAEA-Compliant Alarming
- 5-level radiation classification (green → dark red)
- 4-level escalating audio siren (Web Audio synthesis)
- Visual screen-flash overlay for high severities
- One-touch mute with smooth gain ramping

### 3.3 Geospatial Mapping
- Offline Leaflet map (India coverage)
- Interactive position marker with pulsing rings
- Color-coded dose markers by IAEA level
- GPS trail visualization
- Automatic online-tile fallback when desirable

### 3.4 Data Management
- SQLite persistence (WASM — no native build tools)
- Session-based collection with roll-up statistics
- Multi-criteria filtering (date, dose, limit)
- CSV export with all measurement fields

### 3.5 Analytics
- Dose-rate trend charts (area and line)
- Time-range windows: 1 m / 5 m / 15 m / 1 h / All
- IAEA reference bands overlaid on charts
- Temperature and humidity trend charts

### 3.6 Modular Serial Ingestion
- JSON telemetry frames
- NMEA-0183 GPS sentences
- key=value and pipe-delimited formats
- Automatic key normalization and 100 ms throttle

## 4. Operational Modes

| Mode | Description |
|------|-------------|
| **Live Monitoring** | Continuous dashboard with gauges, map, and chart |
| **Session Logging** | Auto-save to database at configurable interval |
| **Field Survey** | GPS-tracked measurements with trail rendering |
| **Historical Review** | Query, filter, and export past data |
| **Hot-Spot Detection** | Audio/visual alerts on threshold crossing |

## 5. Target Environments

| Attribute | Support |
|-----------|---------|
| Operating systems | Windows (primary), Linux (supported) |
| Installation | NSIS installer (Windows) |
| Network dependency | None (fully offline) |
| Hardware pairing | Any ESP32 with standard serial output |
| Data residence | Local machine only (no cloud) |

## 6. Value Proposition

| Benefit | How ARGM Delivers |
|---------|-------------------|
| Lower TCO | No cloud fees, no license servers |
| Data sovereignty | All data stored locally |
| Deploy anywhere | Works in disconnected field environments |
| Rapid deployment | Single-installer; auto-database creation |
| Standards aligned | IAEA classification built in |
| Vendor independent | Multiple serial input formats supported |

---

*Next: See `../02-architecture/ARCHITECTURE.md` for the technical architecture.*