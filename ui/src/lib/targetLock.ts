/**
 * Target lock: keep a fixed world point centered in the camera view by solving
 * the yaw / pitch (and, when needed, boom) that aim the lens at the target.
 *
 * The camera's world position is governed by boom + swing; its aim is governed
 * by swing + yaw + pitch. To keep a world point centered we re-solve the aim
 * angles for the current camera position each tick.
 */

import * as THREE from "three";
import { applyRigPose, buildRig, type RigNodes } from "./rigGeometry";
import { HOME_SUBJECT_POSITION, SUBJECT_AIM_LOCAL } from "./rigCameraScene";
import type { SubjectAimPoint } from "./subjectTarget";
import type { RigPose } from "./rigKinematics";
import { shortestRadDelta } from "./liveMotion";

/** World point the lens should keep centered (reference subject aim point). */
export const TARGET_LOCK_POINT = HOME_SUBJECT_POSITION.clone().add(SUBJECT_AIM_LOCAL);

const _scene = new THREE.Scene();
let _nodes: RigNodes | null = null;

function rigNodes(): RigNodes {
  if (!_nodes) {
    _nodes = buildRig(_scene);
    _nodes.root.visible = false;
  }
  return _nodes;
}

const _camPos = new THREE.Vector3();
const _camQuat = new THREE.Quaternion();
const _invQuat = new THREE.Quaternion();
const _toTarget = new THREE.Vector3();
const _local = new THREE.Vector3();
const _targetPoint = new THREE.Vector3();

function resolveTarget(target: THREE.Vector3 | SubjectAimPoint): THREE.Vector3 {
  if (target instanceof THREE.Vector3) return target;
  return _targetPoint.set(target.x, target.y, target.z);
}

export type AimSolution = {
  /** Yaw angle (radians) that centers the target horizontally. */
  yaw: number;
  /** Pitch angle (radians) that centers the target vertically. */
  pitch: number;
};

/**
 * Given a pose (only boom + swing matter for camera placement), return the yaw
 * and pitch that aim the rig lens (+X local) at `target`.
 *
 * The head chain is yaw (about local Y) then pitch (about local Z, with the
 * boom parallelogram countered in applyRigPose). We evaluate the yawHead world
 * frame with yaw = pitch = 0, then express the target direction in that frame
 * to read off the required yaw (azimuth about Y) and pitch (elevation).
 */
export function aimAnglesForTarget(
  pose: RigPose,
  target: THREE.Vector3 | SubjectAimPoint = TARGET_LOCK_POINT
): AimSolution {
  const aim = resolveTarget(target);
  const nodes = rigNodes();

  applyRigPose(nodes, { ...pose, yaw: 0, pitch: 0 });
  nodes.root.updateMatrixWorld(true);

  nodes.camera.getWorldPosition(_camPos);
  nodes.yawHead.getWorldQuaternion(_camQuat);

  _invQuat.copy(_camQuat).invert();
  _toTarget.copy(aim).sub(_camPos);
  _local.copy(_toTarget).applyQuaternion(_invQuat);

  // Local lens forward is +X. Yaw rotates about +Y (turns X toward ±Z),
  // pitch rotates about +Z (tilts X toward ±Y). The boom parallelogram means
  // applyRigPose sets pitchHead.z = pitch - boom, so the pitch we return is the
  // logical pitch that keeps footage level at pitch = 0.
  const yaw = Math.atan2(-_local.z, _local.x);
  const horiz = Math.hypot(_local.x, _local.z);
  const pitch = Math.atan2(_local.y, horiz);

  return { yaw, pitch };
}

/**
 * Step an angle toward a target by at most `maxDelta` (radians), taking the
 * shortest cyclic path. Returns the new angle.
 */
export function stepAngleToward(current: number, target: number, maxDelta: number): number {
  const delta = shortestRadDelta(current, target);
  if (Math.abs(delta) <= maxDelta) return current + delta;
  return current + Math.sign(delta) * maxDelta;
}
