/**
 * Procedural DIW 4-axis camera rig — CAD-scaled viewport model.
 *
 * Side view (+X = camera, −X = counterweight, +Z = toward viewer).
 * Simplified from cursor/renders/ (Jul 2026).
 */

import * as THREE from "three";
import type { RigPose } from "./rigKinematics";
import {
  BOOM_LINK_LENGTH_M,
  BOOM_SPAN_M,
  CAMERA_BODY_X_M,
  CAMERA_BODY_Y_M,
  CAMERA_BODY_Z_M,
  CAMERA_LENS_LENGTH_M,
  CAMERA_LENS_RADIUS_M,
  CAMERA_MOUNT_RISE_M,
  FRONT_BRACKET_DEPTH_M,
  HEAD_INNER_HALF_M,
  HEAD_INNER_WIDTH_M,
  HEAD_OUTER_HALF_M,
  HEAD_OUTER_WIDTH_M,
  HEAD_PITCH_Y_M,
  HEAD_RAIL_M,
  HEAD_Y_BOTTOM_M,
  HEAD_Y_FRAME_TOP_M,
  HEAD_Y_LENS_M,
  PARALLELOGRAM_END_SPACING_M,
  PARALLELOGRAM_SPACING_M,
  POLE_HEIGHT_M,
  REACH_REAR_M,
  REACH_YAW_M,
  TUBE_LOWER_RADIUS_M,
  TUBE_UPPER_RADIUS_M,
  YAW_TO_CRADLE_FORWARD_M,
} from "./rigConstants";

export const FRONT_REACH = REACH_YAW_M;
export const REAR_REACH = REACH_REAR_M;
export const PIVOT_Y = POLE_HEIGHT_M;

/** Viewport materials — printed grey-blue, brushed aluminium tubes. */
export const COL = {
  print: 0xa4acb8,
  printDark: 0x6e7888,
  printMid: 0x8892a0,
  tube: 0xc8ccd4,
  tubeDark: 0xa8adb6,
  pole: 0x3d424a,
  tripod: 0x2a2d32,
  cam: 0x14181e,
  lensMark: 0xc43030,
  gear: 0x4aaf72,
  gearRed: 0xd94a4a,
  gearPurple: 0x8b5cf6,
  boom: 0xe85d5d,
  swing: 0x4f8cff,
  yaw: 0x5de88a,
  pitch: 0xd4b84a,
  axisLine: 0xe8e8ec,
  axisCap: 0xc8c8cc,
} as const;

export type RigNodes = {
  root: THREE.Group;
  swing: THREE.Group;
  boomPivot: THREE.Group;
  headCarriage: THREE.Group;
  yawHead: THREE.Group;
  pitchHead: THREE.Group;
  camera: THREE.Group;
  lensMark: THREE.Mesh;
  lowerLink: THREE.Mesh;
};

function mat(color: number, metal = 0.15, rough = 0.62): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
}

function aluminium(color: number = COL.tube): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.72, roughness: 0.32 });
}

function box(w: number, h: number, d: number, color: number = COL.print): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, 0.1, 0.7));
}

/** Cylinder centred on origin, local axis +X (boom tube direction). */
function tubeAlongX(r: number, refLength: number, color: number = COL.tube): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, refLength, 14), aluminium(color));
  m.rotation.z = -Math.PI / 2;
  return m;
}

function tubeZ(r: number, len: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), aluminium());
  m.rotation.x = Math.PI / 2;
  return m;
}

function axisLine(parent: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(
    geo,
    new THREE.LineDashedMaterial({ color: COL.axisLine, dashSize: 0.035, gapSize: 0.022 })
  );
  line.computeLineDistances();
  parent.add(line);
}

function buildTripod(parent: THREE.Group) {
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.03, 12), mat(COL.tripod, 0.4, 0.5));
  hub.position.y = 0.015;
  parent.add(hub);

  for (let i = 0; i < 3; i++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.42, 8), mat(COL.tripod, 0.35, 0.55));
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    leg.position.set(Math.cos(a) * 0.18, -0.18, Math.sin(a) * 0.18);
    leg.rotation.set(0.55, a, 0);
    parent.add(leg);
  }
}

