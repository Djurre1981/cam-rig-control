"""Motion speed limits — keep in sync with ui/src/lib/motionLimits.ts"""

from __future__ import annotations

STEPS_PER_REV_GEARED = 16576.0
STEPS_PER_REV_DIRECT = 3200.0
BOOM_RANGE_DEG = 67.0

# Boom: 20T pinion on planetary output drives 60T sector (3:1)
BOOM_PINION_TEETH = 20
BOOM_SECTOR_TEETH = 60
BOOM_GEAR_RATIO = BOOM_SECTOR_TEETH / BOOM_PINION_TEETH
STEPS_PER_REV_BOOM = STEPS_PER_REV_GEARED * BOOM_GEAR_RATIO
STEPS_PER_DEG_BOOM = STEPS_PER_REV_BOOM / 360.0

# Swing: 18T pinion on planetary output drives 180T slew ring (10:1)
SWING_PINION_TEETH = 18
SWING_RING_TEETH = 180
SWING_GEAR_RATIO = SWING_RING_TEETH / SWING_PINION_TEETH
STEPS_PER_REV_SWING = STEPS_PER_REV_GEARED * SWING_GEAR_RATIO
STEPS_PER_DEG_SWING = STEPS_PER_REV_SWING / 360.0

STEPS_PER_DEG = [
    STEPS_PER_DEG_BOOM,
    STEPS_PER_DEG_SWING,
    STEPS_PER_REV_DIRECT / 360.0,
    STEPS_PER_REV_DIRECT / 360.0,
]

FULL_TRAVEL_TIME_SEC = [2.0, 4.0, 2.0, 2.0]
FULL_TRAVEL_DEG = [BOOM_RANGE_DEG, 360.0, 360.0, 360.0]

AXIS_MAX_VEL_STEPS = [
    (deg / t) * spd for deg, t, spd in zip(FULL_TRAVEL_DEG, FULL_TRAVEL_TIME_SEC, STEPS_PER_DEG)
]


def clamp_axis_velocity(axis: int, velocity: float, speed_percent: float) -> float:
    cap = AXIS_MAX_VEL_STEPS[axis] * (speed_percent / 100.0)
    return max(-cap, min(cap, velocity))


def clamp_all_velocities(velocities: list[float], speed_percent: float) -> list[float]:
    return [clamp_axis_velocity(i, v, speed_percent) for i, v in enumerate(velocities)]
