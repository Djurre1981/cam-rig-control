# Pin Map — CNC Shield V3 (Uno) + Arduino Mega 2560

Your kit: [TZT CNC Shield V3 + 4× DRV8825](https://nl.aliexpress.com/item/1005006718694606.html) for **Arduino Uno**.

The shield **does not fit** the Mega mechanically. Use **jumper wires** from the Mega’s digital headers to the shield’s matching Uno pin positions (D2, D3, …).

## Wiring overview

```
Arduino Mega 2560                    CNC Shield V3 (drivers only)
  D2  ─────────────────────────────  D2  (X STEP)
  D5  ─────────────────────────────  D5  (X DIR)
  D3  ─────────────────────────────  D3  (Y STEP)
  D6  ─────────────────────────────  D6  (Y DIR)
  D4  ─────────────────────────────  D4  (Z STEP)
  D7  ─────────────────────────────  D7  (Z DIR)
  D12 ─────────────────────────────  D12 (A STEP)
  D13 ─────────────────────────────  D13 (A DIR)
  D8  ─────────────────────────────  D8  (ENABLE, active LOW)
  GND ─────────────────────────────  GND
  5V  ─────────────────────────────  5V (logic only if needed)

  D9  ─── boom MIN limit switch ─── GND
  D10 ─── boom MAX limit switch ─── GND
  (switches: normally open to GND, INPUT_PULLUP in firmware)

VMOT 12–24 V ── CNC shield power terminals (not from Mega!)
```

Mega pins **2–13** use the same numbers as Uno — firmware uses these directly.

## Axis → shield driver → motor

| Firmware axis | Name | Shield slot | STEP | DIR | Motor |
|---------------|------|-------------|------|-----|--------|
| 0 | boom | **X** | D2 | D5 | 5.18:1 gearmotor (ordered) |
| 1 | swing | **Y** | D3 | D6 | 5.18:1 gearmotor (ordered) |
| 2 | yaw | **Z** | D4 | D7 | Plain NEMA 17 (in stock) |
| 3 | pitch | **A** | D12 | D13 | Plain NEMA 17 (in stock) |

## DRV8825 DIP switches (per driver)

Set **identical** microstepping on all four drivers. Recommended for video motion:

| M0 | M1 | M2 | Mode |
|----|----|----|------|
| 1 | 1 | 0 | **1/16 microstep** |

(Shield silkscreen / vendor table — confirm against your board’s legend.)

Adjust **potentiometer** on each DRV8825 for motor rated current (1.68 A for planetary units).

## Power

```
12–24 V PSU (+) ──► CNC Shield VMOT
12–24 V PSU (−) ──► CNC Shield GND ──► Mega GND ──► Pi GND (common ground)

Separate 5 V buck ──► Raspberry Pi 2
Mega logic: 5 V via USB from Pi OR Mega VIN via buck (not VMOT)
```

**Never** power motors from Mega 5 V pin.

## Motor connector (4-lead bipolar)

| Shield | Motor coil |
|--------|------------|
| A1, A2 | Coil A (pair with lowest resistance meter reading) |
| B1, B2 | Coil B |

If motor runs but direction wrong: swap one coil’s two wires, or flip `INVERT_DIR` in `config.h`.

## Waveshare HAT (bench only)

Not used with CNC shield. See `host/bench_waveshare/`.

## Direction invert (`config.h`)

Tune after mechanical install:

```c
static const bool INVERT_DIR[NUM_AXES] = {false, false, false, false};
```