/** DIW central pivot bracket — fixed on swing, parallelogram rear pivots. */
function buildCentralHub(parent: THREE.Group) {
  const h = PARALLELOGRAM_SPACING_M;

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.055, 0.06, 16),
    mat(COL.printDark, 0.2, 0.65)
  );
  collar.position.y = -0.03;
  parent.add(collar);

  const spine = box(0.1, h + 0.14, 0.08, COL.printDark);
  spine.position.y = -h / 2 - 0.02;
  parent.add(spine);

  for (const sx of [-1, 1] as const) {
    const wing = box(0.04, h + 0.08, 0.06, COL.printMid);
    wing.position.set(sx * 0.07, -h / 2, 0);
    wing.rotation.z = sx * 0.2;
    parent.add(wing);
  }

  const upperKnuckle = box(0.13, 0.06, 0.11, COL.print);
  upperKnuckle.position.set(0.02, 0.02, 0);
  parent.add(upperKnuckle);

  const lowerKnuckle = box(0.12, 0.055, 0.1, COL.print);
  lowerKnuckle.position.set(0.01, -h, 0);
  parent.add(lowerKnuckle);

  const diwPlate = box(0.055, 0.04, 0.008, COL.printMid);
  diwPlate.position.set(-0.07, -h * 0.35, 0.045);
  parent.add(diwPlate);

  const pivotDot = (y: number) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mat(0xe85d5d, 0.3, 0.5));
    d.position.set(0.06, y, 0.055);
    parent.add(d);
  };
  pivotDot(0);
  pivotDot(-h);
}

/** Rear counterweight / electronics enclosure. */
function buildRearHousing(parent: THREE.Group) {
  const g = new THREE.Group();
  g.position.set(-REACH_REAR_M - 0.11, -PARALLELOGRAM_SPACING_M / 2 - 0.04, 0);
  parent.add(g);

  const main = box(0.26, 0.2, 0.18, COL.printDark);
  g.add(main);

  const topStep = box(0.22, 0.06, 0.16, COL.printMid);
  topStep.position.set(-0.02, 0.1, 0);
  g.add(topStep);

  const bottomStep = box(0.24, 0.05, 0.17, COL.print);
  bottomStep.position.set(0.01, -0.1, 0);
  g.add(bottomStep);

  for (let i = 0; i < 5; i++) {
    const slot = box(0.18, 0.008, 0.012, 0x4a5058);
    slot.position.set(0.02, -0.04 + i * 0.035, 0.092);
    g.add(slot);
  }

  const rearCap = box(0.2, 0.16, 0.025, COL.print);
  rearCap.position.set(-0.01, 0, -0.1);
  g.add(rearCap);
}

function buildTubeClamp(parent: THREE.Object3D, x: number) {
  const clamp = box(0.055, 0.045, 0.055, COL.print);
  clamp.position.set(x, 0.008, 0);
  parent.add(clamp);
  const screw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8),
    mat(COL.printDark, 0.5, 0.4)
  );
  screw.position.set(x, 0.032, 0.028);
  parent.add(screw);
}

/** Front parallelogram bracket — triangular truss aft of yaw axis toward boom tubes. */
function buildFrontBracket(parent: THREE.Group) {
  const h = PARALLELOGRAM_END_SPACING_M;
  const d = FRONT_BRACKET_DEPTH_M;
  const tubeD = TUBE_UPPER_RADIUS_M * 2;

  const rearPlate = box(0.018, h + 0.05, 0.11, COL.printDark);
  rearPlate.position.set(-d + 0.01, -h / 2, 0);
  parent.add(rearPlate);

  const lattice = box(d * 0.82, h + 0.03, 0.01, COL.printMid);
  lattice.position.set(-d * 0.52, -h / 2, 0);
  parent.add(lattice);

  for (const side of [-1, 1] as const) {
    const strut = box(0.022, d * 0.62, 0.008, COL.print);
    strut.position.set(-d * 0.42, -h * 0.28, side * 0.042);
    strut.rotation.z = -side * 0.72;
    parent.add(strut);

    const outer = box(0.016, h + 0.04, 0.008, COL.printDark);
    outer.position.set(-d * 0.55, -h / 2, side * 0.05);
    parent.add(outer);
  }

  for (const y of [0.01, -h + 0.01] as const) {
    const clamp = box(0.075, 0.05, tubeD + 0.01, COL.print);
    clamp.position.set(-d + 0.045, y, 0);
    parent.add(clamp);

    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.018, 10),
      mat(COL.printDark, 0.35, 0.5)
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(-d + 0.02, y, tubeD / 2 + 0.012);
    parent.add(knob);
  }

  for (const y of [0, -h] as const) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), mat(COL.boom, 0.3, 0.5));
    dot.position.set(-d + 0.055, y, 0.058);
    parent.add(dot);
  }

  const yawCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.072, 0.012, 20),
    mat(COL.printMid, 0.15, 0.65)
  );
  yawCollar.rotation.x = Math.PI / 2;
  yawCollar.position.set(0, -h * 0.18, 0);
  parent.add(yawCollar);
}

