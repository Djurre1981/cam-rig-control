/**
 * Drag the reference subject on the ground plane (y = 0) via LMB in preview panes.
 */

import * as THREE from "three";
import { groundHitToAim, type SubjectAimPoint } from "./subjectTarget";

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _ray = new THREE.Raycaster();
const _ndc = new THREE.Vector2();
const _hit = new THREE.Vector3();

function intersectGround(
  clientX: number,
  clientY: number,
  canvas: HTMLElement,
  camera: THREE.Camera
): THREE.Vector3 | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  _ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  _ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  _ray.setFromCamera(_ndc, camera);
  return _ray.ray.intersectPlane(GROUND, _hit) ? _hit.clone() : null;
}

export function createTargetDragControls(
  canvas: HTMLElement,
  getCamera: () => THREE.Camera | null,
  getEnabled: () => boolean,
  onAimChange: (aim: SubjectAimPoint) => void
) {
  let dragging = false;

  const pick = (clientX: number, clientY: number) => {
    const cam = getCamera();
    if (!cam) return;
    const hit = intersectGround(clientX, clientY, canvas, cam);
    if (hit) onAimChange(groundHitToAim(hit));
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!getEnabled() || e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    pick(e.clientX, e.clientY);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    pick(e.clientX, e.clientY);
  };

  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  return {
    dispose: () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
    },
  };
}
