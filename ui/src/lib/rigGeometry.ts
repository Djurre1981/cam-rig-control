/**
 * Procedural DIW 4-axis camera rig — side-elevation schematic model.
 *
 * Kinematics ref: https://www.youtube.com/watch?v=kPe2O8CkQAY (~11:26)
 *
 * Side view (+X = camera / lens, −X = counterweight, +Z = toward viewer):
 *   pole → swing (Y) → boom hinge (Z) → head mount → yaw (Y, panorama) → pitch (Z, loop) → camera
 *
 * Yaw:  vertical axis at boom/head joint — full 360° = horizontal panorama in footage.
 * Pitch: horizontal axis through lens (along Z) — full 360° = straight loop in footage.
 *
 * Head mount ref: landscape camera in hanging U-cradle below yaw motor (DIW stills).
 *
 * Solid colored rings = UI rotation axes (track colors).
 * White dotted segments + caps = physical revolution axes (per video still).
 */

import * as THREE from "three";
import type { RigPose } from "./rigKinematics";

export const FRONT_REACH = 0.92;
export const REAR_REACH = 0.48;
export const PIVOT_Y = 0.52;
export const POLE_HEIGHT = PIVOT_Y;

export const COL = {
  print: 0x2f84e3,
  printDark: 0x1f5fa8,
  tube: 0x12141a,
  pole: 0x1a1a1e,
  cam: 0x10141c,
  lensMark: 0xd42b2b,
  boom: 0xe85d5d,
  swing: 0xd4b84a,
  yaw: 0x5de88a,
  pitch: 0x4f8cff,
  axisLine: 0xf2f2f2,
  axisCap: 0xd8d8d8,
} as const;

export type RigNodes = {
  root: THREE.Group;
  swing: THREE.Group;
  boomPivot: THREE.Group;
  yawHead: THREE.Group;
  pitchHead: THREE.Group;
  camera: THREE.Group;
  lensMark: THREE.Mesh;
};

function mat(color: number, metal = 0.2, rough = 0.58): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
}

function block(w: number, h: number, d: number, color: number = COL.print): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, 0.12, 0.68));
}

function tubeAlongX(radius: number, length: number, color: number = COL.tube): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat(color, 0.45, 0.42));
  m.rotation.z = Math.PI / 2;
  m.position.x = length / 2;
  return m;
}

function tubeAlongZ(radius: number, length: number, color: number = COL.tube): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat(color, 0.45, 0.42));
  m.rotation.x = Math.PI / 2;
  return m;
}

/** White dotted physical axis with flat end caps (video still style). */
function actualAxis(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  const points = [from, to];
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(
    geo,
    new THREE.LineDashedMaterial({ color: COL.axisLine, dashSize: 0.035, gapSize: 0.025 })
  );
  line.computeLineDistances();
  parent.add(line);

  const capW = 0.04;
  const capH = 0.008;
  const dir = new THREE.Vector3().subVectors(to, from).normalize();
  const isMostlyVertical = Math.abs(dir.y) > 0.85;

  for (const p of points) {
    const cap = isMostlyVertical
      ? block(capW, capH, capH * 0.6, COL.axisCap)
      : block(capH, capH * 0.6, capW, COL.axisCap);
    cap.position.copy(p);
    parent.add(cap);
  }
}

/** Slight nudge so boom/pitch rings sit beside the joint (user reference). */
const RING_BESIDE_OFFSET = new THREE.Vector3(0, 0, 0.08);

/** Solid torus ring marking a UI rotation axis (track color). */
function uiAxisRing(
  parent: THREE.Object3D,
  color: number,
  radius: number,
  axis: "x" | "y" | "z",
  position = new THREE.Vector3(),
  besideOffset?: THREE.Vector3
) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.011, 8, 28),
    mat(color, 0.5, 0.35)
  );
  ring.position.copy(position);
  if (besideOffset) ring.position.add(besideOffset);
  if (axis === "x") ring.rotation.y = Math.PI / 2;
  if (axis === "y") ring.rotation.x = Math.PI / 2;
  parent.add(ring);
}

