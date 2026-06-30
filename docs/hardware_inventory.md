# Hardware Inventory

Last updated: ordered parts received / in transit.

## On hand

| Item | Spec | Status |
|------|------|--------|
| 3D printed parts | DIW 4-axis rig | Complete |
| Arduino Mega 2560 | — | **On hand** |
| Raspberry Pi 2 Model B V1.2 | — | On hand |
| Waveshare Stepper Motor HAT (B) | 2× HR8825 | Bench test only |
| Bearings | 608ZZ, etc. | Ordered / on hand |
| Sony camera | ZV-1 II (`ZV-1M2`) | On hand |

## Ordered (in transit)

| Item | Qty | Link / SKU | Notes |
|------|-----|------------|--------|
| CNC Shield V3 + 4× DRV8825 | 1 kit | [AliExpress 1005006718694606](https://nl.aliexpress.com/item/1005006718694606.html) | **Uno R3** form factor — jumper to Mega, do not stack |
| NEMA 17 planetary gearmotor | 2 | [AliExpress 1005010645426451](https://nl.aliexpress.com/item/1005010645426451.html) | 17HS4401-A51M, **5.18:1**, 1.68 A, 8 mm D-shaft |
| Slip rings | set | [AliExpress 1005002721716529](https://nl.aliexpress.com/item/1005002721716529.html) | Per DIW BOM |

## Motors — complete set (4/4)

| Axis | Name | Motor | CNC slot | Status |
|------|------|-------|----------|--------|
| 0 | `boom` | 17HS4401-A51M, **5.18:1** planetary | X | Ordered |
| 1 | `swing` | 17HS4401-A51M, **5.18:1** planetary | Y | Ordered |
| 2 | `yaw` | Plain NEMA 17 | Z | **In inventory** |
| 3 | `pitch` | Plain NEMA 17 | A | **In inventory** |

### Electrical summary

| Motor | Current / phase | Steps / output rev @ 1/16 µstep |
|-------|-----------------|----------------------------------|
| Planetary (boom, swing) | 1.68 A | 16 576 (~46.0 / degree) |
| Plain (yaw, pitch) | Set per motor label (~1.5–1.7 A typical) | 3 200 (~8.9 / degree) |

Tune DRV8825 pots separately: higher current on geared axes if labeled higher; plain motors per their datasheet.

**DRV8825 trim:** set Vref for ~1.5–1.7 A per phase (measure with multimeter per your board’s formula; many clone boards use `I ≈ Vref × 2` with 0.1 Ω sense).

## Still to order

| Item | Qty | Notes |
|------|-----|--------|
| PSU | 1 | 12–24 V, ≥10 A |
| 5 V buck | 1 | ≥3 A for Pi 2 |
| Limit switches | 2 | Boom min + max |
| USB cable A→B | 1 | Pi ↔ Mega (data) |
| USB cable | 1 | Pi ↔ ZV-1 II (data) |
| Jumper wires | 1 set | Mega ↔ CNC shield |
| Optional: heatsinks | 4 | DRV8825 under load |

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
| Uno R3 from CNC kit | Use Mega only; kit USB cable for Mega |
| Waveshare HAT (production) | 2 drivers; Linux timing |
| GRBL | Custom velocity firmware |
| NEMA 8 focus/zoom | ZV-1 II remote zoom/focus |
| Sony Camera Remote SDK | ZV-1 II not in SDK list |
