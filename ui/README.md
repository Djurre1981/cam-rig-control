# Cam Rig UI — Timeline demo (v0.2)

Non-functional **demo interface** for planning motion presets while hardware is in transit. Inspired by [Dragonframe Arc Motion Control](https://www.dragonframe.com/dragonframe-software/) (multi-axis keyframes, move tests) and NLE-style multi-track editors (Premiere, Reaper).

## Run locally

```bash
cd ui
npm install
npm run dev
```

Open **http://localhost:5173**

Demo mode is **on** by default (no Pi/Mega required). Set `VITE_DEMO_MODE=false` to prepare for live API connection later.

## Features (demo)

| Area | Behavior |
|------|----------|
| **Timeline** | 4 motor tracks + 3 camera tracks (record, zoom, focus) |
| **Clip palette** | Drag Jog, Move, Recorded, Record, Zoom, Focus onto matching tracks |
| **Clips** | Select, drag to reposition, resize via right edge |
| **Transport** | Play / pause / stop, speed 0.25×–2×, scrub via ruler click |
| **Inspector** | Edit clip start, duration, velocity, zoom range |
| **Presets** | Switch between demo projects (local JSON) |
| **Live** | Slider jog UI + record button (visual only) |

## Layout

```
┌─────────────┬──────────────────────────────────┬────────────┐
│ Presets     │ Transport (play, timecode, speed)│ Inspector  │
│ Clip palette│ 4× motion tracks (DIW colors)    │ clip props │
│             │ 3× camera tracks                   │            │
└─────────────┴──────────────────────────────────┴────────────┘
```

## Design references

- **Dragonframe Arc** — per-axis channels, keyframed moves, jogpad, move test playback
- **DaVinci Resolve / Premiere** — timeline ruler, clip blocks, transport bar
- **DAW (Reaper)** — independent tracks, snap grid, clip resize

## Next (when hardware ready)

- WebSocket to `host/api` for live jog and playback
- Record live motion → `RecordedClip` on timeline
- Sony ZV-1 II camera commands on camera tracks
