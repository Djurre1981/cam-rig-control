/**
 * Camera framing for the 3D rig preview.
 * Side elevation: back (−X) on the left, camera (+X) on the right.
 *
 * Framing uses the theoretical motion envelope (axis limits), not mesh bounds.
 */

import * as THREE from "three";
import { BOOM_RANGE_DEG } from "./motionLimits";
import { BOOM_REST_ANGLE } from "./rigKinematics";
import { FRONT_REACH, PIVOT_Y, REAR_REACH } from "./rigGeometry";

export const FRAME_HW_RATIO = 0.5;
/** Viewport width ÷ height (matches orthographic framing). */
export const PREVIEW_VIEW_ASPECT = 1 / FRAME_HW_RATIO;
/** Fraction of frame width filled by rig reach; higher = larger model on screen. */
export const RIG_WIDTH_FILL = 0.92;
/** Multiplier for apparent rig size in the preview (2 = twice as large). */
export const PREVIEW_SCALE = 2;
/** 3D preview canvas / scene background. */
export const PREVIEW_BACKGROUND = 0xd4d8de;
const FRAME_PAD = 1.02;

/** View from +Z toward rig — back on left, camera on right. */
export const VIEW_DIR = new THREE.Vector3(0, 0.08, -1).normalize();

const CAMERA_EXTENT = 0.14;
const BOOM_HALF = ((BOOM_RANGE_DEG / 2) * Math.PI) / 180;

export const FRAMING_ANCHOR = new THREE.Vector3(0, PIVOT_Y, 0);

function tipAtBoomAngle(boom: number, reach: number): THREE.Vector3 {
  return new THREE.Vector3(
    Math.cos(boom) * reach,
    PIVOT_Y + Math.sin(boom) * reach,
    0
  );
}

/** Bounding box of all reachable poses (boom ±30°, full swing sweep). */
function motionEnvelopeBox(): THREE.Box3 {
  const box = new THREE.Box3();
  const boomAngles = [BOOM_REST_ANGLE - BOOM_HALF, BOOM_REST_ANGLE + BOOM_HALF];

  for (const boom of boomAngles) {
    const rear = tipAtBoomAngle(boom, -REAR_REACH);
    const front = tipAtBoomAngle(boom, FRONT_REACH + CAMERA_EXTENT);
    box.expandByPoint(rear);
    box.expandByPoint(front);
    box.expandByPoint(new THREE.Vector3(front.x, front.y + 0.12, 0));
    box.expandByPoint(new THREE.Vector3(rear.x, rear.y - 0.08, 0));
  }

  const swingReach = FRONT_REACH + REAR_REACH + CAMERA_EXTENT;
  for (const boom of boomAngles) {
    const mid = tipAtBoomAngle(boom, FRONT_REACH * 0.5);
    const r = swingReach * 0.55;
    box.expandByPoint(new THREE.Vector3(mid.x, mid.y, r));
    box.expandByPoint(new THREE.Vector3(mid.x, mid.y, -r));
  }

  box.min.y = Math.min(box.min.y, 0);
  return box;
}

const _corners = Array.from({ length: 8 }, () => new THREE.Vector3());
const _rel = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

function viewBasis() {
  const worldUp = new THREE.Vector3(0, 1, 0);
  _right.crossVectors(VIEW_DIR, worldUp).normalize();
  _up.crossVectors(_right, VIEW_DIR).normalize();
}

function boxCorners(box: THREE.Box3, out: THREE.Vector3[]) {
  const { min, max } = box;
  let i = 0;
  for (const x of [min.x, max.x]) {
    for (const y of [min.y, max.y]) {
      for (const z of [min.z, max.z]) {
        out[i++].set(x, y, z);
      }
    }
  }
}

export function projectedExtents(box: THREE.Box3, origin: THREE.Vector3) {
  viewBasis();
  boxCorners(box, _corners);

  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;

  for (const c of _corners) {
    _rel.subVectors(c, origin);
    const r = _rel.dot(_right);
    const u = _rel.dot(_up);
    minR = Math.min(minR, r);
    maxR = Math.max(maxR, r);
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
  }

  return {
    width: maxR - minR,
    height: maxU - minU,
    centerR: (minR + maxR) / 2,
    centerU: (minU + maxU) / 2,
  };
}

function lookAtFromProjection(anchor: THREE.Vector3, proj: ReturnType<typeof projectedExtents>) {
  viewBasis();
  return anchor
    .clone()
    .addScaledVector(_right, proj.centerR)
    .addScaledVector(_up, proj.centerU);
}

function framingSize(projW: number, projH: number) {
  const zoom = RIG_WIDTH_FILL * PREVIEW_SCALE;
  let frameW = (projW / zoom) * FRAME_PAD;
  let frameH = frameW * FRAME_HW_RATIO;
  if ((projH / zoom) * FRAME_PAD > frameH) {
    frameH = (projH / zoom) * FRAME_PAD;
    frameW = frameH / FRAME_HW_RATIO;
  }
  return { frameW, frameH };
}

export type RigFraming = {
  target: THREE.Vector3;
  frameW: number;
  frameH: number;
  distance: number;
};

export function getRigFraming(aspect: number): RigFraming {
  const proj = projectedExtents(motionEnvelopeBox(), FRAMING_ANCHOR);
  const target = lookAtFromProjection(FRAMING_ANCHOR, proj);
  const { frameW, frameH } = framingSize(proj.width, proj.height);

  const halfFovY = (34 * Math.PI) / 360;
  const halfFovX = Math.atan(Math.tan(halfFovY) * aspect);
  const distance = Math.max(
    frameW / (2 * Math.tan(halfFovX)),
    frameH / (2 * Math.tan(halfFovY)),
    0.01
  );

  return { target, frameW, frameH, distance };
}

function fitOrthoHalfExtents(frameW: number, frameH: number, aspect: number) {
  let halfW = frameW / 2;
  let halfH = frameH / 2;
  const frameAspect = frameW / frameH;
  if (aspect > frameAspect) {
    halfW = halfH * aspect;
  } else {
    halfH = halfW / aspect;
  }
  return { halfW, halfH };
}

export function frameRigOrtho(camera: THREE.OrthographicCamera, _rig: THREE.Object3D, aspect: number) {
  const { target, frameW, frameH } = getRigFraming(aspect);
  const { halfW, halfH } = fitOrthoHalfExtents(frameW, frameH, aspect);

  camera.left = -halfW;
  camera.right = halfW;
  camera.top = halfH;
  camera.bottom = -halfH;
  camera.position.copy(target).addScaledVector(VIEW_DIR, -4);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

export function frameRigPerspective(camera: THREE.PerspectiveCamera, _rig: THREE.Object3D, aspect: number) {
  const { target, distance } = getRigFraming(aspect);

  camera.position.copy(target).addScaledVector(VIEW_DIR, -distance);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}
