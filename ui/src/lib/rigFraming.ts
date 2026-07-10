/**
 * Camera framing for the 3D rig preview.
 * Side elevation: back (−X) on the left, camera (+X) on the right.
 *
 * Framing uses the theoretical motion envelope (axis limits), not mesh bounds.
 */

import * as THREE from "three";
import { BOOM_MAX_RAD, BOOM_MIN_RAD, BOOM_REST_ANGLE } from "./rigConstants";
import { FRONT_REACH, PIVOT_Y, REAR_REACH, applyRigPose, buildRig } from "./rigGeometry";
import { HOME_SUBJECT_POSITION } from "./rigCameraScene";

export const FRAME_HW_RATIO = 0.5;
/** Viewport width ÷ height (matches orthographic framing). */
export const PREVIEW_VIEW_ASPECT = 1 / FRAME_HW_RATIO;
/** Fraction of frame width filled by rig reach; higher = larger model on screen. */
export const RIG_WIDTH_FILL = 0.92;
/** Multiplier for apparent rig size in the preview (2 = twice as large). */
export const PREVIEW_SCALE = 2;
/** 3D preview canvas / scene background (matches camera-view pane). */
export const PREVIEW_BACKGROUND = 0x1a1c22;
const FRAME_PAD = 1.06;

/** Framing projection for static side-elevation export (`rig-side.html`). */
export const VIEW_DIR = new THREE.Vector3(0, 0.08, -1).normalize();

/** Default interactive preview orbit — front-right elevated ¾ view (user reference). */
export const DEFAULT_VIEW_AZIMUTH = 0.72;
export const DEFAULT_VIEW_ELEVATION = -0.42;
export const DEFAULT_VIEW_ZOOM = 1;
export const DEFAULT_VIEW_PAN_X = 0;
export const DEFAULT_VIEW_PAN_Y = 0;

const _orbitUnit = new THREE.Vector3();

/** Unit offset from target → camera for an orbit pose. */
export function orbitOffsetUnit(azimuth: number, elevation: number, out = _orbitUnit): THREE.Vector3 {
  const phi = elevation + Math.PI / 2;
  return out.setFromSphericalCoords(1, phi, azimuth);
}

/** View direction (target → camera is opposite); used for view-aligned framing. */
export function viewDirFromOrbit(azimuth: number, elevation: number): THREE.Vector3 {
  return orbitOffsetUnit(azimuth, elevation, new THREE.Vector3()).negate();
}

const CAMERA_EXTENT = 0.18;
const BOOM_ANGLES = [BOOM_MIN_RAD, BOOM_MAX_RAD];

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
  const boomAngles = BOOM_ANGLES;

  for (const boom of boomAngles) {
    const rear = tipAtBoomAngle(boom, -REAR_REACH);
    const front = tipAtBoomAngle(boom, FRONT_REACH + CAMERA_EXTENT);
    box.expandByPoint(rear);
    box.expandByPoint(front);
    box.expandByPoint(new THREE.Vector3(front.x, front.y + 0.28, 0));
    box.expandByPoint(new THREE.Vector3(front.x, front.y - 0.38, 0));
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

function viewBasis(viewDir: THREE.Vector3) {
  const worldUp = new THREE.Vector3(0, 1, 0);
  _right.crossVectors(viewDir, worldUp);
  if (_right.lengthSq() < 1e-8) {
    _right.set(1, 0, 0);
  } else {
    _right.normalize();
  }
  _up.crossVectors(_right, viewDir).normalize();
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

export function projectedExtents(
  box: THREE.Box3,
  origin: THREE.Vector3,
  viewDir: THREE.Vector3 = VIEW_DIR
) {
  viewBasis(viewDir);
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

function lookAtFromProjection(
  anchor: THREE.Vector3,
  proj: ReturnType<typeof projectedExtents>,
  viewDir: THREE.Vector3
) {
  viewBasis(viewDir);
  return anchor
    .clone()
    .addScaledVector(_right, proj.centerR)
    .addScaledVector(_up, proj.centerU);
}

function framingSize(projW: number, projH: number) {
  const fitZoom = RIG_WIDTH_FILL;
  const orthoZoom = RIG_WIDTH_FILL * PREVIEW_SCALE;

  function sizeForZoom(zoom: number) {
    let w = (projW / zoom) * FRAME_PAD;
    let h = w * FRAME_HW_RATIO;
    if ((projH / zoom) * FRAME_PAD > h) {
      h = (projH / zoom) * FRAME_PAD;
      w = h / FRAME_HW_RATIO;
    }
    return { w, h };
  }

  const fit = sizeForZoom(fitZoom);
  const ortho = sizeForZoom(orthoZoom);
  return { frameW: ortho.w, frameH: ortho.h, fitW: fit.w, fitH: fit.h };
}

export type RigFraming = {
  target: THREE.Vector3;
  frameW: number;
  frameH: number;
  distance: number;
};

let _restPoseMeshBox: THREE.Box3 | null = null;

/** Axis-aligned bounds of the rig mesh at rest pose (interactive preview framing). */
export function getRestPoseMeshBox(): THREE.Box3 {
  if (!_restPoseMeshBox) {
    const scene = new THREE.Scene();
    const nodes = buildRig(scene);
    applyRigPose(nodes, { boom: BOOM_REST_ANGLE, swing: 0, yaw: 0, pitch: 0, zoom: 1 });
    _restPoseMeshBox = new THREE.Box3().setFromObject(nodes.root);
  }
  return _restPoseMeshBox;
}

let _interactivePreviewBounds: THREE.Box3 | null = null;

/** Rig mesh + home reference subject — interactive orbit framing. */
export function getInteractivePreviewBounds(): THREE.Box3 {
  if (!_interactivePreviewBounds) {
    const box = getRestPoseMeshBox().clone();
    box.expandByPoint(HOME_SUBJECT_POSITION);
    box.expandByPoint(HOME_SUBJECT_POSITION.clone().add(new THREE.Vector3(0, 0.34, 0)));
    box.expandByPoint(HOME_SUBJECT_POSITION.clone().add(new THREE.Vector3(0.14, 0, 0.14)));
    box.expandByPoint(HOME_SUBJECT_POSITION.clone().add(new THREE.Vector3(-0.14, 0, -0.14)));
    box.min.y = Math.min(box.min.y, 0);
    _interactivePreviewBounds = box;
  }
  return _interactivePreviewBounds;
}

export function getRigFraming(
  aspect: number,
  viewDir: THREE.Vector3 = VIEW_DIR,
  bounds: THREE.Box3 = motionEnvelopeBox()
): RigFraming {
  const proj = projectedExtents(bounds, FRAMING_ANCHOR, viewDir);
  const target = lookAtFromProjection(FRAMING_ANCHOR, proj, viewDir);
  const { frameW, frameH, fitW, fitH } = framingSize(proj.width, proj.height);

  const halfFovY = (34 * Math.PI) / 360;
  const halfFovX = Math.atan(Math.tan(halfFovY) * aspect);
  const distance = Math.max(
    fitW / (2 * Math.tan(halfFovX)),
    fitH / (2 * Math.tan(halfFovY)),
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
