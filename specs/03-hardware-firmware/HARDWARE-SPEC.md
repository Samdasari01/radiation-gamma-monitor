# ARGM — Hardware & Firmware Specification

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Hardware Node Overview

A portable, low-power field instrument that detects gamma radiation and reports it with GPS position and environmental data over a single USB serial line.

```
              ┌─────────────────────────────┐
              │        ESP32 Dev Board       │
              │                             │
  Geiger Tube │  (GPIO 2)   Interrupt ISR   │
  Pulse ─────►│             pulseCount++    │
              │                             │
  DHT22  ────►│  (GPIO 4)   temp + humidity │
              │                             │
  NEO-6M ────►│  (GPIO 16/17) TinyGPS++     │
  GPS         │             NMEA encode     │
              │                             │
              │  USB-Serial @ 115200 baud   │◄──► Host PC
              └─────────────────────────────┘
```

## 2. Bill of Materials (Reference)

| Component | Model | Purpose |
|-----------|-------|---------|
| Microcontroller | ESP32 (DevKit) | Dual-core MCU, Wi-Fi/Bluetooth (unused, future-ready) |
| Radiation Sensor | Geiger-Müller tube | Pulse-per-event detection |
| Sensor Circuit | GM tube HV booster + comparator | Produces TTL pulses per event |
| Environmental Sensor | DHT22 (AM2302) | ±0.5°C, ±2% RH |
| GPS Receiver | u-blox NEO-6M | Position + UTC time |
| Board | ESP32 DevKit V1 (30-pin) | Host platform |

## 3. Pin Assignment

| GPIO | Signal | Mode | Direction | Detail |
|------|--------|------|-----------|--------|
| GPIO 2 | GM_TUBE_PULSE | `INPUT_PULLUP` | Input | Falling-edge interrupt |
| GPIO 4 | DHT_DATA | Digital | Bidirectional (1-Wire) | DHT22 |
| GPIO 16 | GPS_TX | SoftwareSerial RX | Input | GPS module TX |
| GPIO 17 | GPS_TX_OUT | SoftwareSerial TX | Output | GPS module RX |

## 4. Interrupt & Counting Architecture

```cpp
volatile unsigned long pulseCount = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

// setup
attachInterrupt(digitalPinToInterrupt(RADIATION_PIN), countPulse, FALLING);
```

- ISR runs in IRAM for determinism.
- Counter read is protected with `noInterrupts()/interrupts()` to avoid tearing.
- No `delay()` in ISR; counting is edge-triggered.

## 5. Telemetry Computation

| Quantity | Formula |
|----------|---------|
| CPM | `pulseCount × 60` (sampled over 1 s) |
| Dose rate | `CPM × 0.0081` (µSv/h) |
| GPS validity | `gps.location.isValid()` |
| Temperature | `dht.readTemperature()` (NaN→0) |
| Humidity | `dht.readHumidity()` (NaN→0) |

## 6. Firmware Libraries

| Library | Purpose |
|---------|---------|
| `SoftwareSerial` | Bit-banged UART for GPS |
| `TinyGPSPlus` | NMEA sentence decoding |
| `DHT` | DHT22 temperature/humidity |

## 7. Firmware Structure

| Section | Responsibility |
|---------|----------------|
| `setup()` | Init serial (115200), GPS serial (9600), DHT, attach interrupt, boot banner |
| `loop()` | Drain GPS bytes → encode; at 1 s interval compute + emit JSON |
| `countPulse()` (ISR) | Increment volatile counter on falling edge |

## 8. Boot Sequence (Firmware)

1. Initialize USB serial at 115200 baud
2. Initialize GPS software serial at 9600
3. Initialize DHT22
4. Configure GM input with pull-up and attach ISR
5. Print startup banner
6. Enter main loop (continuous sensing)

## 9. Firmware Output Contract

- **Format:** single-line JSON object per second
- **Delimiter:** `\r\n` (matches host parser)
- **Clock:** UTC from GPS when locked; otherwise `time` omitted content

```json
{"lat":28.613900,"lon":77.209000,"satellites":8,"gps_valid":true,"dose":0.1234,"cpm":15.2,"temp":28.5,"hum":65.3,"time":"14:30:45"}
```

## 10. Power & Environment (Nominal)

| Parameter | Value |
|-----------|-------|
| Supply | 5 V USB or battery |
| MCU current | ~240 mA active (ESP32) |
| GPS cold-start time | ~27–35 s |
| Operating temperature (board) | −20 to +70 °C |
| Detector range | Determined by GM tube + calibration |

## 11. Calibration Procedure (Guidance)

1. Place detector in known reference field (or calibrated source).
2. Record CPM over 60+ seconds.
3. `CALIBRATION_FACTOR = reference dose (µSv/h) / measured CPM`.
4. Update `CALIBRATION_FACTOR` constant and re-flash.
5. Validate against at least two dose levels.

---

*Next: See `NMEA-SERIAL-PROTOCOL.md` for the host-side protocol contract.*