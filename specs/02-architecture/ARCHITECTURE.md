# ARGM — Software Architecture

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Architectural Style

ARGM uses a **two-process Electron architecture** with a clean separation between:

- **Main process** — Node.js: hardware I/O, database, embedded web server, IPC.
- **Renderer process** — Chromium/React: user interface and client-side logic.

Secure IPC is provided by Electron's `contextBridge`, exposing a strictly-typed API surface (`window.electronAPI`) instead of raw Node access.

## 2. Layered View

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                              │
│  React 19 SPA — Dashboard, Analytics, History, Settings      │
│  Components: Sidebar, LiveGauges, DoseChart, MapView         │
│  Utils: IAEA scale, Alarm system (Web Audio)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │ window.electronAPI (contextBridge)
┌───────────────────────────┼─────────────────────────────────┐
│                      IPC LAYER                               │
│  preload.js — exposes serial, database, settings, map        │
│  handlers.js — 18 handle channels, data routing              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                  DOMAIN LAYER                                │
│  SerialManager ─ SerialPort + ReadlineParser                 │
│  NMEAParser    — GGA/RMC/GLL + checksum                      │
│  DataProcessor — state merging + normalization               │
│  TileServer    — Express 5 static tile host                  │
│  Database      — sql.js (SQLite WASM) DAOs                   │
└─────────────────────────────────────────────────────────────┘
```

## 3. Data Flow — Real-Time Telemetry

```
ESP32 (JSON @115200 baud)
   │
   ▼
SerialManager.handleData(line)          [classify + 100 ms throttle]
   │
   ├── startsWith('$')  ──► NMEAParser ──┐
   ├── startsWith('{')  ──► JSON.parse ──┤
   ├── DOSE:/TEMP:/HUM:  ─► custom       ─┤─► DataProcessor.process()
   └── contains('=')    ─► parseKeyValue─┘        │
                                             merged state (updated: true)
                                                  │
                                        webContents.send('serial:data')
                                                  │
                    ┌─────────────────────────────┴─────────────┐
                    ▼                                           ▼
             React App state                             Auto-log to DB
             (currentData, readings[500])              (interval: 0.5–30 s)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   Alarm engine            Dashboard/Charts/Map
   (severity 0–4)          (gauges, trail, markers)
```

## 4. Process Model

| Concern | Owner | Notes |
|---------|-------|-------|
| Window lifecycle | Main | Splash + main window orchestration |
| Serial I/O | Main | Exclusive; renderer has no direct port access |
| Database | Main | All writes/reads via IPC |
| Map tiles | Main | Loopback HTTP; renderer loads via `<img>` |
| Audio | Renderer | Web Audio API is browser-native |
| Charts | Renderer | Recharts renders SVG in-browser |
| Settings | Main | Persisted in SQLite `settings` table |

## 5. Startup Sequence

```
app.whenReady()
 ├─ createSplashWindow()                    # immediate visual
 ├─ Promise.all([
 │    initializeDatabase(),                 # sql.js bootstrap + schema
 │    startTileServer(),                    # express listening on 127.0.0.1
 │    new SerialManager(),
 │    registerIpcHandlers(...),
 │  ])
 ├─ wait 15 s OR init (whichever later)
 └─ createMainWindow()                      # load renderer, show on ready
```

## 6. Shutdown Sequence

```
window-all-closed
 ├─ stopTileServer()                        # close HTTP server
 ├─ serialManager.disconnect()              # close COM port
 └─ app.quit() (non-macOS)
```

## 7. Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Electron main process owns serial & DB | Keeps Node modules + hardware access out of the renderer |
| contextBridge API | Minimal, secure, versionable contract |
| sql.js (WASM) over better-sqlite3 | Eliminates native compilation for packaging on user machines |
| Embedded Express tile server | Serves local PNGs without file:// restrictions |
| Web Audio synthesis | Zero asset footprint; instant offline alarms |
| 100 ms serial throttle | Bounds renderer work under worst-case flooding |
| SPA + hash-free routing | Simple navigation state, single window |
| Tailwind v4 via Vite plugin | Modern pipeline, no config burden |

## 8. Extension Points

- **New serial formats** — extend `parseCustomFormat`/key mapping in `serialManager.js`
- **New chart metrics** — extend the Charts page with additional Recharts series
- **New tile regions** — run `download-tiles.js` with custom bounds
- **New DB queries** — add DAO functions in `src/main/database/`
- **New IPC channels** — extend `preload.js` + `handlers.js` in tandem

---

*Next: See `../03-hardware-firmware/HARDWARE-SPEC.md` for hardware details.*