# ARGM — Serial & NMEA Protocol Reference

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Connection Contract

| Parameter | Value |
|-----------|-------|
| Baud rate | 115200 default (UI selectable 9600–921600) |
| Data bits | 8 |
| Stop bits | 1 |
| Parity | None |
| Flow control | None |
| Line delimiter | `\r\n` |
| Processing throttle | 100 ms per line |

## 2. Input Format Classification

The `SerialManager.handleData()` router:

| Detection | Format | Handler |
|-----------|--------|---------|
| `$` prefix | NMEA-0183 | `NMEAParser.parse()` |
| `{` prefix + valid JSON | JSON telemetry | `JSON.parse()` |
| `DOSE:` / `TEMP:` / `HUM:` prefix | Pipe-delimited custom | `parseCustomFormat()` |
| Any token containing `=` | key=value | `parseKeyValue()` |

Handlers emit downstream events: `nmea`, `sensorData`, `customData` — all funneled into `DataProcessor.process()`.

## 3. JSON Telemetry Frame

Emitted by the reference firmware every 1000 ms.

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

## 4. key=value Format

Space-separated `key=value` tokens; numeric values only. Unknown keys are passed through normalized.

```
dose=0.1234 cpm=15 temp=28.5 hum=65.3 lat=28.6139 lon=77.2090 satellites=8
```

## 5. Pipe-Delimited Custom Format

Lines prefixed `DOSE:`, `TEMP:`, or `HUM:` are split on `|`, then each `KEY:value`.

```
DOSE:0.1234|TEMP:28.5|HUM:65.3|LAT:28.6139|LON:77.209
```

## 6. Key Normalization

| Input key(s) | Canonical field |
|--------------|-----------------|
| `dose`, `doserate`, `doseRate` | `doseRate` |
| `temp`, `t`, `temperature` | `temperature` |
| `hum`, `h`, `humidity` | `humidity` |
| `lat`, `latitude` | `latitude` |
| `lon`, `longitude` | `longitude` |
| `satellites`, `sat` | `satellites` |
| `cpm` | `cpm` |

## 7. NMEA Sentences Supported

### 7.1 GGA / GNGGA — Global Positioning System Fix Data

| Field | Meaning | Extraction |
|-------|---------|------------|
| 1 | UTC time | `HH:MM:SS` |
| 2,3 | Latitude + hemisphere | Decimal degrees (S/W negated) |
| 4,5 | Longitude + hemisphere | Decimal degrees (S/W negated) |
| 6 | Fix quality | ≥1 = valid |
| 7 | Satellites used | Integer |
| 9 | Altitude (m) | Float |

### 7.2 RMC / GNRMC — Recommended Minimum Data

| Field | Meaning | Extraction |
|-------|---------|------------|
| 1 | UTC time | `HH:MM:SS` |
| 2 | Status | `A` = valid |
| 3,4 | Latitude + hemisphere | Decimal degrees |
| 5,6 | Longitude + hemisphere | Decimal degrees |
| 7 | Speed (knots) | Converted to km/h (`× 1.852`) |
| 8 | Track angle | Float degrees |

### 7.3 GLL / GNGLL — Geographic Position

| Field | Meaning | Extraction |
|-------|---------|------------|
| 1,2 | Latitude + hemisphere | Decimal degrees |
| 3,4 | Longitude + hemisphere | Decimal degrees |
| 6 | Status | `A` = valid |

## 8. Coordinate Parsing

Supports two source formats:

```
DDMM.MMMM   →  DD + MM.MMMM/60          (NMEA native)
DD.ddddd    →  as-is                    (decimal input)
```

Hemisphere S/W negates the resulting decimal value.

## 9. Checksum Verification

```javascript
const data = sentence.split('*')[0].substring(1);
const checksum = parseInt(sentence.split('*')[1], 16);
let calc = 0;
for (const ch of data) calc ^= ch.charCodeAt(0);
// sentence valid if calc === checksum
```

## 10. DataProcessor Merging Semantics

`DataProcessor` holds persistent state. Each `process()` call:

1. Starts from current state snapshot.
2. Applies fields present in the input payload only (not a full reset).
3. Sets `updated: true` when any sensor field changed.
4. Stamps `timestamp` (ISO 8601) on updates.
5. Returns the merged state.

This enables GPS NMEA lines and sensor JSON lines to arrive interleaved and independently update position and dose fields.

## 11. Output Event (`serial:data`)

```javascript
{
  doseRate: Number,
  cpm: Number,
  temperature: Number,
  humidity: Number,
  latitude: Number | null,
  longitude: Number | null,
  satellites: Number,
  timestamp: "ISO-8601",
  updated: Boolean
}
```

---

*Next: See `../04-software/SOFTWARE-SPEC.md`.*