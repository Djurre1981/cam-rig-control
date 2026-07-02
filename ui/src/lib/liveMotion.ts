/**
 * Live jog integration and axis position formatting.
 */

import { BOOM_RANGE_DEG, ROTATION_UNITS_PER_DEG, axisMaxVelSteps, stepMotionToRad } from "./motionLimits";
import { BOOM_REST_ANGLE, type RigPose } from "./rigKinematics";

const RAD = 180 / Math.PI;

export type AxisRotationReadout = {
  /** Primary label, e.g. "+12.5°" or "184.0°". */
  display: string;
  /** Timeline units (swing / yaw / pitch only). */
  units: number | null;
  /** Normalized 0–1 for meters (matches EffectorBar). */
  movement: number;
};

function boomMovement(rad: number): number {
  const deg = (rad - BOOM_REST_ANGLE) * RAD;
  const half = BOOM_RANGE_DEG / 2;
  return Math.max(0, Math.min(1, (deg + half) / BOOM_RANGE_DEG));
}

function cyclicMovement(rad: number): number {
  const deg = ((rad * RAD) % 360 + 360) % 360;
  return deg / 360;
}

export function axisRadians(pose: RigPose, axis: number): number {
  return [pose.boom, pose.swing, pose.yaw, pose.pitch][axis] ?? 0;
}

/** Rest / home angle per axis (boom = bench rest, others = 0°). */
export function homeAxisRadians(axis: number): number {
  if (axis === 0) return BOOM_REST_ANGLE;
  return 0;
}

export function setAxisRadians(pose: RigPose, axis: number, rad: number): void {
  if (axis === 0) pose.boom = rad;
  else if (axis === 1) pose.swing = rad;
  else if (axis === 2) pose.yaw = rad;
  else pose.pitch = rad;
}

/** Shortest signed angle from `from` to `to` (radians). */
export function shortestRadDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  return delta;
}

/** Signed angle to home; boom uses linear travel, others take shortest cyclic path. */
export function radDeltaToHome(axis: number, currentRad: number): number {
  const target = homeAxisRadians(axis);
  if (axis === 0) return target - currentRad;
  return shortestRadDelta(currentRad, target);
}

/** Max jog/homing velocity (steps/s) for an axis at the current speed cap. */
export function axisMotionVelSteps(axis: number, speedPercent: number): number {
  return axisMaxVelSteps(axis) * (speedPercent / 100);
}

export function formatAxisRotation(axis: number, rad: number): AxisRotationReadout {
  if (axis === 0) {
    const deg = (rad - BOOM_REST_ANGLE) * RAD;
    const sign = deg >= 0 ? "+" : "";
    return {
      display: `${sign}${deg.toFixed(1)}°`,
      units: null,
      movement: boomMovement(rad),
    };
  }
  const deg = ((rad * RAD) % 360 + 360) % 360;
  const units = Math.round(deg * ROTATION_UNITS_PER_DEG);
  return {
    display: `${deg.toFixed(1)}°`,
    units,
    movement: cyclicMovement(rad),
  };
}

export function integrateLivePose(
  pose: RigPose,
  velocities: number[],
  dtSec: number,
  speedPercent: number,
  clampVelocity: (axis: number, v: number, pct: number) => number
): boolean {
  let moved = false;
  const axes: (keyof Pick<RigPose, "boom" | "swing" | "yaw" | "pitch">)[] = [
    "boom",
    "swing",
    "yaw",
    "pitch",
  ];
  for (let i = 0; i < 4; i++) {
    const v = clampVelocity(i, velocities[i] ?? 0, speedPercent);
    if (Math.abs(v) < 1e-6) continue;
    pose[axes[i]] += stepMotionToRad(i, v * dtSec);
    moved = true;
  }
  return moved;
}

export type LiveMotionResult = {
  moved: boolean;
  /** Axes that reached home this tick (caller should clear homing + velocity). */
  homingCompleted: number[];
};

/** Integrate jog velocities and active homing moves toward rest pose. */
export function integrateLiveMotion(
  pose: RigPose,
  velocities: number[],
  homing: boolean[],
  dtSec: number,
  speedPercent: number,
  clampVelocity: (axis: number, v: number, pct: number) => number
): LiveMotionResult {
  const homingCompleted: number[] = [];
  let moved = false;
  const axes: (keyof Pick<RigPose, "boom" | "swing" | "yaw" | "pitch">)[] = [
    "boom",
    "swing",
    "yaw",
    "pitch",
  ];

  for (let i = 0; i < 4; i++) {
    if (homing[i]) {
      const current = axisRadians(pose, i);
      const deltaRad = radDeltaToHome(i, current);
      const maxSteps = axisMotionVelSteps(i, speedPercent);
      const travelRad = stepMotionToRad(i, maxSteps * dtSec);

      if (Math.abs(deltaRad) <= travelRad + 1e-9) {
        setAxisRadians(pose, i, homeAxisRadians(i));
        homingCompleted.push(i);
        moved = true;
        continue;
      }

      const v = Math.sign(deltaRad) * maxSteps;
      pose[axes[i]] += stepMotionToRad(i, v * dtSec);
      moved = true;
      continue;
    }

    const v = clampVelocity(i, velocities[i] ?? 0, speedPercent);
    if (Math.abs(v) < 1e-6) continue;
    pose[axes[i]] += stepMotionToRad(i, v * dtSec);
    moved = true;
  }

  return { moved, homingCompleted };
}