function buildYawMotorStack(parent: THREE.Group, yFrameTop: number) {
  const motorH = Math.abs(yFrameTop) * 0.38;
  const lowerMotor = box(0.11, motorH, 0.1, COL.pole);
  lowerMotor.position.y = yFrameTop + motorH / 2 + 0.01;
  parent.add(lowerMotor);

  const gearDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.008, 24),
    mat(COL.pole, 0.4, 0.5)
  );
  gearDisc.rotation.x = Math.PI / 2;
  gearDisc.position.y = yFrameTop + motorH + 0.018;
  parent.add(gearDisc);

  const upperMotor = box(0.1, motorH * 0.85, 0.095, COL.pole);
  upperMotor.position.y = yFrameTop + motorH + 0.04 + (motorH * 0.85) / 2;
  parent.add(upperMotor);

  for (const y of [lowerMotor.position.y, upperMotor.position.y] as const) {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.028, 10),
      mat(COL.printDark, 0.35, 0.5)
    );
    knob.rotation.z = Math.PI / 2;
    knob.position.set(-0.055, y, 0);
    parent.add(knob);
  }

  const diwPlate = box(0.14, 0.008, 0.12, COL.printMid);
  diwPlate.position.set(0, yFrameTop, 0);
  parent.add(diwPlate);

  const diwTag = box(0.04, 0.02, 0.004, COL.printDark);
  diwTag.position.set(0, yFrameTop + 0.002, 0.055);
  parent.add(diwTag);
}

function buildOuterFrame(parent: THREE.Group, yTop: number, yBottom: number, halfW: number) {
  const rail = HEAD_RAIL_M;
  const drop = yTop - yBottom;

  const topBar = tubeZ(rail * 0.45, HEAD_OUTER_WIDTH_M);
  topBar.position.y = yTop;
  parent.add(topBar);

  for (const z of [-halfW, halfW] as const) {
    const knuckle = box(rail * 2.2, rail * 2.2, rail * 2.2, COL.print);
    knuckle.position.set(0, yTop, z);
    parent.add(knuckle);

    const post = box(rail, drop, rail, COL.tubeDark);
    post.position.set(0, yTop - drop / 2, z);
    parent.add(post);

    const foot = box(rail * 2, rail * 2, rail * 2, COL.printMid);
    foot.position.set(0, yBottom, z);
    parent.add(foot);
  }

  const bottomBar = tubeZ(rail * 0.45, HEAD_OUTER_WIDTH_M);
  bottomBar.position.y = yBottom;
  parent.add(bottomBar);
}

function buildInnerUFrame(
  parent: THREE.Group,
  yTop: number,
  yBottom: number,
  spanZ: number,
  pivotAtPositiveZ: boolean
) {
  const rail = HEAD_RAIL_M;
  const drop = yTop - yBottom;
  const zPivot = pivotAtPositiveZ ? 0 : spanZ;
  const zFar = pivotAtPositiveZ ? -spanZ : 0;
  const zMid = (zPivot + zFar) / 2;

  const topBar = tubeZ(rail * 0.45, spanZ);
  topBar.position.set(0, yTop, zMid);
  parent.add(topBar);

  for (const z of [zPivot, zFar] as const) {
    const knuckle = box(rail * 2, rail * 2, rail * 2, COL.print);
    knuckle.position.set(0, yTop, z);
    parent.add(knuckle);

    const post = box(rail, drop, rail, COL.tube);
    post.position.set(0, yTop - drop / 2, z);
    parent.add(post);

    const foot = box(rail * 1.8, rail * 1.8, rail * 1.8, COL.print);
    foot.position.set(0, yBottom, z);
    parent.add(foot);
  }

  const bottomBar = tubeZ(rail * 0.45, spanZ);
  bottomBar.position.set(0, yBottom, zMid);
  parent.add(bottomBar);
}

