# Bottango adaptation notes

Reference: [Bottango on GitHub](https://github.com/EvanBottango/Bottango) · [docs.bottango.com](https://docs.bottango.com/)

Bottango is a visual robot animation tool (effector tracks, Bézier curves, live 3D preview, timeline playback). The **desktop editor UI is closed-source**; the open repo provides firmware, network drivers, and REST examples. We adapt **patterns**, not wire protocol.

---

## What we took from Bottango

| Bottango concept | Cam Rig implementation |
|------------------|------------------------|
| One **effector per axis** | 4 motor tracks (`boom`, `swing`, `yaw`, `pitch`) + 3 camera tracks |
| **Animations** list | Left sidebar “Animations” (presets) |
| **3D workspace + timeline** | Resizable split: `RigPreview` above, timeline below (`WorkspaceResizer`) |
| **PlaybackState** effectors | `EffectorBar` — per-axis movement 0–1 + live clip highlight |
| Scrub **pauses** playback | `usePlayback.scrub()` — ruler/playhead drag stops transport |
| Clip palette / drag to track | `ClipPalette` → track rows |
| Speed curves on segments | `speed_curve` on motor clips (host compiles to motion) |
| Live vs authored | Timeline view + Live jog tab |

---

## What we did *not* copy

| Bottango | Why |
|----------|-----|
| Comma-serial `sC` curve protocol | Pi uses JSON/WebSocket; host interpolates |
| 3-curve AVR ring buffer | Mega gets velocity setpoints from Pi |
| Pin-based effector IDs | Named axes in `timeline_project.json` |
| Desktop-only authoring | We own full web UI + host |

---

## Protocol mapping (for host/firmware later)

Bottango curve command `sC` (cubic Bézier in time vs normalized position 0–8192):

```
startOffsetMs, durationMs, startY, startCtrlX, startCtrlY, endY, endCtrlX, endCtrlY
```

Cam Rig equivalents:

| Clip type | Bottango analogue | Playback |
|-----------|-------------------|----------|
| `JogClip` | Constant-slope curve | Velocity × speed envelope |
| `MoveClip` | `sC` segment | `from_pos` → `to_pos` via `speed_curve` |
| `RecordedClip` | Live record stream | Dense `frames[]` (future) |
| `RecordClip` | `sCO` on/off | Camera PTP trigger at `start` |
| `ZoomClip` / `FocusClip` | Linear ramp | Camera service on Pi |

**Recommendation:** Pi `timeline_engine` owns the clock (`tSYN` equivalent), samples clips at 50–100 Hz, sends structured setpoints to Mega — same split as Bottango’s networked driver (curve math on host).

---

## REST API shape (target for host)

Mirror Bottango `PlaybackState` for external control:

```json
{
  "selectedAnimationName": "demo",
  "isPlaying": false,
  "playbackTimeMs": 2500,
  "durationMs": 30000,
  "effectors": [
    { "name": "Boom", "movement": 0.42, "live": true }
  ]
}
```

Rules from Bottango REST (worth keeping):

- Changing time or clip **stops** playback unless `isPlaying: true` in the same request
- Emergency `PUT /Stop/` requires manual re-arm in UI

---

## UI roadmap (Bottango-inspired)

- [x] Resizable 3D / timeline split
- [x] Effector bar at playhead
- [x] Scrub-to-pause
- [ ] Bézier handles on `MoveClip` (compile to segments like `sC`)
- [ ] Record live motion into `RecordedClip` while playing
- [ ] Host `GET/PUT /PlaybackState/` on Pi
- [ ] Export compiled command stream (like `GET /AnimationCommands/`)

---

## Local reference clone

Shallow clone for protocol study (not a submodule):

```
cursor/bottango-ref/
```

Key files: `BottangoArduinoDriver/src/BasicCommands.cpp`, `REST_API_Examples/Example_SetAnimationState.py`.
