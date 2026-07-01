import * as THREE from "three";
import { BOOM_REST_ANGLE } from "./lib/rigKinematics";
import { applyRigPose, buildRig } from "./lib/rigGeometry";
import { frameRigOrtho, PREVIEW_BACKGROUND } from "./lib/rigFraming";

const W = 1120;
const H = 560;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const scene = new THREE.Scene();
scene.background = new THREE.Color(PREVIEW_BACKGROUND);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 40);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(2);
renderer.setSize(W, H, false);

scene.add(new THREE.AmbientLight(0x6880b0, 0.55));
const key = new THREE.DirectionalLight(0xfff2e0, 1.1);
key.position.set(-1, 3, 2);
scene.add(key);
const fill = new THREE.DirectionalLight(0x6090d0, 0.4);
fill.position.set(2, 1, -3);
scene.add(fill);

const nodes = buildRig(scene);
applyRigPose(nodes, {
  boom: BOOM_REST_ANGLE,
  swing: 0,
  yaw: 0,
  pitch: 0,
  zoom: 1,
});

frameRigOrtho(camera, nodes.root, W / H);
renderer.render(scene, camera);
