/**
 * Physical motion speed limits derived from minimum traverse times.
 *
 * Boom:  67° full range (+40° to −27°) in 2 s
 * Swing: 360° in 4 s
 * Yaw:   360° in 2 s
 * Pitch: 360° in 2 s
 *
 * Velocities are in steps/s (DRV8825 1/16 microstepping).
 */

import { AXIS_LABELS } from "../types";
import { BOOM_RANGE_DEG } from "./rigConstants";

export { BOOM_RANGE_DEG };

/** Planetary motor output: 200 × 16 × 5.18 */
export const STEPS_PER_REV_GEARED = 16576;
/** Direct NEMA 17 (yaw, pitch): 200 × 16 */
export const STEPS_PER_REV_DIRECT = 3200;

/** Boom sector gear: 60T driven by 20T pinion on planetary output → ×3 */
export const BOOM_PINION_TEETH = 20;
export const BOOM_SECTOR_TEETH = 60;
export const BOOM_GEAR_RATIO = BOOM_SECTOR_TEETH / BOOM_PINION_TEETH;
export const STEPS_PER_REV_BOOM = STEPS_PER_REV_GEARED * BOOM_GEAR_RATIO;
export const STEPS_PER_DEG_BOOM = STEPS_PER_REV_BOOM / 360;

/** Swing ring gear: 180T driven by 18T pinion on planetary output → ×10 */
export const SWING_PINION_TEETH = 18;
export const SWING_RING_TEETH = 180;
export const SWING_GEAR_RATIO = SWING_RING_TEETH / SWING_PINION_TEETH;
export const STEPS_PER_REV_SWING = STEPS_PER_REV_GEARED * SWING_GEAR_RATIO;
export const STEPS_PER_DEG_SWING = STEPS_PER_REV_SWING / 360;

/** Timeline rotation axes: 10 units per degree, 3600 units = 360° (swing, yaw, pitch). */
export const ROTATION_UNITS_PER_DEG = 10;
export const ROTATION_UNITS_PER_REV = 3600;

/** @deprecated use ROTATION_UNITS_PER_DEG */
export const SWING_UNITS_PER_DEG = ROTATION_UNITS_PER_DEG;
/** @deprecated use ROTATION_UNITS_PER_REV */
export const SWING_UNITS_PER_REV = ROTATION_UNITS_PER_REV;

export function usesRotationUnits(axis: number): boolean {
  return axis === 1 || axis === 2 || axis === 3;
}

const STEPS_PER_DEG = [
  STEPS_PER_DEG_BOOM,
  STEPS_PER_DEG_SWING,
  STEPS_PER_REV_DIRECT / 360,
  STEPS_PER_REV_DIRECT / 360,
] as const;

/** Minimum time (s) for full axis travel at max speed. */
const FULL_TRAVEL_TIME_SEC = [2, 4, 2, 2] as const;

const FULL_TRAVEL_DEG = [BOOM_RANGE_DEG, 360, 360, 360] as const;

/** Max velocity in steps/s per axis [boom, swing, yaw, pitch]. */
export const AXIS_MAX_VEL_STEPS: readonly number[] = FULL_TRAVEL_DEG.map(
  (deg, i) => (deg / FULL_TRAVEL_TIME_SEC[i]) * STEPS_PER_DEG[i]
);

export function axisMaxVelSteps(axis: number): number {
  return AXIS_MAX_VEL_STEPS[axis] ?? AXIS_MAX_VEL_STEPS[0];
}

/** Cap velocity to ±(max × speedPercent/100). */
export function clampAxisVelocity(axis: number, velocity: number, speedPercent: number): number {
  const cap = axisMaxVelSteps(axis) * (speedPercent / 100);
  return Math.max(-cap, Math.min(cap, velocity));
}

export function clampAllVelocities(velocities: number[], speedPercent: number): number[] {
  return velocities.map((v, i) => clampAxisVelocity(i, v, speedPercent));
}

/** Max allowed velocity at given speed percent (signed). */
export function axisVelocityCap(axis: number, speedPercent: number): number {
  return axisMaxVelSteps(axis) * (speedPercent / 100);
}

/** Max move position velocity (units/s or steps/s depending on axis). */
export function axisMaxPositionVel(axis: number, speedPercent: number): number {
  if (usesRotationUnits(axis)) {
    return (ROTATION_UNITS_PER_REV / FULL_TRAVEL_TIME_SEC[axis]) * (speedPercent / 100);
  }
  return axisVelocityCap(axis, speedPercent);
}

export function rotationUnitsToDeg(units: number): number {
  return units / ROTATION_UNITS_PER_DEG;
}

export function rotationUnitsToRad(units: number): number {
  return rotationUnitsToDeg(units) * (Math.PI / 180);
}

/** @deprecated use rotationUnitsToDeg */
export const swingUnitsToDeg = rotationUnitsToDeg;

/** @deprecated use rotationUnitsToRad */
export const swingUnitsToRad = rotationUnitsToRad;

/** Convert integrated step motion to radians (jog / live). */
export function stepMotionToRad(axis: number, steps: number): number {
  const stepsPerDeg = STEPS_PER_DEG[axis] ?? STEPS_PER_DEG[0];
  return (steps / stepsPerDeg) * (Math.PI / 180);
}

/** Convert MoveClip position to radians (swing uses UI units, others use legacy scale). */
const LEGACY_MOVE_SCALE_TO_RAD = [0.00014, 0, 0.00014, 0.00014] as const;

export function movePositionToRad(axis: number, position: number): number {
  if (usesRotationUnits(axis)) return rotationUnitsToRad(position);
  return position * (LEGACY_MOVE_SCALE_TO_RAD[axis] ?? LEGACY_MOVE_SCALE_TO_RAD[0]);
}

export function formatAxisMaxVel(axis: number): string {
  return `${Math.round(axisMaxVelSteps(axis))} steps/s`;
}

export function axisLimitLabel(axis: number): string {
  const deg = FULL_TRAVEL_DEG[axis];
  const sec = FULL_TRAVEL_TIME_SEC[axis];
  if (usesRotationUnits(axis)) {
    return `${AXIS_LABELS[axis]}: ${ROTATION_UNITS_PER_REV} units (360°) in ${sec}s → ${Math.round(axisMaxPositionVel(axis, 100))} units/s`;
  }
  const unit = axis === 0 ? `${deg}° range` : "360°";
  return `${AXIS_LABELS[axis]}: ${unit} in ${sec}s → ${formatAxisMaxVel(axis)}`;
}

/** For MoveClip: max position delta achievable in duration at capped speed. */
export function cappedMoveDelta(
  axis: number,
  from: number,
  to: number,
  duration: number,
  speedPercent: number
): number {
  const cap = axisMaxPositionVel(axis, speedPercent);
  const maxTravel = cap * duration;
  const delta = to - from;
  if (Math.abs(delta) <= maxTravel) return to;
  return from + Math.sign(delta) * maxTravel;
}
