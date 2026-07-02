/**
 * Camera roll / pitch from world quaternion (lens +X forward, +Y up in rig space).
 */

import * as THREE from "three";

const _forward = new THREE.Vector3();
const _up = new THREE.Vector3();
const _right = new THREE.Vector3();
const _worldUp = new THREE.Vector3(0, 1, 0);
const _horizonUp = new THREE.Vector3();

/** Roll (radians): positive = banked clockwise when looking through the lens. */
export function cameraRollRadians(quat: THREE.Quaternion): number {
  _forward.set(1, 0, 0).applyQuaternion(quat).normalize();
  _up.set(0, 1, 0).applyQuaternion(quat).normalize();

  _horizonUp.copy(_worldUp).addScaledVector(_forward, -_worldUp.dot(_forward));
  if (_horizonUp.lengthSq() < 1e-8) return 0;
  _horizonUp.normalize();

  _right.crossVectors(_forward, _up).normalize();
  return Math.atan2(_right.dot(_horizonUp), _up.dot(_horizonUp));
}

/** Pitch (radians): positive = lens points above the horizontal plane. */
export function cameraPitchRadians(quat: THREE.Quaternion): number {
  _forward.set(1, 0, 0).applyQuaternion(quat).normalize();
  const horiz = Math.hypot(_forward.x, _forward.z);
  return Math.atan2(_forward.y, horiz);
}
