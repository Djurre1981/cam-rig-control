/**
 * Mutable world aim point for the reference subject (torso center).
 */

import * as THREE from "three";
import { HOME_SUBJECT_DISTANCE, SUBJECT_AIM_LOCAL } from "./rigCameraScene";
import { lensWorldDirection, lensWorldPosition } from "./rigFocus";
import type { RigPose } from "./rigKinematics";
import { TARGET_LOCK_POINT } from "./targetLock";

export type SubjectAimPoint = { x: number; y: number; z: number };

export const DEFAULT_SUBJECT_AIM: SubjectAimPoint = {
  x: TARGET_LOCK_POINT.x,
  y: TARGET_LOCK_POINT.y,
  z: TARGET_LOCK_POINT.z,
};

const STORAGE_KEY = "camrig-subject-aim-v1";
const ORIGIN_CLAMP = 2.5;

const _origin = new THREE.Vector3();
const _aim = new THREE.Vector3();

export function aimToGroupOrigin(aim: SubjectAimPoint, out = _origin): THREE.Vector3 {
  return out.set(aim.x, aim.y, aim.z).sub(SUBJECT_AIM_LOCAL);
}

export function groupOriginToAim(origin: THREE.Vector3): SubjectAimPoint {
  _aim.copy(origin).add(SUBJECT_AIM_LOCAL);
  return { x: _aim.x, y: _aim.y, z: _aim.z };
}

export function clampGroupOrigin(origin: THREE.Vector3): THREE.Vector3 {
  origin.y = 0;
  origin.x = THREE.MathUtils.clamp(origin.x, -ORIGIN_CLAMP, ORIGIN_CLAMP);
  origin.z = THREE.MathUtils.clamp(origin.z, -ORIGIN_CLAMP, ORIGIN_CLAMP);
  return origin;
}

/** Ground-plane hit (y = 0) → subject group origin → aim point at torso height. */
export function groundHitToAim(hit: THREE.Vector3): SubjectAimPoint {
  return groupOriginToAim(clampGroupOrigin(hit.clone()));
}

export function loadSubjectAim(): SubjectAimPoint {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SUBJECT_AIM };
    const p = JSON.parse(raw) as SubjectAimPoint;
    if (typeof p.x === "number" && typeof p.y === "number" && typeof p.z === "number") {
      return p;
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SUBJECT_AIM };
}

export function saveSubjectAim(aim: SubjectAimPoint): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aim));
  } catch {
    /* ignore */
  }
}

export function applySubjectAimToMesh(subject: THREE.Object3D, aim: SubjectAimPoint): void {
  subject.position.copy(aimToGroupOrigin(aim));
}

export function formatSubjectAim(aim: SubjectAimPoint): string {
  return `${aim.x.toFixed(2)}, ${aim.y.toFixed(2)}, ${aim.z.toFixed(2)} m`;
}

export type SubjectAimFramingOptions = {
  /** Metres along lens axis; defaults to HOME_SUBJECT_DISTANCE / zoom. */
  distanceM?: number;
  /** Use a fixed world aim (orbit centre) instead of lens placement. */
  fixed?: SubjectAimPoint;
  /** Offset along camera-right (metres); positive = subject shifts right in frame. */
  lateralM?: number;
  /** World-space offset added after lens placement. */
  worldOffset?: { x: number; y: number; z: number };
};

const _aimVec = new THREE.Vector3();
const _right = new THREE.Vector3();

/**
 * World torso-centre aim for a rig pose — on the lens axis by default, with optional
 * lateral offset for over-shoulder / dutch framings, or a fixed point for orbit moves.
 */
export function subjectAimForPose(pose: RigPose, opts: SubjectAimFramingOptions = {}): SubjectAimPoint {
  if (opts.fixed) {
    return { x: opts.fixed.x, y: opts.fixed.y, z: opts.fixed.z };
  }

  const dist = opts.distanceM ?? HOME_SUBJECT_DISTANCE / Math.max(pose.zoom, 0.25);
  const pos = lensWorldPosition(pose);
  const fwd = lensWorldDirection(pose);
  _aimVec.copy(pos).addScaledVector(fwd, dist);

  if (opts.lateralM) {
    _right.set(0, 1, 0).cross(fwd);
    if (_right.lengthSq() > 1e-8) {
      _right.normalize();
      _aimVec.addScaledVector(_right, opts.lateralM);
    }
  }

  if (opts.worldOffset) {
    _aimVec.x += opts.worldOffset.x;
    _aimVec.y += opts.worldOffset.y;
    _aimVec.z += opts.worldOffset.z;
  }

  return { x: _aimVec.x, y: _aimVec.y, z: _aimVec.z };
}
