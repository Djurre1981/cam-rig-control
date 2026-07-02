/**
 * Scene for the lens / camera-view preview — subject placed at the rig "home" aim point.
 */

import * as THREE from "three";
import { applyRigPose, buildRig } from "./rigGeometry";
import { BOOM_REST_ANGLE, type RigPose } from "./rigKinematics";

/** Landscape frame aspect (16∶9). */
export const CAMERA_VIEW_ASPECT = 16 / 9;

const HOME_POSE: RigPose = {
  boom: BOOM_REST_ANGLE,
  swing: 0,
  yaw: 0,
  pitch: 0,
  zoom: 1,
};

const _fwd = new THREE.Vector3(1, 0, 0);
const _pos = new THREE.Vector3();
const _worldQuat = new THREE.Quaternion();

/** Rig lens (+X) → Three.js camera (−Z). */
export const RIG_LENS_TO_VIEW_QUAT = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  -Math.PI / 2
);

export function rigCameraToViewQuaternion(
  rigQuat: THREE.Quaternion,
  out = new THREE.Quaternion()
): THREE.Quaternion {
  return out.copy(rigQuat).multiply(RIG_LENS_TO_VIEW_QUAT);
}

/** Local point on the reference subject placed on the home aim axis (torso center). */
export const SUBJECT_AIM_LOCAL = new THREE.Vector3(0, 0.18, 0);

export const HOME_SUBJECT_DISTANCE = 1.15;

/** World position of the reference subject group when the rig is at home pose. */
export function homeSubjectPosition(distance = HOME_SUBJECT_DISTANCE): THREE.Vector3 {
  const scene = new THREE.Scene();
  const nodes = buildRig(scene);
  applyRigPose(nodes, HOME_POSE);
  nodes.root.updateMatrixWorld(true);
  nodes.camera.getWorldPosition(_pos);
  nodes.camera.getWorldQuaternion(_worldQuat);
  _fwd.set(1, 0, 0).applyQuaternion(_worldQuat);
  return _pos
    .clone()
    .add(_fwd.multiplyScalar(distance))
    .sub(SUBJECT_AIM_LOCAL);
}

export const HOME_SUBJECT_POSITION = homeSubjectPosition();

export function buildReferenceSubject(): THREE.Group {
  const group = new THREE.Group();
  group.name = "reference-subject";

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.1, 0.04, 20),
    new THREE.MeshStandardMaterial({ color: 0x4a4f58, metalness: 0.35, roughness: 0.55 })
  );
  pedestal.position.y = 0.02;
  group.add(pedestal);

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.055, 0.14, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0xe85d5d, metalness: 0.15, roughness: 0.62 })
  );
  body.position.y = 0.14;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf0c878, metalness: 0.1, roughness: 0.7 })
  );
  head.position.y = 0.28;
  group.add(head);

  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.028, 0.028),
    new THREE.MeshStandardMaterial({ color: 0x4f8cff, emissive: 0x1a3060, metalness: 0.2, roughness: 0.5 })
  );
  marker.position.set(0.07, 0.2, 0);
  group.add(marker);

  return group;
}

export function buildCameraViewEnvironment(scene: THREE.Scene): THREE.Group {
  const env = new THREE.Group();
  env.name = "camera-view-env";

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 0.05, roughness: 0.92 })
  );
  floor.rotation.x = -Math.PI / 2;
  env.add(floor);

  const grid = new THREE.GridHelper(6, 24, 0x8a919c, 0x9aa0a8);
  grid.position.y = 0.001;
  env.add(grid);

  const subject = buildReferenceSubject();
  subject.position.copy(HOME_SUBJECT_POSITION);
  env.add(subject);

  scene.add(env);
  return env;
}

/** Base vertical FOV (degrees) at zoom = 1 — approximate wide end of ZV-1 II. */
export const CAMERA_BASE_FOV = 48;

export function fovForZoom(zoom: number): number {
  return THREE.MathUtils.clamp(CAMERA_BASE_FOV / zoom, 18, 72);
}