function buildPitchGears(parent: THREE.Group) {
  const bigR = 0.088;
  const redR = 0.036;
  const purpleR = 0.019;

  const bigGear = new THREE.Mesh(
    new THREE.CylinderGeometry(bigR, bigR, 0.016, 32),
    mat(COL.gear, 0.25, 0.55)
  );
  bigGear.rotation.x = Math.PI / 2;
  bigGear.position.set(0, 0, 0.02);
  parent.add(bigGear);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.02, 10),
      mat(COL.printDark, 0.2, 0.7)
    );
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(a) * bigR * 0.55, 0, 0.02 + Math.sin(a) * bigR * 0.55);
    parent.add(hole);
  }

  const redGear = new THREE.Mesh(
    new THREE.CylinderGeometry(redR, redR, 0.014, 22),
    mat(COL.gearRed, 0.3, 0.5)
  );
  redGear.rotation.x = Math.PI / 2;
  redGear.position.set(0, redR + 0.006, 0.048);
  parent.add(redGear);

  const purpleGear = new THREE.Mesh(
    new THREE.CylinderGeometry(purpleR, purpleR, 0.012, 16),
    mat(COL.gearPurple, 0.35, 0.48)
  );
  purpleGear.rotation.x = Math.PI / 2;
  purpleGear.position.set(0, redR + purpleR + 0.02, 0.042);
  parent.add(purpleGear);

  const pitchMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, 0.075, 16),
    mat(COL.gearRed, 0.35, 0.48)
  );
  pitchMotor.rotation.z = Math.PI / 2;
  pitchMotor.position.set(0.055, 0, 0.02);
  parent.add(pitchMotor);

  const adjKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.02, 14),
    mat(COL.printDark, 0.3, 0.55)
  );
  adjKnob.rotation.x = Math.PI / 2;
  adjKnob.position.set(0, 0, 0.11);
  parent.add(adjKnob);
}

function buildCameraProxy(parent: THREE.Group, lensYLocal: number) {
  const camera = new THREE.Group();
  const lensLocalX = CAMERA_BODY_X_M / 2 + CAMERA_LENS_LENGTH_M;
  camera.position.set(0, lensYLocal, -HEAD_INNER_HALF_M);
  parent.add(camera);

  const mount = box(CAMERA_BODY_Z_M + 0.012, CAMERA_MOUNT_RISE_M, CAMERA_BODY_Z_M + 0.012, COL.print);
  mount.position.y = -CAMERA_BODY_Y_M / 2 - CAMERA_MOUNT_RISE_M / 2;
  camera.add(mount);

  camera.add(box(CAMERA_BODY_X_M, CAMERA_BODY_Y_M, CAMERA_BODY_Z_M, COL.cam));

  const lensBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(CAMERA_LENS_RADIUS_M * 0.92, CAMERA_LENS_RADIUS_M, CAMERA_LENS_LENGTH_M, 20),
    mat(0x2a3038, 0.5, 0.45)
  );
  lensBarrel.rotation.z = Math.PI / 2;
  lensBarrel.position.x = CAMERA_BODY_X_M / 2 + CAMERA_LENS_LENGTH_M / 2;
  camera.add(lensBarrel);

  const lensMark = new THREE.Mesh(
    new THREE.CylinderGeometry(CAMERA_LENS_RADIUS_M, CAMERA_LENS_RADIUS_M, 0.014, 20),
    mat(COL.lensMark, 0.2, 0.4)
  );
  lensMark.rotation.z = Math.PI / 2;
  lensMark.position.x = lensLocalX;
  camera.add(lensMark);

  return { camera, lensMark };
}

