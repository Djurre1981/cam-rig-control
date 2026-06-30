# Cam Rig Control — Build Plan

Motion-controlled 4-axis camera arm based on the [DIW CNC camera rig](https://www.thingiverse.com/thing:4652484), with custom firmware and a timeline-based control interface.

**Current status**

| Area | Status |
|------|--------|
| 3D printed parts | Done |
| Arduino Mega 2560 | **On hand** |
| CNC Shield V3 + 4× DRV8825 | Ordered ([link](https://nl.aliexpress.com/item/1005006718694606.html)) |
| Slip rings | Ordered ([link](https://nl.aliexpress.com/item/1005002721716529.html)) |
| Stepper motors | **4/4** — 2× plain (stock) + 2× 5.18:1 planetary (ordered) |
| Mechanical assembly | Not started |
| Firmware + host + UI | v0.1 scaffold in repo |

---

## System overview

```
[Laptop browser]  ──Wi-Fi──►  [Pi 2 Model B]  ──USB──►  [Sony ZV-1 II]
                                    │
                                    ├── USB serial ──► [Arduino Mega] ──► 4× NEMA 17
                                    └── (bench only) [Waveshare HAT] ──► 2× NEMA 17
```

| Layer | Role |
|-------|------|
| **Mechanical** | DIW-printed rig, slip rings, gears, aluminum tubes |
| **Arduino Mega** | Real-time 4-axis velocity stepping, boom limits |
| **Raspberry Pi 2** | Motion API, camera PTP service, timeline playback, preset storage |
| **Web UI** | Timeline editor, live jog, preset library (runs on laptop or Pi) |

### Axis map

| # | Name | DIW color | Range | Motor location |
|---|------|-----------|-------|----------------|
| 0 | `boom` | Red (CBC1) | Limited (soft limits) | A-axis riser — **planetary** |
| 1 | `swing` | Yellow (CBC2) | 360° | Turret — **planetary** |
| 2 | `yaw` | Green (CBC4) | 360° | Y head — **plain NEMA 17** |
| 3 | `pitch` | Blue (CBC3) | 360° | Z head — **plain NEMA 17** |

### Camera

| Field | Value |
|-------|--------|
| Model | Sony ZV-1 II (`ZV-1M2`) |
| Integration | [Sony Camera Remote Command](https://support.d-imaging.sony.co.jp/app/cameraremotecommand/en/index.html) (PTP/USB) |
| Not used | Sony Camera Remote SDK (ZV-1 II not listed) |
| Remote features | Record, zoom, manual focus, exposure |

---

## Phase 0 — Procurement checklist

### Already done / ordered

- [x] All printed parts
- [x] Arduino Mega 2560 (on hand)
- [x] CNC Shield V3 + 4× DRV8825 ([AliExpress 1005006718694606](https://nl.aliexpress.com/item/1005006718694606.html))
- [x] 4× NEMA 17 motors total (2 earlier + 2× 17HS4401-A51M 5.18:1 — [1005010645426451](https://nl.aliexpress.com/item/1005010645426451.html))
- [x] Slip rings ([1005002721716529](https://nl.aliexpress.com/item/1005002721716529.html))
- [x] Bearings (608ZZ, etc.)

### Still to order

| Item | Qty | Notes |
|------|-----|--------|
| Power supply | 1 | 12–24 V, ≥10 A for 4 motors |
| DC buck converter | 1 | 5 V, ≥3 A for Pi 2 |
| Limit switches | 2 | Boom min + max |
| Jumper wire dupont set | 1 | Mega ↔ CNC shield (shield is Uno footprint) |
| USB cable A→B | 1 | Pi ↔ Mega (data) |
| USB cable | 1 | Pi ↔ ZV-1 II (data-capable) |
| Wire, connectors, heat shrink | — | CAT5e stranded per DIW docs |
| M3/M4/M5/M8 hardware | — | See [DIW hardware BOM](https://github.com/Lukens4242/CNC_6-axis_motion_control_docs/blob/main/BOM%20Hardware.ods) |
| Aluminum tube | — | 3/4" and 1" per README cut lengths |
| Optional: DRV8825 heatsinks | 4 | Recommended under load |
| Optional: Wi-Fi dongle | 1 | If Pi 2 not on Ethernet |

### On hand (use as planned)

| Item | Use |
|------|-----|
| Raspberry Pi 2 Model B V1.2 | Headless host |
| Waveshare Stepper Motor HAT (B) | **Bench test only** (2 motors) |
| Uno 4-axis CNC shield | Adapt to Mega as driver carrier |

---

## Phase 1 — Mechanical assembly (weeks 1–3)

Follow [DIW construction docs](../CNC_6-axis_motion_control_docs-main/README.md) (or Lukens4242 mirror). Suggested order:

### 1.1 Base & slew (no motors yet)

1. Slew bearing: races, 24× rollers, nylon spacer (CF-printed spacer if available)
2. Tripod mounting block + M8 thumb screws
3. Turret base → slew bearing alignment

**Gate:** Slew bearing rotates smoothly by hand, no binding.

### 1.2 Turret & boom structure

4. Turret motor mount (motor not wired)
5. Riser arms (A + second riser)
6. A-axis motor mount on riser
7. Bottom arm bearing + aluminum tube + pivot arms
8. A-axis arm gear + tube + back connecting handle
9. Arm tubes, tube inserts, ZY connecting arm

**Gate:** Boom lifts manually when motor tensioner released; swing rotates freely.

### 1.3 Camera head

10. Case frame, shells, counterweight
11. Cam head lower bar + base plate
12. Y motor mount, gear head, slip ring cover
13. Z motor mount, rotation gear, slip ring cap
14. Cable routing through slip rings — **document wire colors per axis**

**Gate:** Yaw and pitch move smoothly by hand; slip ring wires have slack at full rotation.

### 1.4 Final mechanical

15. Switch mount, battery mount, data connector shell
16. Counterweight tuning
17. Mount ZV-1 II on 1/4"-20 bar

**Deliverable:** Fully mechanical rig, motors installed but not electronically driven.

---

## Phase 2 — Electrical (week 3–4)

### 2.1 Motor wiring

| Axis | Driver slot | Motor | Limit switches |
|------|-------------|-------|----------------|
| boom | M0 | NEMA 17 (gearhead) | MIN + MAX → Mega |
| swing | M1 | NEMA 17 (gearhead) | None |
| yaw | M2 | NEMA 17 | None |
| pitch | M3 | NEMA 17 | None |

- Set driver current with potentiometer (~1.0–1.5 A for NEMA 17; follow motor datasheet)
- Set microstepping: 1/16 or 1/32 for smooth video motion
- Common motor ground; separate VMOT 12–24 V
- Enable pin: all drivers tied or single GPIO

See [pin_map.md](pin_map.md) for Mega GPIO assignment (adapt when shield is converted).

### 2.2 Power distribution

```
12–24 V PSU ──┬── VMOT (drivers)
              └── Buck 5 V ──┬── Pi 2 (pin 2/4 or micro USB)
                             └── Mega VIN (or USB from Pi for logic only)
```

- **One common ground** between PSU, drivers, Mega, Pi
- Add fuse on VMOT line
- Optional: rocker switch on VMOT (DIW switch mount)

### 2.3 Signal routing through slip rings

- Plan 4 stepper pairs (8 wires) + ground through appropriate slip rings
- Keep USB (Pi↔Mega, Pi↔camera) on **non-rotating** sections
- Label every conductor at both ends

### 2.4 Bench harness (before full install)

- Mega on bench + 1 motor + driver
- Pi USB to Mega
- Test with firmware `HELLO` / `J` commands

**Gate:** Each axis moves correct direction when commanded; boom limits trigger stop.

---

## Phase 3 — Firmware (week 4–5)

Location: `firmware/cam_rig_mega/`

### 3.1 Goals

- Independent velocity per axis (50 Hz command rate)
- Acceleration limiting per axis
- Boom homing + soft limits (axis 0 only)
- Watchdog: stop if no command for 200 ms
- Position reporting for recording

### 3.2 Serial protocol

| Command | Description |
|---------|-------------|
| `J v0,v1,v2,v3` | Set velocities (steps/s, float) |
| `P` | Print positions `P p0,p1,p2,p3` |
| `HOME 0` | Home boom to MIN limit |
| `STOP` | Decelerate all axes to zero |
| `LIMITS 0,min,max` | Set boom soft limits (steps) |
| `STATUS` | Firmware version, limits, fault flags |

### 3.3 Bring-up sequence

1. Flash sketch; confirm `OK` on serial @ 115200
2. One axis at a time: verify STEP/DIR, direction invert flags in `config.h`
3. Measure **steps per degree** per axis (mark gear, command known steps)
4. Tune max velocity and acceleration per axis
5. Wire limits; test `HOME 0` and soft limit clamping
6. Run 4-axis simultaneous jog

### 3.4 Steps-per-unit calibration (fill in when measured)

| Axis | Gear ratio | Steps/rev motor | Steps/degree | Steps/mm (boom) |
|------|------------|-----------------|--------------|-----------------|
| boom | TBD | 3200 @ 1/16 | TBD | TBD |
| swing | 16T / 80T? | 3200 | TBD | — |
| yaw | TBD | 3200 | TBD | — |
| pitch | TBD | 3200 | TBD | — |

**Gate:** 10-minute soak test — continuous mixed motion, no lost steps, watchdog works.

---

## Phase 4 — Raspberry Pi host (week 5–6)

Location: `host/`

### 4.1 OS setup

1. Flash **Raspberry Pi OS Lite 32-bit** to microSD
2. Enable SSH, set hostname `camrig`
3. USB memory for Sony PTP:
   ```bash
   sudo sh -c 'echo 150 > /sys/module/usbcore/parameters/usbfs_memory_mb'
   ```
   (Add to `/etc/rc.local` or systemd oneshot)
4. `apt install python3-pip python3-venv libusb-1.0-0`

### 4.2 Services

| Service | File | Role |
|---------|------|------|
| `motion_service` | `host/motion_service/` | Serial to Mega, jog, playback |
| `camera_service` | `host/camera_service/` | ZV-1 II PTP (zoom, focus, record) |
| `api` | `host/api/` | FastAPI + WebSocket hub |
| `timeline_engine` | `host/timeline_engine/` | Interpolate clips → motion + camera |

### 4.3 Install

```bash
cd host
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp config.example.yaml config.yaml   # edit serial ports
python -m api.main
```

### 4.4 Sony ZV-1 II setup

1. Camera: **Menu → USB → PC Remote**
2. Download [Camera Remote Command](https://support.d-imaging.sony.co.jp/app/cameraremotecommand/en/index.html)
3. Integrate Python PTP layer (see `host/camera_service/README.md`)
4. Test: connect → start/stop movie → zoom → manual focus

**Gate:** `curl` or WebSocket test triggers motor jog and camera record from same Pi process.

---

## Phase 5 — Web interface (week 6–8)

Location: `ui/`

### 5.1 Screens

| Screen | Purpose |
|--------|---------|
| **Live** | 4-axis velocity sliders / gamepad; record button |
| **Timeline** | 4 motor tracks + camera tracks (zoom, focus, record) |
| **Presets** | Save, load, rename, duplicate projects |
| **Settings** | Serial port, axis invert, max speeds, steps/degree |

### 5.2 Timeline clip types (v1)

| Clip | Track | Behavior |
|------|-------|----------|
| `JogClip` | Motor | Constant velocity for duration |
| `MoveClip` | Motor | Position A→B with S-curve |
| `RecordedClip` | Motor | Captured live positions |
| `ZoomClip` | Camera | Zoom ramp |
| `FocusClip` | Camera | Focus near/far ramp |
| `RecordClip` | Camera | Start/stop movie |

### 5.3 Development workflow

```bash
# Terminal 1 (Pi or dev PC)
cd host && source .venv/bin/activate && python -m api.main

# Terminal 2
cd ui && npm install && npm run dev
```

Open `http://<pi-ip>:5173` from laptop on same network.

**Gate:** Record 10 s live motion → save preset → playback reproduces move + camera record marker.

---

## Phase 6 — Bench shortcut (parallel track)

While waiting for motors 3–4 or Mega:

1. Pi + Waveshare HAT + 1–2 NEMA 17 on desk
2. Run `host/bench_waveshare/jog_test.py`
3. Validate Pi toolchain and one gear ratio

**Do not use HAT in final rig** — Mega handles all 4 axes in production.

---

## Phase 7 — Integration & shoot tests (week 8–10)

1. **Dry run:** Full preset playback without camera
2. **Camera sync:** Verify record starts within ±50 ms of motion
3. **Zoom + move:** Timeline with simultaneous boom swing + zoom ramp
4. **Stress:** 30 min intermittent motion; check driver temps
5. **Field:** Battery power (LiPo + buck) if portable per DIW design

### Acceptance criteria

- [ ] All 4 axes independently controllable in speed and direction
- [ ] Live control from browser (sliders; gamepad optional)
- [ ] Record live motion → preset → playback matches within acceptable tolerance
- [ ] Boom respects soft limits; 360° axes run continuously
- [ ] ZV-1 II record + zoom + focus from timeline
- [ ] E-stop / watchdog stops all motion within 500 ms

---

## Phase 8 — Optional enhancements

| Feature | Effort |
|---------|--------|
| ESP32 wireless jog remote | Medium |
| Gamepad mapping (Web Gamepad API) | Low |
| Export preset as G-code | Low |
| Mechanical focus/zoom motors (DIW axis 5–6) | High — likely skip |
| On-Pi touchscreen (play/stop only) | Low |

---

## Repository map

```
cam-rig-control/
├── docs/
│   ├── BUILD_PLAN.md          ← this file
│   ├── hardware_inventory.md
│   ├── camera_zv1m2.md
│   └── pin_map.md
├── firmware/
│   └── cam_rig_mega/          ← Arduino Mega sketch
├── host/
│   ├── api/                   ← FastAPI + WebSocket
│   ├── motion_service/
│   ├── camera_service/
│   ├── timeline_engine/
│   └── bench_waveshare/
├── ui/                        ← Timeline web app
└── schemas/
    └── timeline_project.json
```

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Uno shield pin mismatch on Mega | Custom `config.h`; jumper wires; document in pin_map |
| Pi 2 too slow for UI | Run editor on laptop; Pi runs headless services only |
| Sony PTP complexity | Start with gphoto2 probe; implement Command protocol incrementally |
| Lost steps on boom | Conservative accel; gearhead motors on boom axes; homing before presets |
| Slip ring wire failure | Service loop; strain relief; spare wires in bundle |

---

## Suggested week-by-week summary

| Week | Focus |
|------|--------|
| 1 | Mechanical: base, slew, turret |
| 2 | Mechanical: boom, head, slip rings |
| 3 | Order remaining parts; wire bench harness |
| 4 | Firmware bring-up, 1–4 axes |
| 5 | Pi OS + motion_service + serial jog |
| 6 | Camera service + ZV-1 II USB tests |
| 7 | UI live panel + recording |
| 8 | Timeline editor + playback |
| 9–10 | Integration, tuning, first shots |

---

## References

- [DIW Thingiverse](https://www.thingiverse.com/thing:4652484)
- [Build video](https://www.youtube.com/watch?v=UMwUnzjZ8Ao)
- [Lukens4242 construction docs](https://github.com/Lukens4242/CNC_6-axis_motion_control_docs)
- [Sony Camera Remote Command](https://support.d-imaging.sony.co.jp/app/cameraremotecommand/en/index.html)
- [Waveshare Stepper Motor HAT (B)](https://www.waveshare.com/wiki/Stepper_Motor_HAT_(B))
