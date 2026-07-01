# Pin Map — RAMPS 1.6 + Arduino Mega 2560

Production electronics: **RAMPS 1.6** stacked on **Mega 2560**. Pin map is identical to [RAMPS 1.4](https://reprap.org/wiki/RAMPS_1.4) ([1.6 notes](https://www.reprap.org/wiki/RAMPS_1.6)).

## Stack assembly

1. Mega USB port sits under the RAMPS **D8 D9 D10** end.
2. Align all pins before pressing the boards together.
3. Install **4× DRV8825** from the CNC kit into Pololu slots (potentiometer away from power MOSFETs).
4. Set **1/16 microstepping** on each DRV8825 (MS1=HIGH, MS2=HIGH, MS3=LOW).

## Axis → RAMPS driver slot

| Axis | Name | RAMPS slot | STEP | DIR | ENABLE |
|------|------|------------|------|-----|--------|
| 0 | boom | **X** | 54 | 55 | 38 |
| 1 | swing | **Y** | 60 | 61 | 56 |
| 2 | yaw | **Z** | 46 | 48 | 62 |
| 3 | pitch | **E0** | 26 | 28 | 24 |

## Boom limit switches

Wire to the RAMPS **X** endstop header (mechanical switches, COM + NC):

| Switch | RAMPS label | Mega pin |
|--------|-------------|----------|
| Boom min | X_MIN | 3 |
| Boom max | X_MAX | 2 |

Leave Y/Z/E endstop headers unused.

## Motor power

```
PSU 12–24 V (+) ──► RAMPS 11A screw terminal (+)
PSU GND (−)     ──► RAMPS 11A screw terminal (−)
                    └── common GND to Mega, Pi (buck), PSU

Separate 5 V buck ──► Raspberry Pi 2
Mega logic: USB from Pi, or 5 V on Mega (not motor VMOT)
```

**RAMPS 1.6:** use the **screw terminals** for motor power. Crimp **ferrules** on stranded wire; tighten firmly.

Do **not** use the 11 A heater MOSFET outputs (D8–D10) — stepper VMOT is separate from those circuits.

## DRV8825 current (per motor type)

| Slot | Motor | Target current |
|------|--------|----------------|
| X, Y | 17HS4401-A51M planetary | ~1.5–1.7 A |
| Z, E0 | Plain NEMA 17 | Per motor label |

## Motor 4-pin wiring

Each driver: **A1/A2** = one coil, **B1/B2** = other coil. If an axis runs backward, swap one coil pair or set `INVERT_DIR` in `config.h`.

## Direction invert (`config.h`)

```c
static const bool INVERT_DIR[NUM_AXES] = {false, false, false, false};
```

## Bench only — Waveshare HAT (Pi)

Not used with RAMPS. See `host/bench_waveshare/`.

## Retired — Uno CNC Shield V3

The Uno CNC shield is **not used**. Salvage the **DRV8825 modules** for RAMPS; shelf the Uno shield.