/** Camera head — front-elevation CAD: outer frame, inner U-cradle, pitch drive, camera. */
function buildCameraHead(yawHead: THREE.Group): {
  pitchHead: THREE.Group;
  camera: THREE.Group;
  lensMark: THREE.Mesh;
} {
  const head = new THREE.Group();
  head.position.x = YAW_TO_CRADLE_FORWARD_M;
  yawHead.add(head);

  const yTop = HEAD_Y_FRAME_TOP_M;
  const yBottom = HEAD_Y_BOTTOM_M;

  buildYawMotorStack(head, yTop);
  buildOuterFrame(head, yTop, yBottom, HEAD_OUTER_HALF_M);

  const pitchHead = new THREE.Group();
  pitchHead.position.set(0, HEAD_PITCH_Y_M, HEAD_INNER_HALF_M);
  head.add(pitchHead);

  const yTopLocal = HEAD_Y_FRAME_TOP_M - HEAD_PITCH_Y_M;
  const yBottomLocal = HEAD_Y_BOTTOM_M - HEAD_PITCH_Y_M;
  const lensYLocal = HEAD_Y_LENS_M - HEAD_PITCH_Y_M;

  buildInnerUFrame(pitchHead, yTopLocal, yBottomLocal, HEAD_INNER_WIDTH_M, true);
  buildPitchGears(pitchHead);
  const { camera, lensMark } = buildCameraProxy(pitchHead, lensYLocal);

  return { pitchHead, camera, lensMark };
}

export function buildRig(scene: THREE.Scene): RigNodes {
  const root = new THREE.Group();
  scene.add(root);

  buildTripod(root);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.028, POLE_HEIGHT_M, 16),
    aluminium(COL.pole)
  );
  pole.position.y = POLE_HEIGHT_M / 2;
  root.add(pole);

  const swing = new THREE.Group();
  swing.position.y = POLE_HEIGHT_M;
  root.add(swing);

  axisLine(swing, new THREE.Vector3(0, -0.1, 0), new THREE.Vector3(0, 0.18, 0));

  buildCentralHub(swing);

  const boomPivot = new THREE.Group();
  swing.add(boomPivot);

  const boomCenterX = (REACH_YAW_M - REACH_REAR_M) / 2;

  const upperTube = tubeAlongX(TUBE_UPPER_RADIUS_M, BOOM_SPAN_M);
  upperTube.position.x = boomCenterX;
  boomPivot.add(upperTube);

  buildTubeClamp(boomPivot, BOOM_LINK_LENGTH_M - REACH_REAR_M);
  buildRearHousing(boomPivot);

  // Lower tube: same parent & heading as upper — parallelogram keeps them parallel.
  const lowerLink = tubeAlongX(TUBE_LOWER_RADIUS_M, BOOM_SPAN_M, COL.tubeDark);
  lowerLink.position.set(boomCenterX, -PARALLELOGRAM_SPACING_M, 0);
  boomPivot.add(lowerLink);

  const headCarriage = new THREE.Group();
  headCarriage.position.set(REACH_YAW_M, 0, 0);
  boomPivot.add(headCarriage);

  buildFrontBracket(headCarriage);

  const yawHead = new THREE.Group();
  headCarriage.add(yawHead);

  const { pitchHead, camera, lensMark } = buildCameraHead(yawHead);

  return { root, swing, boomPivot, headCarriage, yawHead, pitchHead, camera, lensMark, lowerLink };
}

export function applyRigPose(nodes: RigNodes, pose: RigPose) {
  nodes.swing.rotation.y = pose.swing;
  nodes.boomPivot.rotation.z = pose.boom;
  nodes.headCarriage.rotation.z = -pose.boom;
  nodes.yawHead.rotation.y = pose.yaw;
  nodes.pitchHead.rotation.z = pose.pitch;
  const z = THREE.MathUtils.clamp(pose.zoom, 0.8, 2.5);
  nodes.lensMark.scale.setScalar(0.85 + (z - 1) * 0.4);
  nodes.camera.scale.setScalar(0.95 + (z - 1) * 0.06);
}
