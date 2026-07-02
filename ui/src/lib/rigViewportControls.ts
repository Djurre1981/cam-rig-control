/**
 * 3D preview viewport — Plasticity-style mouse controls:
 *   MMB drag = orbit · RMB drag = pan · wheel = zoom
 */

import * as THREE from "three";
import {
  DEFAULT_VIEW_AZIMUTH,
  DEFAULT_VIEW_ELEVATION,
  DEFAULT_VIEW_PAN_X,
  DEFAULT_VIEW_PAN_Y,
  DEFAULT_VIEW_ZOOM,
  getRigFraming,
  orbitOffsetUnit,
} from "./rigFraming";

export type ViewportState = {
  azimuth: number;
  elevation: number;
  zoom: number;
  panX: number;
  panY: number;
};

const ORBIT_SENS = 0.005;
const PAN_SENS = 0.002;
const ZOOM_SENS = 0.0012;
const ELEV_MIN = -Math.PI / 2 + 0.12;
const ELEV_MAX = Math.PI / 2 - 0.12;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 6;

const _target = new THREE.Vector3();
const _position = new THREE.Vector3();
const _offset = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

function defaultState(): ViewportState {
  return {
    azimuth: DEFAULT_VIEW_AZIMUTH,
    elevation: Math.max(ELEV_MIN, Math.min(ELEV_MAX, DEFAULT_VIEW_ELEVATION)),
    zoom: DEFAULT_VIEW_ZOOM,
    panX: DEFAULT_VIEW_PAN_X,
    panY: DEFAULT_VIEW_PAN_Y,
  };
}

function sphericalOffset(azimuth: number, elevation: number, distance: number, out: THREE.Vector3) {
  return orbitOffsetUnit(azimuth, elevation, out).multiplyScalar(distance);
}

export function applyViewport(
  camera: THREE.Camera,
  aspect: number,
  useOrtho: boolean,
  state: ViewportState
) {
  orbitOffsetUnit(state.azimuth, state.elevation, _offset);
  const viewDir = _offset.clone().negate().normalize();
  const framing = getRigFraming(aspect, viewDir);
  const baseTarget = framing.target;

  const distance = (useOrtho ? 4 : framing.distance) / state.zoom;
  sphericalOffset(state.azimuth, state.elevation, distance, _offset);
  _position.copy(baseTarget).add(_offset);

  camera.position.copy(_position);
  camera.up.set(0, 1, 0);
  camera.lookAt(baseTarget);
  camera.updateMatrixWorld();

  _right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  _up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  _target.copy(baseTarget);
  if (state.panX !== 0 || state.panY !== 0) {
    _target.addScaledVector(_right, state.panX).addScaledVector(_up, state.panY);
  }

  camera.position.copy(_target).add(_offset);
  camera.lookAt(_target);

  if (useOrtho) {
    const cam = camera as THREE.OrthographicCamera;
    let halfW = framing.frameW / 2 / state.zoom;
    let halfH = framing.frameH / 2 / state.zoom;
    const frameAspect = framing.frameW / framing.frameH;
    if (aspect > frameAspect) {
      halfW = halfH * aspect;
    } else {
      halfH = halfW / aspect;
    }
    cam.left = -halfW;
    cam.right = halfW;
    cam.top = halfH;
    cam.bottom = -halfH;
    cam.updateProjectionMatrix();
  } else {
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }
}

export function createViewportControls(
  canvas: HTMLElement,
  getCamera: () => THREE.Camera,
  getAspect: () => number,
  useOrtho: boolean,
  onChange: () => void
) {
  const state = defaultState();
  let drag: { mode: "orbit" | "pan"; lastX: number; lastY: number } | null = null;

  const reset = () => {
    const fresh = defaultState();
    state.azimuth = fresh.azimuth;
    state.elevation = fresh.elevation;
    state.zoom = fresh.zoom;
    state.panX = fresh.panX;
    state.panY = fresh.panY;
    applyViewport(getCamera(), getAspect(), useOrtho, state);
    onChange();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      drag = { mode: "orbit", lastX: e.clientX, lastY: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    } else if (e.button === 2) {
      e.preventDefault();
      drag = { mode: "pan", lastX: e.clientX, lastY: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;

    if (drag.mode === "orbit") {
      state.azimuth -= dx * ORBIT_SENS;
      state.elevation = Math.max(ELEV_MIN, Math.min(ELEV_MAX, state.elevation - dy * ORBIT_SENS));
    } else {
      const scale = 1 / state.zoom;
      state.panX -= dx * PAN_SENS * scale;
      state.panY += dy * PAN_SENS * scale;
    }

    applyViewport(getCamera(), getAspect(), useOrtho, state);
    onChange();
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.button === 1 || e.button === 2) {
      drag = null;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * ZOOM_SENS);
    state.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, state.zoom * factor));
    applyViewport(getCamera(), getAspect(), useOrtho, state);
    onChange();
  };

  const onContextMenu = (e: Event) => e.preventDefault();

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);

  applyViewport(getCamera(), getAspect(), useOrtho, state);

  return {
    state,
    reset,
    apply: () => applyViewport(getCamera(), getAspect(), useOrtho, state),
    dispose: () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
    },
  };
}
