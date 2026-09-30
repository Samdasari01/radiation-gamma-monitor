# ARGM — Advanced Radiation Gamma Monitor

## Technical Specification Package

**Package Version:** 1.0.0
**System Version:** 1.0.0
**Classification:** Technical Documentation — For Proposal Submission

---

## Document Index

| # | Document | Purpose |
|---|----------|---------|
| 1 | `01-system-overview/TECHNICAL-SPECIFICATION.md` | Master specification — complete system technical reference |
| 2 | `01-system-overview/SYSTEM-OVERVIEW.md` | Executive overview, feature summary, and system context |
| 3 | `02-architecture/ARCHITECTURE.md` | Software architecture, process model, and data flow |
| 4 | `03-hardware-firmware/HARDWARE-SPEC.md` | Hardware node design and firmware specifications |
| 5 | `03-hardware-firmware/NMEA-SERIAL-PROTOCOL.md` | Serial communication and NMEA protocol reference |
| 6 | `04-software/SOFTWARE-SPEC.md` | Desktop software design, modules, and technical details |
| 7 | `05-database/DATABASE-SPEC.md` | Database schema, indexes, and query operations |
| 8 | `06-api-integration/API-REFERENCE.md` | IPC API reference, channels, and data contracts |
| 9 | `06-api-integration/DATA-SCHEMA.md` | Data models and field specifications |
| 10 | `07-ui-ux/UI-UX-SPEC.md` | User interface, design system, and interactions |
| 11 | `08-deployment/BUILD-DEPLOYMENT.md` | Build, packaging, and deployment guide |

---

## Proposal Attributes Summary

| Attribute | Value |
|-----------|-------|
| **Product Name** | ARGM — Advanced Radiation Gamma Monitor |
| **Product Type** | IoT Radiation Monitoring Platform (Hardware + Desktop Software) |
| **Sensor Node** | ESP32 microcontroller with Geiger-Müller tube, DHT22, NEO-6M GPS |
| **Desktop Application** | Electron 43 + React 19 (Windows/Linux) |
| **Operating Modes** | Fully offline; GPS-tracked; real-time; session-based logging |
| **Key Standards** | IAEA radiation protection classification (5-level) |
| **Data Persistence** | SQLite (sql.js WASM), CSV export |
| **Mapping** | Offline Leaflet tiles (India coverage, ~2,900 tiles, zoom 5–9) |
| **Alerting** | 4-level audio siren system (Web Audio API) + visual alerts |
| **Deployment** | NSIS Windows installer; Linux supported |

---

*Prepared for submission. All technical content derived directly from the ARGM v1.0.0 source repository.*