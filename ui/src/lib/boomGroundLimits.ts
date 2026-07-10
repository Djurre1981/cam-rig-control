/**
 * Boom lower limit from front-camera ground clearance (y = 0 floor plane).
 */

import * as THREE from "three";
import { buildRig, applyRigPose, type RigNodes } from "./rigGeometry";
import { BOOM_MAX_RAD, BOOM_MIN_RAD, BOOM_REST_ANGLE } from "./rigConstants";
import type { RigPose } from "./rigKinematics";

export const GROUND_PLANE_Y = 0;
/** Minimum clearance between camera assembly and ground (metres). */
export const BOOM_GROUND_CLEARANCE_M = 0.02;

const _scene = new THREE.Scene();
const _box = new THREE.Box3();
let _nodes: RigNodes | null = null;

type HeadPose = Pick<RigPose, "swing" | "yaw" | "pitch">;

function rigNodes(): RigNodes {
  if (!_nodes) _nodes = buildRig(_scene);
  return _nodes;
}

/** Lowest world Y of the camera mesh assembly for a pose. */
export function cameraAssemblyMinY(pose: RigPose): number {
  const nodes = rigNodes();
  applyRigPose(nodes, pose);
  nodes.root.updateMatrixWorld(true);
  _box.setFromObject(nodes.camera);
  return _box.min.y;
}

let _minCacheKey = "";
let _minCache = BOOM_MIN_RAD;

/** Minimum boom angle (radians) that keeps the camera above the ground plane. */
export function minBoomRadiansForGround(
  head: HeadPose,
  clearance = BOOM_GROUND_CLEARANCE_M
): number {
  const key = `${head.swing.toFixed(4)}:${head.yaw.toFixed(4)}:${head.pitch.toFixed(4)}:${clearance}`;
  if (key === _minCacheKey) return _minCache;

  let lo = BOOM_MIN_RAD;
  let hi = BOOM_MAX_RAD;
  const probe: RigPose = { boom: hi, swing: head.swing, yaw: head.yaw, pitch: head.pitch, zoom: 1 };

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    probe.boom = mid;
    if (cameraAssemblyMinY(probe) < clearance) lo = mid;
    else hi = mid;
  }

  _minCacheKey = key;
  _minCache = hi;
  return hi;
}

export function maxBoomRadians(): number {
  return BOOM_MAX_RAD;
}

export function minBoomRadians(): number {
  return BOOM_MIN_RAD;
}

export function clampBoomRadians(boom: number, head: HeadPose): number {
  const minBoom = Math.max(BOOM_MIN_RAD, minBoomRadiansForGround(head));
  return Math.max(minBoom, Math.min(BOOM_MAX_RAD, boom));
}

/** Clamp pose.boom in place; returns true when the value was reduced. */
export function clampPoseBoom(pose: RigPose): boolean {
  const clamped = clampBoomRadians(pose.boom, pose);
  if (Math.abs(clamped - pose.boom) < 1e-9) return false;
  pose.boom = clamped;
  return true;
}

/** Normalized 0–1 boom travel for UI meters (ground-limited range). */
export function boomTravelNormalized(boom: number, head: HeadPose): number {
  const minBoom = Math.max(BOOM_MIN_RAD, minBoomRadiansForGround(head));
  const span = BOOM_MAX_RAD - minBoom;
  if (span < 1e-9) return 0;
  return Math.max(0, Math.min(1, (boom - minBoom) / span));
}
