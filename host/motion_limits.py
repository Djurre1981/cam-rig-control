"""Motion speed limits — keep in sync with ui/src/lib/motionLimits.ts"""

from __future__ import annotations

STEPS_PER_REV_GEARED = 16576.0
STEPS_PER_REV_DIRECT = 3200.0
BOOM_RANGE_DEG = 67.0

STEPS_PER_DEG = [
    STEPS_PER_REV_GEARED / 360.0,
    STEPS_PER_REV_GEARED / 360.0,
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
