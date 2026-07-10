/**
 * Verifies upper and lower boom tubes stay parallel at multiple boom/swing poses.
 * Run: npx tsx scripts/verify-parallelogram.ts
 */
import * as THREE from "three";
import { buildRig, applyRigPose } from "../src/lib/rigGeometry";

const scene = new THREE.Scene();
const nodes = buildRig(scene);
const upperTube = nodes.boomPivot.children.find(
  (c): c is THREE.Mesh =>
    c instanceof THREE.Mesh &&
    c.geometry instanceof THREE.CylinderGeometry &&
    c !== nodes.lowerLink
);

if (!upperTube) {
  console.error("FAIL: upper tube not found");
  process.exit(1);
}

function tubeWorldDir(mesh: THREE.Object3D) {
  const orig = new THREE.Vector3();
  const tip = new THREE.Vector3(0, 1, 0);
  mesh.getWorldPosition(orig);
  mesh.localToWorld(tip);
  return tip.sub(orig).normalize();
}

const poses = [
  { boom: 0, swing: 0, yaw: 0, pitch: 0, zoom: 1, label: "home" },
  { boom: (40 * Math.PI) / 180, swing: 0, yaw: 0, pitch: 0, zoom: 1, label: "boom +40°" },
  { boom: (-27 * Math.PI) / 180, swing: 0, yaw: 0, pitch: 0, zoom: 1, label: "boom -27°" },
  {
    boom: (15 * Math.PI) / 180,
    swing: 0.8,
    yaw: 0.5,
    pitch: -0.3,
    zoom: 1.2,
    label: "combined",
  },
];

let failed = false;
for (const pose of poses) {
  applyRigPose(nodes, pose);
  nodes.root.updateMatrixWorld(true);

  const u = tubeWorldDir(upperTube);
  const l = tubeWorldDir(nodes.lowerLink);
  const dot = Math.abs(u.dot(l));
  const pass = dot > 0.99999;
  console.log(`${pose.label}: parallel dot=${dot.toFixed(8)} ${pass ? "PASS" : "FAIL"}`);
  if (!pass) failed = true;

  const sep = Math.abs(nodes.lowerLink.position.y - upperTube.position.y);
  console.log(`  local Y separation: ${sep.toFixed(6)} m (expect 0.139567)`);
}

process.exit(failed ? 1 : 0);