export function buildRig(scene: THREE.Scene): RigNodes {
  const root = new THREE.Group();
  scene.add(root);

  const tubeR = 0.022;
  const boomSpan = FRONT_REACH + REAR_REACH;

  const swing = new THREE.Group();
  root.add(swing);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.032, POLE_HEIGHT, 12),
    mat(COL.pole, 0.35, 0.55)
  );
  pole.position.y = POLE_HEIGHT / 2;
  swing.add(pole);

  // Swing ring: flat around pole base (user reference).
  uiAxisRing(swing, COL.swing, 0.13, "y", new THREE.Vector3(0, 0.04, 0));
  actualAxis(swing, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, POLE_HEIGHT + 0.08, 0));

  const boomPivot = new THREE.Group();
  boomPivot.position.set(0, PIVOT_Y, 0);
  swing.add(boomPivot);

  boomPivot.add(block(0.1, 0.1, 0.1, COL.printDark));
  const hingeMark = block(0.14, 0.04, 0.14, COL.boom);
  hingeMark.position.y = 0.02;
  boomPivot.add(hingeMark);

  // Boom ring: vertical, beside pole-top hinge (user reference).
  uiAxisRing(boomPivot, COL.boom, 0.09, "z", new THREE.Vector3(), RING_BESIDE_OFFSET);
  actualAxis(boomPivot, new THREE.Vector3(-0.55, 0, 0), new THREE.Vector3(0.55, 0, 0));

  const boomBar = tubeAlongX(tubeR, boomSpan);
  boomBar.position.set(-REAR_REACH + boomSpan / 2, 0, 0);
  boomPivot.add(boomBar);

  const lowerBar = tubeAlongX(tubeR * 0.85, boomSpan * 0.92, COL.printDark);
  lowerBar.position.set(-REAR_REACH * 0.9 + (boomSpan * 0.92) / 2, -0.07, 0);
  boomPivot.add(lowerBar);

  const rearMotor = block(0.1, 0.11, 0.1);
  rearMotor.position.set(-REAR_REACH * 0.65, 0.02, 0);
  boomPivot.add(rearMotor);
  const counterBlock = block(0.12, 0.09, 0.12, COL.tube);
  counterBlock.position.set(-REAR_REACH * 0.82, -0.01, 0);
  boomPivot.add(counterBlock);

  const midMotor = block(0.09, 0.1, 0.09, COL.print);
  midMotor.position.set(0.08, 0.03, 0);
  boomPivot.add(midMotor);

  // Yaw — vertical axis at boom end; motor on boom line, U-cradle hangs below (DIW reference).
  const yawHead = new THREE.Group();
  yawHead.position.set(FRONT_REACH, 0, 0);
  boomPivot.add(yawHead);

  const boomEndTruss = block(0.09, 0.055, 0.11, COL.printDark);
  boomEndTruss.position.set(-0.055, 0.01, 0);
  yawHead.add(boomEndTruss);

  const yawPlatform = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.068, 0.022, 20),
    mat(COL.print)
  );
  yawPlatform.position.y = -0.015;
  yawHead.add(yawPlatform);

  const yawMotor = block(0.085, 0.075, 0.085, COL.pole);
  yawMotor.position.y = 0.03;
  yawHead.add(yawMotor);

  // Yaw ring: horizontal, above motor on vertical axis.
  uiAxisRing(yawHead, COL.yaw, 0.085, "y", new THREE.Vector3(0, 0.14, 0));
  actualAxis(yawHead, new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(0, -0.3, 0));

  // Triangular drop plate — yaw axis to cradle top bar.
  const dropPlate = block(0.11, 0.007, 0.13, 0xb8bcc4);
  dropPlate.position.set(0, -0.055, 0);
  yawHead.add(dropPlate);
  for (const sx of [-1, 1] as const) {
    const wing = block(0.05, 0.006, 0.06, 0xb8bcc4);
    wing.position.set(sx * 0.03, -0.072, sx * 0.028);
    wing.rotation.z = sx * 0.42;
    yawHead.add(wing);
  }

  const frameW = 0.13;
  const frameH = 0.15;
  const cradleTopY = -0.095;

  const cradle = new THREE.Group();
  cradle.position.set(0, cradleTopY, 0);
  yawHead.add(cradle);

  const frameTop = tubeAlongZ(tubeR, frameW, COL.tube);
  cradle.add(frameTop);

  for (const z of [-frameW / 2, frameW / 2] as const) {
    const joint = block(0.042, 0.042, 0.042, COL.print);
    joint.position.set(0, 0, z);
    cradle.add(joint);

    const post = block(0.03, frameH, 0.03, COL.tube);
    post.position.set(0, -frameH / 2, z);
    cradle.add(post);
  }

  const frameBottom = tubeAlongZ(tubeR, frameW, COL.tube);
  frameBottom.position.y = -frameH;
  cradle.add(frameBottom);

  for (const z of [-frameW / 2, frameW / 2] as const) {
    const bottomJoint = block(0.04, 0.038, 0.04, COL.print);
    bottomJoint.position.set(0, -frameH, z);
    cradle.add(bottomJoint);
  }

  // Pitch — horizontal axis through lens (along Z); camera on bottom bar tilts in vertical plane.
  const pitchHead = new THREE.Group();
  pitchHead.position.set(0, -frameH, 0);
  cradle.add(pitchHead);

  const pitchGear = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.016, 16),
    mat(COL.print)
  );
  pitchGear.rotation.x = Math.PI / 2;
  pitchGear.position.set(-0.015, -0.02, frameW / 2 + 0.012);
  pitchHead.add(pitchGear);

  // Pitch ring: vertical, beside head joint (user reference).
  uiAxisRing(pitchHead, COL.pitch, 0.075, "z", new THREE.Vector3(), RING_BESIDE_OFFSET);
  actualAxis(pitchHead, new THREE.Vector3(0, 0, -0.11), new THREE.Vector3(0, 0, 0.11));

  const camera = new THREE.Group();
  camera.position.y = -0.02;
  pitchHead.add(camera);

  // Landscape mount (Lumix-style): wide along Z, lens along +X, side profile in X×Y.
  const bodyW = 0.05;
  const bodyH = 0.086;
  const bodyD = 0.11;
  const body = block(bodyW, bodyH, bodyD, COL.cam);
  camera.add(body);

  const baseplate = block(bodyW + 0.024, 0.012, bodyD + 0.016, COL.print);
  baseplate.position.y = -bodyH / 2 - 0.006;
  camera.add(baseplate);

  const ffRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.034, 0.006, 8, 24),
    mat(COL.print, 0.35, 0.5)
  );
  ffRing.rotation.y = Math.PI / 2;
  ffRing.position.x = bodyW / 2 + 0.008;
  camera.add(ffRing);

  const lensMark = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.014, 24),
    mat(COL.lensMark, 0.15, 0.45)
  );
  lensMark.rotation.z = Math.PI / 2;
  lensMark.position.x = bodyW / 2 + 0.022;
  camera.add(lensMark);

  return { root, swing, boomPivot, yawHead, pitchHead, camera, lensMark };
}

export function applyRigPose(nodes: RigNodes, pose: RigPose) {
  nodes.swing.rotation.y = pose.swing;
  nodes.boomPivot.rotation.z = pose.boom;
  // Yaw: vertical axis → horizontal panorama in camera footage.
  nodes.yawHead.rotation.y = pose.yaw;
  // Pitch motor + parallelogram: boom tilt is countered so pitch=0 stays level.
  nodes.pitchHead.rotation.z = pose.pitch - pose.boom;
  const z = THREE.MathUtils.clamp(pose.zoom, 0.8, 2.5);
  nodes.lensMark.scale.setScalar(0.85 + (z - 1) * 0.4);
  nodes.camera.scale.setScalar(0.95 + (z - 1) * 0.06);
}
