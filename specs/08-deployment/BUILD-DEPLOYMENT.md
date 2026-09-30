# ARGM — Build & Deployment Specification

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Build Pipeline

| Command | Description |
|---------|-------------|
| `npm run dev` | Full dev mode: Vite dev server + Electron (hot reload) |
| `npm run dev:renderer` | Vite only on `localhost:5173` |
| `npm run dev:electron` | Electron with DevTools (waits for Vite) |
| `npm run build` | Production: Vite build → electron-builder (Windows NSIS) |
| `npm run build:linux` | Production: Vite build → electron-builder (Linux) |
| `npm run build:renderer` | Vite build only (no packaging) |
| `npm run build:electron` | Full pipeline: renderer + package |
| `npm run download-tiles` | Download offline tiles for India zoom 5–9 |
| `npm run rebuild` | Rebuild native modules (electron-rebuild) |

## 2. Renderer Build

| Setting | Value |
|---------|-------|
| Tool | Vite 8.1.5 |
| Root | `src/renderer/` |
| Entry | `src/renderer/src/main.jsx` |
| Output | `src/renderer/dist/` |
| Output format | Static HTML + bundled JS/CSS |
| Base URL | `./` (relative) |
| Aliases | `@` → `src/renderer/src/` |

## 3. Electron Packaging

| Setting | Value |
|---------|-------|
| Tool | electron-builder 26.15.3 |
| App ID | `com.radiationmonitor.app` |
| Product Name | Radiation Gamma Monitor |
| Output Dir | `dist_electron/` |

### 3.1 Windows

| Setting | Value |
|---------|-------|
| Target | NSIS installer |
| Icon | `src/assets/icon.ico` |
| NSIS options | Non-oneClick, user-selectable directory |
| Output | `dist_electron/*.exe` |

### 3.2 Linux

| Setting | Value |
|---------|-------|
| Target | Default Linux build (AppImage/deb) |
| Command | `npm run build:linux` |

## 4. Bundled Files

| Source | Destination in package |
|--------|----------------------|
| `src/main/**/*` | Main process scripts |
| `src/renderer/dist/**/*` | Built SPA |
| `src/assets/**/*` | Icons and assets |
| `src/assets/offline-tiles` | → `resources/offline-tiles` (extraResources) |

## 5. Database Path Resolution

| Mode | Path |
|------|------|
| Development | `./data/radiation_monitor.db` |
| Packaged | `process.resourcesPath/data/radiation_monitor.db` |

Auto-created on first run if missing.

## 6. Tile Server Boot

| Step | Detail |
|------|--------|
| Resolve tiles directory | `resources/offline-tiles` (packaged) or `src/assets/offline-tiles` (dev) |
| Start Express on loopback | Dynamic port (`port 0` → OS-assigned) |
| Route | `GET /tiles/{z}/{x}/{y}.png` |
| Cache | `max-age=86400, immutable` |
| Offline tiles absent | Warning logged; renderer falls back to `https://tile.openstreetmap.org` |
| Shutdown | `stopTileServer()` called in `window-all-closed` |

## 7. Offline Tile Downloader

```bash
npm run download-tiles
node scripts/download-tiles.js --min-zoom 5 --max-zoom 10
node scripts/download-tiles.js --bounds 6,68,37,98
```

| Parameter | Default |
|-----------|---------|
| Bounds | `6.0, 68.0, 37.0, 98.0` (India) |
| Zoom range | 5–9 |
| Tile count | ~2,903 |
| Total size | ~43 MB |
| Concurrency | 6 parallel |
| Delay | 50 ms per batch |
| User agent | `RadiationMonitor/1.0` |
| Output | `src/assets/offline-tiles/{z}/{x}/{y}.png` |
| Resumable | Yes (skips existing files) |

## 8. Runtime Requirements

| Requirement | Detail |
|-------------|--------|
| Operating system | Windows 10+ (primary), Linux (supported) |
| Disk space | ~150 MB (app + tiles + DB) |
| RAM | ~300–500 MB (Electron + React) |
| GPU | Any with WebGL (Leaflet) |
| USB | Serial COM port for ESP32 |
| Network | Not required (fully offline) |
| Permissions | Standard user; COM port access |

## 9. Installation

| Step | Detail |
|------|--------|
| 1 | Run NSIS installer (`Radiation Gamma Monitor v1.0.0.exe`) |
| 2 | Select installation directory |
| 3 | Launch application |
| 4 | Connect ESP32 via USB |
| 5 | Configure COM port in Settings |
| 6 | Click Connect |

Auto-connect: enable in Settings for zero-click reconnection.

## 10. Development Environment

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18 LTS |
| npm | ≥ 9 |
| ESP32 board support | Arduino IDE or PlatformIO |
| Arduino libraries | SoftwareSerial, TinyGPS++, DHT |

```bash
git clone <repo>
cd ARGMM-Client-Service
npm install
npm run dev
```

## 11. Distribution Artifacts

| Artifact | Location |
|----------|----------|
| Windows installer | `dist_electron/Radiation Gamma Monitor Setup *.exe` |
| Linux package | `dist_electron/` (AppImage or .deb) |
| Source code | Git repository |
| Offline tiles | Bundled in `src/assets/offline-tiles/` |

---

*End of Deployment Specification — ARGM v1.0.0*