/**
 * Lens position and subject distance for focus planning.
 * Uses the CAD-scaled rig mesh; distances are in metres.
 *
 * ## Nodal point vs lens centre
 *
 * **Lens centre (geometric)** — the physical middle of the lens barrel. Easy to measure
 * from CAD or the mount (we use the red lens marker mesh in rigGeometry).
 *
 * **Nodal point (optical)** — the point on the optical axis where a ray entering the
 * lens appears to bend. When you pan or tilt, the image does not shift if you rotate
 * about the nodal point. For focus distance at normal subject ranges (>1 m), the
 * difference between nodal point and geometric centre is usually a few centimetres
 * at most and can be ignored until you need critical focus marks.
 *
 * **Mount → lens (procedural model)** — pitch axis to lens centre from rigConstants
 *   (CAMERA_* and MOUNT_TO_LENS_*; measure on your ZV-1 II to replace).
 */

import * as THREE from "three";
import { applyRigPose, buildRig, type RigNodes } from "./rigGeometry";
import {
  MOUNT_TO_LENS_DROP_M,
  MOUNT_TO_LENS_FORWARD_M,
} from "./rigConstants";
import { TARGET_LOCK_POINT } from "./targetLock";
import type { SubjectAimPoint } from "./subjectTarget";
import type { RigPose } from "./rigKinematics";

const _aimPoint = new THREE.Vector3();

function resolveAimPoint(point?: SubjectAimPoint | THREE.Vector3): THREE.Vector3 {
  if (!point) return TARGET_LOCK_POINT;
  if (point instanceof THREE.Vector3) return point;
  return _aimPoint.set(point.x, point.y, point.z);
}

/** Distance from lens to the subject aim point (metres). */
export function homeSubjectDistance(pose: RigPose, aimPoint?: SubjectAimPoint | THREE.Vector3): number {
  return distanceToPoint(pose, resolveAimPoint(aimPoint));
}

const _scene = new THREE.Scene();
let _nodes: RigNodes | null = null;

const _lensPos = new THREE.Vector3();
const _lensFwd = new THREE.Vector3(1, 0, 0);
const _pitchPos = new THREE.Vector3();
const _localLens = new THREE.Vector3();

function rigNodes(): RigNodes {
  if (!_nodes) {
    _nodes = buildRig(_scene);
    _nodes.root.visible = false;
  }
  return _nodes;
}

/** Documented mount-to-lens offsets used by the procedural camera proxy. */
export function mountToLensOffsets(): {
  forwardM: number;
  dropM: number;
  straightM: number;
} {
  const straightM = Math.hypot(MOUNT_TO_LENS_FORWARD_M, MOUNT_TO_LENS_DROP_M);
  return {
    forwardM: MOUNT_TO_LENS_FORWARD_M,
    dropM: MOUNT_TO_LENS_DROP_M,
    straightM,
  };
}

/** World position of the lens centre for a pose. */
export function lensWorldPosition(pose: RigPose, out = _lensPos): THREE.Vector3 {
  const nodes = rigNodes();
  applyRigPose(nodes, pose);
  nodes.root.updateMatrixWorld(true);
  nodes.lensMark.getWorldPosition(out);
  return out;
}

/** World unit vector of lens optical axis (+X in rig space). */
export function lensWorldDirection(pose: RigPose, out = _lensFwd): THREE.Vector3 {
  const nodes = rigNodes();
  applyRigPose(nodes, pose);
  nodes.root.updateMatrixWorld(true);
  out.set(1, 0, 0).applyQuaternion(nodes.camera.getWorldQuaternion(new THREE.Quaternion()));
  return out.normalize();
}

/** Measured lens offset from pitch-axis mount in mount-local frame (metres). */
export function lensOffsetFromMount(pose: RigPose): THREE.Vector3 {
  const nodes = rigNodes();
  applyRigPose(nodes, pose);
  nodes.root.updateMatrixWorld(true);
  nodes.pitchHead.getWorldPosition(_pitchPos);
  lensWorldPosition(pose, _localLens);
  _localLens.sub(_pitchPos);
  const inv = nodes.pitchHead.getWorldQuaternion(new THREE.Quaternion()).invert();
  return _localLens.applyQuaternion(inv);
}

/** Distance from lens to a world point (metres). */
export function distanceToPoint(pose: RigPose, point: THREE.Vector3): number {
  return lensWorldPosition(pose).distanceTo(point);
}

/** Focus readout for the live panel. */
export function formatFocusDistance(metres: number): string {
  if (!Number.isFinite(metres) || metres <= 0) return "—";
  if (metres < 1) return `${(metres * 100).toFixed(0)} cm`;
  if (metres < 10) return `${metres.toFixed(2)} m`;
  return `${metres.toFixed(1)} m`;
}

/** Approximate focus diopters (1 / distance) for manual-focus planning. */
export function focusDiopters(metres: number): number | null {
  if (!Number.isFinite(metres) || metres <= 0) return null;
  return 1 / metres;
}

export function formatFocusDiopters(metres: number): string {
  const d = focusDiopters(metres);
  if (d == null) return "—";
  return `${d.toFixed(2)} D`;
}

export function formatMountToLensOffsets(): string {
  const { forwardM, dropM } = mountToLensOffsets();
  return `${(forwardM * 1000).toFixed(0)} mm fwd · ${(dropM * 1000).toFixed(0)} mm below pitch axis`;
}
