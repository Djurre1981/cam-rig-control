# Hardware Inventory

Last updated: RAMPS 1.6 ordered.

## On hand

| Item | Spec | Status |
|------|------|--------|
| 3D printed parts | DIW 4-axis rig | Complete |
| Arduino Mega 2560 | — | **On hand** |
| Raspberry Pi 2 Model B V1.2 | — | On hand |
| NEMA 17 plain | 2× | **In inventory** (yaw, pitch) |
| DRV8825 stepper drivers | 4× | From CNC kit (move to RAMPS) |
| Waveshare Stepper Motor HAT (B) | 2× HR8825 | Bench test only |
| Bearings | 608ZZ, etc. | On hand / ordered |
| Sony camera | ZV-1 II (`ZV-1M2`) | On hand |

## Ordered (in transit)

| Item | Qty | Notes |
|------|-----|--------|
| **RAMPS 1.6** | 1 | Stacks on Mega; screw-terminal power ([RepRap wiki](https://www.reprap.org/wiki/RAMPS_1.6)) |
| NEMA 17 planetary gearmotor | 2 | 17HS4401-A51M, **5.18:1**, 1.68 A, 8 mm D-shaft (boom, swing) |
| Slip rings | set | Per DIW BOM |

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
| DRV8825 × 4 | In RAMPS Pololu slots (from CNC kit) |
| Uno CNC shield | **Not used** — drivers only |

## Motors — complete set (4/4)

| Axis | Name | Motor | RAMPS slot | Status |
|------|------|-------|------------|--------|
| 0 | `boom` | 17HS4401-A51M, **5.18:1** planetary | **X** | Ordered |
| 1 | `swing` | 17HS4401-A51M, **5.18:1** planetary | **Y** | Ordered |
| 2 | `yaw` | Plain NEMA 17 | **Z** | In inventory |
| 3 | `pitch` | Plain NEMA 17 | **E0** | In inventory |

### Electrical summary

| Motor | Current / phase | Steps / output rev @ 1/16 µstep |
|-------|-----------------|----------------------------------|
| Planetary (X, Y) | 1.68 A | 16 576 (~46.0°/deg) |
| Plain (Z, E0) | Per label (~1.5–1.7 A) | 3 200 (~8.9°/deg) |

## Still to order

| Item | Qty | Notes |
|------|-----|--------|
| PSU | 1 | 12–24 V, ≥10 A |
| 5 V buck | 1 | ≥3 A for Pi 2 |
| Limit switches | 2 | Boom → RAMPS X_MIN / X_MAX |
| USB cable A→B | 1 | Pi ↔ Mega |
| USB cable | 1 | Pi ↔ ZV-1 II |
| Wire ferrules | — | For RAMPS 1.6 screw terminals |
| Optional: DRV8825 heatsinks | 4 | Under continuous motion |

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
