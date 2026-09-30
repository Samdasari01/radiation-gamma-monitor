# ARGM — IPC API Reference

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Overview

All renderer-to-main communication uses Electron `ipcMain.handle()` / `ipcRenderer.invoke()`. Main-to-renderer push uses `webContents.send()`.

## 2. API Surface

### 2.1 Serial Operations

#### `serial:getPorts`

| Property | Value |
|----------|-------|
| Direction | Renderer → Main (invoke/handle) |
| Args | — |
| Returns | `Array<{path, manufacturer, vendorId, productId}>` |

#### `serial:connect`

| Property | Value |
|----------|-------|
| Direction | Renderer → Main (invoke/handle) |
| Args | `port: string, baudRate: string` |
| Returns | `{success: boolean, port?: string, error?: string}` |

#### `serial:disconnect`

| Property | Value |
|----------|-------|
| Direction | Renderer → Main (invoke/handle) |
| Args | — |
| Returns | `void` |

#### `serial:data` (push)

| Property | Value |
|----------|-------|
| Direction | Main → Renderer (event) |
| Payload | `Reading` object (see Data Schema) |

#### `serial:status` (push)

| Property | Value |
|----------|-------|
| Direction | Main → Renderer (event) |
| Payload | `{connected: boolean, port?: string, error?: string}` |

### 2.2 Database Operations

#### `db:insertReading`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `reading: Reading` | `{lastId: number}` |

#### `db:getReadings`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `filters: {sessionId?, startDate?, endDate?, minDose?, maxDose?, limit?}` | `Reading[]` |

#### `db:getLatestReading`

| Direction | Returns |
|-----------|---------|
| Renderer → Main | `Reading \| null` |

#### `db:getReadingsForMap`

| Direction | Returns |
|-----------|---------|
| Renderer → Main | `Array<{latitude, longitude, doseRate, timestamp}>` |

#### `db:getDoseStats`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `sessionId?: number` | `{totalReadings, avgDose, maxDose, minDose, avgTemp, avgHumidity}` |

#### `db:getSessionStats`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `sessionId: number` | Same as `getDoseStats` |

#### `db:startSession`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `notes: string` | `{lastId: number}` |

#### `db:endSession`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `id: number` | `SessionStats` (aggregate roll-up) |

#### `db:getSessions`

| Direction | Returns |
|-----------|---------|
| Renderer → Main | `Session[]` |

#### `db:exportCSV`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `filters: QueryFilters` | `string` (CSV) |

### 2.3 Settings Operations

#### `settings:get`

| Direction | Returns |
|-----------|---------|
| Renderer → Main | `SettingsObject` (all keys merged with defaults) |

#### `settings:save`

| Direction | Args | Returns |
|-----------|------|---------|
| Renderer → Main | `settings: SettingsObject` | `{success: boolean}` |

### 2.4 Map Operations

#### `map:getTileUrl`

| Direction | Returns |
|-----------|---------|
| Renderer → Main | `string \| null` (e.g., `http://127.0.0.1:PORT/tiles`) |

#### `map:hasOfflineTiles`

| Direction | Returns |
|-----------|---------|
| Renderer → Main | `boolean` |

#### `map:isPackaged`

| Direction | Returns |
|-----------|---------|
| Renderer → Main | `boolean` |

## 3. Channel Summary

| Channel | Type | Direction |
|---------|------|-----------|
| `serial:getPorts` | invoke/handle | R→M |
| `serial:connect` | invoke/handle | R→M |
| `serial:disconnect` | invoke/handle | R→M |
| `serial:data` | event (push) | M→R |
| `serial:status` | event (push) | M→R |
| `db:insertReading` | invoke/handle | R→M |
| `db:getReadings` | invoke/handle | R→M |
| `db:getLatestReading` | invoke/handle | R→M |
| `db:getReadingsForMap` | invoke/handle | R→M |
| `db:getDoseStats` | invoke/handle | R→M |
| `db:getSessionStats` | invoke/handle | R→M |
| `db:startSession` | invoke/handle | R→M |
| `db:endSession` | invoke/handle | R→M |
| `db:getSessions` | invoke/handle | R→M |
| `db:exportCSV` | invoke/handle | R→M |
| `settings:get` | invoke/handle | R→M |
| `settings:save` | invoke/handle | R→M |
| `map:getTileUrl` | invoke/handle | R→M |
| `map:hasOfflineTiles` | invoke/handle | R→M |
| `map:isPackaged` | invoke/handle | R→M |

**Total: 18 invoke/handle channels + 2 push events = 20 channels**

---

*Next: See `DATA-SCHEMA.md` for data model details.*