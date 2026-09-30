# ARGM — UI/UX Specification

**Version:** 1.0.0 — For Proposal Submission

---

## 1. Window & Layout

| Property | Value |
|----------|-------|
| Main window | 1400×900 px (min 1024×768) |
| Layout | Sidebar (60–240px responsive) + main content |
| Background | `linear-gradient(135deg, #0a0f1a, #0c1222, #0d1117)` |
| Splash window | 520×480, frameless, transparent, always-on-top, no taskbar |

## 2. Design System

### 2.1 Theme

- Dark slate-900 base with glassmorphism cards
- `backdrop-filter: blur(16px)` on all cards
- Subtle ambient gradient blobs for depth
- `rgba(15, 23, 42)` to `rgba(8, 15, 30)` background range
- 1px borders at `rgba(100, 116, 139, 0.15)`

### 2.2 Glass Card

```css
.glass-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(100, 116, 139, 0.15);
  border-radius: 16px;
}
.glass-card:hover {
  border-color: rgba(100, 116, 139, 0.3);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
}
```

### 2.3 Color Palette (IAEA-aligned)

| Use | Color | Hex |
|-----|-------|-----|
| Normal | Green | `#22c55e` |
| Elevated | Yellow | `#eab308` |
| Caution | Orange | `#f97316` |
| Warning | Red | `#ef4444` |
| Critical | Dark Red | `#991b1b` |
| Data accent | Emerald | `#34d399` / `#10b981` |
| Navigation accent | Blue | `#3b82f6` / `#60a5fa` |
| Secondary accent | Purple | `#8b5cf6` |
| Temperature | Amber | `#f59e0b` |
| Satellites | Emerald | `#10b981` |

### 2.4 Typography

- Base: Inter / system-ui / sans-serif
- Monospace: system monospace stack for numeric values
- Neon glow classes: `neon-green`, `neon-yellow`, `neon-orange`, `neon-red`, `neon-purple`, `neon-blue`

### 2.5 Animation Library

| Class | Keyframes | Use |
|-------|-----------|-----|
| `animate-float` | `float` | Decorative elements |
| `animate-shimmer` | `shimmer` | Loading states |
| `animate-glow-pulse` | `glow-pulse` | Active alarm indicator |
| `animate-fade-in-up` | `fade-in-up` | Card/page entrance |
| `animate-scale-in` | `scale-in` | Pop-in |
| `animate-ring-pulse` | `ring-pulse` | Connection indicator, map marker |
| `stagger-1..5` | animation-delay | Entrance sequencing |

## 3. Navigation (Sidebar)

| Section | Content |
|---------|---------|
| Brand | ARGM logo SVG, animated ring-pulse dot when connected |
| Dose display | Live µSv/h with IAEA color + neon glow + progress bar |
| Alarm panel | Severity bar (5 segments), label, mute/unmute button |
| Connection | Green/red dot with pulse animation; port label |
| Nav items | Dashboard, Analytics, History, Settings |
| Footer | Version label |

**Responsive behavior:** 60px icon-only on mobile (< lg breakpoint); 240px expanded on desktop.

## 4. Page Layouts

### 4.1 Dashboard

```
┌─────────────────────────────────────────┐
│  Dashboard              [● LIVE HH:MM]  │
├─────────────────────────────────────────┤
│  [Dose Hero] [CPM] [Temp] [Hum] [Sat]  │  ← 5 arc gauges
├───────────────────────┬─────────────────┤
│                       │   Dose Rate     │
│      Live Map         │  (200 pt chart) │
│      (Leaflet)        │                 │
└───────────────────────┴─────────────────┘
```

- Map: 2/3 width on desktop
- Chart: 1/3 width
- Minimum map height: 300 px

### 4.2 Analytics

```
┌─────────────────────────────────────────┐
│  Analytics   [1m|5m|15m|1h|All] [Area|Line]
├─────────────────────────────────────────┤
│  Dose Rate (µSv/h)                     │
│  ─── Recharts area/line ───            │
├───────────────────────┬─────────────────┤
│  Temperature (°C)     │ Humidity (%RH)  │
├───────────────────────┴─────────────────┤
│  IAEA Scale Legend                      │
└─────────────────────────────────────────┘
```

- IAEA ReferenceArea bands in dose chart (green/yellow/orange)
- Dashed ReferenceLines at 0.5, 2, 10 thresholds

### 4.3 History

```
┌─────────────────────────────────────────┐
│  Data History             [Export CSV]  │
├─────────────────────────────────────────┤
│  [Start Date] [End] [MinDose] [MaxDose]│
│                    [Search]             │
├─────────────────────────────────────────┤
│  Timestamp │ Dose   │ Level │ ...      │
│  ──────────┼────────┼───────┤          │
│  rows...   │ color  │ badge │          │
├─────────────────────────────────────────┤
│  Showing N readings                     │
└─────────────────────────────────────────┘
```

- Dose value colored by IAEA level
- Level shown as small badge pill
- CSV export via blob + `<a>` click

### 4.4 Settings

```
┌─────────────────────────────────────────┐
│  Settings                 [✓ Saved!]    │
├─────────────────────────────────────────┤
│  ▸ Serial Connection                   │
│    [Port Select] [Baud Rate] [Toggle]  │
│    [Refresh Ports] [Connect/Disconnect]│
├─────────────────────────────────────────┤
│  ▸ IAEA Thresholds                     │
│    [Normal] [Elevated] [Caution] [Warn]│
├─────────────────────────────────────────┤
│  ▸ Data Logging                        │
│    [Auto-Log Toggle] [Interval Select] │
├─────────────────────────────────────────┤
│  ▸ Map Settings                        │
│    [Show Trail Toggle] [Zoom Slider]   │
├─────────────────────────────────────────┤
│  ▸ Display Units                       │
│    [Temp: °C/°F] [Dose: µSv/mSv/mR]  │
├─────────────────────────────────────────┤
│  ▸ Alerts                              │
│    [Enabled Toggle] [Threshold Input]  │
├─────────────────────────────────────────┤
│                        [Reset] [Save]   │
└─────────────────────────────────────────┘
```

## 5. Map Features

| Feature | Detail |
|---------|--------|
| Tile filter | `brightness(0.65) contrast(1.15) saturate(0.8)` |
| Current marker | 32×32 div-icon: pulse rings + colored center dot + floating dose label |
| Trail | Configurable color `circleMarker(3px)` entries |
| History markers | 10×10 color-coded circles with glass popup tooltips |
| Loading state | Dual counter-spinner + "Loading map tiles..." |
| Attribution | `ARGM Offline Map` overlay badge |

## 6. Boot Splash Screen

- Duration: 15 seconds (parallel to backend init)
- Logo: 120px company image with two rotating rings + glow
- Title: gradient text "ARGM" + "Advanced Radiation Gamma Monitor" subtitle
- Status text: cycles through 8 boot stages
- Footer loading bar: animated gradient fill 0→100% with percentage counter
- 8 floating ambient particles

## 7. Alarm UX

| Severity | Visual | Audio |
|----------|--------|-------|
| 0 | Normal green | Silent |
| 1 | Yellow dose display | Slow double beep |
| 2 | Orange dose + sidebar glow | Faster triple-beep |
| 3 | Red dose + screen flash (orange) | Wailing sawtooth sweep |
| 4 | Dark red dose + screen flash (red) | Dual-harmonic nuclear siren |

Mute toggle available from sidebar at any severity.

---

*Next: See `../08-deployment/BUILD-DEPLOYMENT.md`.*