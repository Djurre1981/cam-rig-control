# Hardware Inventory

Last updated: procurement complete — all parts in supply.

## On hand

| Item | Spec | Status |
|------|------|--------|
| 3D printed parts | DIW 4-axis rig | Complete |
| Arduino Mega 2560 | — | On hand |
| RAMPS 1.6 | Stacks on Mega | On hand / in transit |
| DRV8825 stepper drivers | 4× | From CNC kit → RAMPS slots |
| NEMA 17 plain | 2× | Yaw (Z), pitch (E0) |
| NEMA 17 planetary | 2× | 17HS4401-A51M, 5.18:1 — boom (X), swing (Y) |
| Slip rings | set | Per DIW BOM |
| Bearings | 608ZZ, etc. | On hand |
| PSU | 12–24 V, ≥10 A | On hand |
| 5 V buck converter | ≥3 A | Pi 2 power |
| Limit switches | 2× | Boom → RAMPS X_MIN / X_MAX |
| USB cable A→B | 1× | Pi ↔ Mega |
| USB cable (data) | 1× | Pi ↔ ZV-1 II |
| Wire ferrules | — | RAMPS screw terminals |
| DRV8825 heatsinks | 4× (optional) | On hand |
| Wire, connectors, heat shrink | — | Per DIW build |
| M3/M4/M5/M8 hardware | — | Per DIW BOM |
| Aluminum tube | 3/4" and 1" | Cut lengths per DIW docs |
| Raspberry Pi 2 Model B V1.2 | — | On hand |
| Waveshare Stepper Motor HAT (B) | 2× HR8825 | Bench test only |
| Sony camera | ZV-1 II (`ZV-1M2`) | On hand |

## Production electronics stack

```
Raspberry Pi 2 ──USB──► Arduino Mega 2560
                              │
                         RAMPS 1.6 (stacked)
                              │
                    4× DRV8825 → 4× NEMA 17
```

| Item | Role |
|------|------|
| Mega + RAMPS 1.6 | 4-axis motion |
| DRV8825 × 4 | In RAMPS Pololu slots |
| Uno CNC shield | **Not used** — salvage drivers only |

## Motors — complete set (4/4)

| Axis | Name | Motor | RAMPS slot |
|------|------|-------|------------|
| 0 | `boom` | 17HS4401-A51M, **5.18:1** planetary | **X** |
| 1 | `swing` | 17HS4401-A51M, **5.18:1** planetary | **Y** |
| 2 | `yaw` | Plain NEMA 17 | **Z** |
| 3 | `pitch` | Plain NEMA 17 | **E0** |

### Electrical summary

| Motor | Current / phase | Steps / output rev @ 1/16 µstep |
|-------|-----------------|----------------------------------|
| Planetary (X, Y) | 1.68 A | 16 576 (~46.0°/deg) |
| Plain (Z, E0) | Per label (~1.5–1.7 A) | 3 200 (~8.9°/deg) |

## Procurement

**Complete** — no outstanding orders for v1 build.

## Axis map (software)

| Axis ID | Name | DIW color | Range |
|---------|------|-----------|-------|
| 0 | `boom` | Red | Limited |
| 1 | `swing` | Yellow | 360° |
| 2 | `yaw` | Green | 360° |
| 3 | `pitch` | Blue | 360° |

## Not used in v1

| Item | Reason |
|------|--------|
| Uno CNC shield | Replaced by RAMPS 1.6 |
| RAMPS heater outputs (D8–D10) | No bed/hotend |
| Waveshare HAT (production) | Pi GPIO stepping |
| GRBL | Custom velocity firmware |
| NEMA 8 focus/zoom | ZV-1 II remote control |
| Sony Camera Remote SDK | ZV-1 II not listed |
