# ARGM — Data Schema Reference

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Live Reading Object (In-Memory)

Used throughout the renderer (Charts, Dashboard, auto-logging).

```typescript
interface Reading {
  doseRate:    number | null;   // µSv/h
  cpm:         number;          // Counts per minute
  temperature: number;          // °C
  humidity:    number;          // % RH
  latitude:    number | null;   // Decimal degrees
  longitude:   number | null;   // Decimal degrees
  satellites:  number;          // GPS fix satellites
  timestamp:   string;          // ISO 8601
  updated:     boolean;         // True when this object represents a fresh update
}
```

## 2. Reading Record (Database)

Persisted in the `readings` table.

```sql
id            INTEGER PRIMARY KEY
session_id    INTEGER | NULL   -- FK → sessions.id
timestamp     TEXT NOT NULL    -- ISO 8601 or NULL
dose_rate     REAL NOT NULL    -- µSv/h
temperature   REAL             -- °C
humidity      REAL             -- % RH
latitude      REAL | NULL      -- Decimal degrees
longitude     REAL | NULL      -- Decimal degrees
satellites    INTEGER          -- GPS count
created_at    TEXT             -- datetime('now') at insert
```

## 3. Session Record (Database)

```sql
id              INTEGER PRIMARY KEY
start_time      TEXT NOT NULL    -- ISO 8601
end_time        TEXT | NULL      -- ISO 8601, set on endSession()
total_readings  INTEGER          -- Count of associated readings
avg_dose_rate   REAL
max_dose_rate   REAL
min_dose_rate   REAL             -- initialized to 999999
avg_temperature REAL
avg_humidity    REAL
notes           TEXT
```

## 4. Setting Record (Database)

```sql
key        TEXT PRIMARY KEY    -- e.g. 'serialPort'
value      TEXT NOT NULL       -- JSON-encoded string
updated_at TEXT                -- datetime('now')
```

## 5. Settings Model (Frontend)

```typescript
interface Settings {
  // Serial
  serialPort:     string;      // e.g. 'COM3'
  baudRate:       string;      // e.g. '115200'
  autoConnect:    boolean;

  // IAEA Thresholds (µSv/h)
  doseNormal:     number;      // 0.5
  doseElevated:   number;      // 2.0
  doseCaution:    number;      // 10.0
  doseWarning:    number;      // 100.0

  // Logging
  logInterval:    number;      // ms (500–30000)
  autoLogEnabled: boolean;

  // Map
  mapZoom:        number;      // 5–20
  mapCenterLat:   number;      // Decimal
  mapCenterLon:   number;      // Decimal
  showTrail:      boolean;
  trailColor:     string;      // Hex color

  // Display
  temperatureUnit: 'C' | 'F';
  doseUnit:       'microSv' | 'milliSv' | 'mR';

  // Alerts
  alertEnabled:   boolean;
  alertThreshold: number;      // µSv/h
}
```

## 6. Port Info (Serial)

```typescript
interface SerialPortInfo {
  path:         string;      // e.g. 'COM3'
  manufacturer: string;      // e.g. 'Silicon Labs'
  vendorId:     string | undefined;
  productId:    string | undefined;
}
```

## 7. Dose Statistics

```typescript
interface DoseStats {
  totalReadings: number;
  avgDose:       number;
  maxDose:       number;
  minDose:       number;
  avgTemp:       number;
  avgHumidity:   number;
}
```

## 8. Connection Status

```typescript
interface ConnectionStatus {
  connected: boolean;
  port?:     string;      // e.g. 'COM3'
  error?:    string;      // Error message on failure
}
```

## 9. CSV Export Format

| Column | Source Field | Unit |
|--------|-------------|------|
| Timestamp | `timestamp` | ISO 8601 |
| Dose Rate (uSv/h) | `dose_rate` | µSv/h |
| Temperature | `temperature` | °C |
| Humidity | `humidity` | % RH |
| Latitude | `latitude` | Decimal degrees |
| Longitude | `longitude` | Decimal degrees |
| Satellites | `satellites` | count |

## 10. Firmware JSON Frame

```typescript
interface FirmwareFrame {
  lat:        number | null;   // Decimal degrees
  lon:        number | null;   // Decimal degrees
  satellites: number;          // Fix count
  gps_valid:  boolean;
  dose:       number;          // µSv/h (raw computed)
  cpm:        number;          // Counts per minute
  temp:       number;          // °C
  hum:        number;          // % RH
  time:       string;          // 'HH:MM:SS' UTC
}
```

---

*Next: See `../07-ui-ux/UI-UX-SPEC.md`.*