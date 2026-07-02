/**
 * Live jog integration and axis position formatting.
 */

import { BOOM_RANGE_DEG, ROTATION_UNITS_PER_DEG, axisMaxVelSteps, stepMotionToRad } from "./motionLimits";
import { boomTravelNormalized, clampPoseBoom } from "./boomGroundLimits";
import { BOOM_REST_ANGLE, type RigPose } from "./rigKinematics";
import { aimAnglesForTarget, stepAngleToward } from "./targetLock";

const RAD = 180 / Math.PI;

type HeadPose = Pick<RigPose, "swing" | "yaw" | "pitch">;

export type AxisRotationReadout = {
  /** Primary label, e.g. "+12.5°" or "184.0°". */
  display: string;
  /** Timeline units (swing / yaw / pitch only). */
  units: number | null;
  /** Normalized 0–1 for meters (matches EffectorBar). */
  movement: number;
};

function boomMovement(rad: number, head?: HeadPose): number {
  if (head) return boomTravelNormalized(rad, head);
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

export function formatAxisRotation(
  axis: number,
  rad: number,
  head?: HeadPose
): AxisRotationReadout {
  if (axis === 0) {
    const deg = (rad - BOOM_REST_ANGLE) * RAD;
    const sign = deg >= 0 ? "+" : "";
    return {
      display: `${sign}${deg.toFixed(1)}°`,
      units: null,
      movement: boomMovement(rad, head),
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
    if (i === 0) clampPoseBoom(pose);
    moved = true;
  }
  return moved;
}

export type LiveMotionResult = {
  moved: boolean;
  /** Axes that reached home this tick (caller should clear homing + velocity). */
  homingCompleted: number[];
  zoomHomingCompleted: boolean;
};

/** Target lock mode. */
export type TargetLockMode = "off" | "on" | "smooth";

/** Optical zoom range (matches rigGeometry / ZV-1 II clip values). */
export const ZOOM_MIN = 0.8;
export const ZOOM_MAX = 2.5;
export const ZOOM_HOME = 1;
/** Full zoom travel in 4 s at 100% speed cap. */
export const ZOOM_MAX_VEL = (ZOOM_MAX - ZOOM_MIN) / 4;

export function clampZoom(zoom: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
}

export function clampZoomVelocity(velocity: number, speedPercent: number): number {
  const cap = zoomVelocityCap(speedPercent);
  return Math.max(-cap, Math.min(cap, velocity));
}

export function zoomVelocityCap(speedPercent: number): number {
  return ZOOM_MAX_VEL * (speedPercent / 100);
}

export function formatZoomReadout(zoom: number): { display: string; movement: number } {
  return {
    display: `${zoom.toFixed(2)}×`,
    movement: (zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN),
  };
}

const POSE_AXES: (keyof Pick<RigPose, "boom" | "swing" | "yaw" | "pitch">)[] = [
  "boom",
  "swing",
  "yaw",
  "pitch",
];

/** Aim axes owned by the target-lock solver. */
const AIM_YAW = 2;
const AIM_PITCH = 3;

/** Integrate jog velocities and active homing moves toward rest pose. */
export function integrateLiveMotion(
  pose: RigPose,
  velocities: number[],
  homing: boolean[],
  dtSec: number,
  speedPercent: number,
  clampVelocity: (axis: number, v: number, pct: number) => number,
  targetLock: TargetLockMode = "off",
  zoomVelocity = 0,
  zoomHoming = false
): LiveMotionResult {
  const homingCompleted: number[] = [];
  let zoomHomingCompleted = false;
  let moved = false;
  const axes = POSE_AXES;
  const lockOn = targetLock !== "off";

  // Snapshot position axes before user motion so smooth-lock can rewind them.
  const beforeBoom = pose.boom;
  const beforeSwing = pose.swing;

  for (let i = 0; i < 4; i++) {
    // Under target lock the aim axes are driven by the solver, not the user.
    if (lockOn && (i === AIM_YAW || i === AIM_PITCH)) continue;

    if (homing[i]) {
      const current = axisRadians(pose, i);
      const deltaRad = radDeltaToHome(i, current);
      const maxSteps = axisMotionVelSteps(i, speedPercent);
      const travelRad = stepMotionToRad(i, maxSteps * dtSec);

      if (Math.abs(deltaRad) <= travelRad + 1e-9) {
        setAxisRadians(pose, i, homeAxisRadians(i));
        if (i === 0) clampPoseBoom(pose);
        homingCompleted.push(i);
        moved = true;
        continue;
      }

      const v = Math.sign(deltaRad) * maxSteps;
      pose[axes[i]] += stepMotionToRad(i, v * dtSec);
      if (i === 0) clampPoseBoom(pose);
      moved = true;
      continue;
    }

    const v = clampVelocity(i, velocities[i] ?? 0, speedPercent);
    if (Math.abs(v) < 1e-6) continue;
    pose[axes[i]] += stepMotionToRad(i, v * dtSec);
    if (i === 0) clampPoseBoom(pose);
    moved = true;
  }

  if (lockOn) {
    const aim = aimAnglesForTarget(pose);
    const yawMax = stepMotionToRad(AIM_YAW, axisMotionVelSteps(AIM_YAW, speedPercent) * dtSec);
    const pitchMax = stepMotionToRad(AIM_PITCH, axisMotionVelSteps(AIM_PITCH, speedPercent) * dtSec);

    const yawErr = Math.abs(shortestRadDelta(pose.yaw, aim.yaw));
    const pitchErr = Math.abs(shortestRadDelta(pose.pitch, aim.pitch));

    // Smooth lock: if the aim axes can't reach the required angle this tick,
    // rewind the user-driven position axes proportionally so the target stays
    // centered instead of drifting off-frame.
    if (targetLock === "smooth") {
      const yawShort = yawErr > yawMax + 1e-9 ? (yawErr - yawMax) / Math.max(yawErr, 1e-9) : 0;
      const pitchShort =
        pitchErr > pitchMax + 1e-9 ? (pitchErr - pitchMax) / Math.max(pitchErr, 1e-9) : 0;
      const hold = Math.max(yawShort, pitchShort);
      if (hold > 0) {
        pose.boom = beforeBoom + (pose.boom - beforeBoom) * (1 - hold);
        pose.swing = beforeSwing + (pose.swing - beforeSwing) * (1 - hold);
        clampPoseBoom(pose);
        const reAim = aimAnglesForTarget(pose);
        aim.yaw = reAim.yaw;
        aim.pitch = reAim.pitch;
      }
    }

    const newYaw = stepAngleToward(pose.yaw, aim.yaw, yawMax);
    const newPitch = stepAngleToward(pose.pitch, aim.pitch, pitchMax);
    if (Math.abs(newYaw - pose.yaw) > 1e-9 || Math.abs(newPitch - pose.pitch) > 1e-9) {
      pose.yaw = newYaw;
      pose.pitch = newPitch;
      moved = true;
    }
  }

  if (zoomHoming) {
    const delta = ZOOM_HOME - pose.zoom;
    const maxTravel = zoomVelocityCap(speedPercent) * dtSec;
    if (Math.abs(delta) <= maxTravel + 1e-9) {
      pose.zoom = ZOOM_HOME;
      zoomHomingCompleted = true;
      moved = true;
    } else {
      pose.zoom = clampZoom(pose.zoom + Math.sign(delta) * maxTravel);
      moved = true;
    }
  } else {
    const v = clampZoomVelocity(zoomVelocity, speedPercent);
    if (Math.abs(v) > 1e-6) {
      pose.zoom = clampZoom(pose.zoom + v * dtSec);
      moved = true;
    }
  }

  return { moved, homingCompleted, zoomHomingCompleted };
}
