/**
 * Small world-space XYZ compass rendered in the preview corner.
 * Axes match rigGeometry: +X camera, +Y up, +Z toward viewer.
 */

import * as THREE from "three";

const AXIS_LEN = 0.38;
const TIP_LEN = 0.1;

const AXIS_COLORS = {
  x: 0xd93030,
  y: 0x1e8e3e,
  z: 0x1a73e8,
} as const;

function makeLabel(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = color;
  ctx.font = "bold 38px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 32, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.2, 0.2, 1);
  sprite.renderOrder = 2;
  return sprite;
}

function makeAxis(dir: THREE.Vector3, color: number, label: string): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color });

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, AXIS_LEN, 8), mat);
  shaft.position.copy(dir).multiplyScalar(AXIS_LEN / 2);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  shaft.renderOrder = 1;
  group.add(shaft);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.04, TIP_LEN, 10), mat);
  tip.position.copy(dir).multiplyScalar(AXIS_LEN + TIP_LEN / 2);
  tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  tip.renderOrder = 1;
  group.add(tip);

  const hex = `#${color.toString(16).padStart(6, "0")}`;
  const lbl = makeLabel(label, hex);
  lbl.position.copy(dir).multiplyScalar(AXIS_LEN + TIP_LEN + 0.08);
  group.add(lbl);

  return group;
}

export type RigAxisCompass = {
  render: (mainCamera: THREE.Camera) => void;
  dispose: () => void;
};

export function createRigAxisCompass(renderer: THREE.WebGLRenderer): RigAxisCompass {
  const scene = new THREE.Scene();

  const bg = new THREE.Mesh(
    new THREE.CircleGeometry(0.52, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthWrite: false,
    })
  );
  bg.renderOrder = 0;
  scene.add(bg);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.52, 32),
    new THREE.MeshBasicMaterial({ color: 0x8a919c, depthWrite: false })
  );
  ring.renderOrder = 0;
  scene.add(ring);

  const axes = new THREE.Group();
  axes.add(makeAxis(new THREE.Vector3(1, 0, 0), AXIS_COLORS.x, "X"));
  axes.add(makeAxis(new THREE.Vector3(0, 1, 0), AXIS_COLORS.y, "Y"));
  axes.add(makeAxis(new THREE.Vector3(0, 0, 1), AXIS_COLORS.z, "Z"));
  scene.add(axes);

  const camera = new THREE.OrthographicCamera(-0.55, 0.55, 0.55, -0.55, 0.1, 10);
  camera.position.set(0, 0, 2);
  camera.lookAt(0, 0, 0);

  const dispose = () => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) m.dispose();
      }
      if (obj instanceof THREE.Sprite) {
        obj.material.map?.dispose();
        obj.material.dispose();
      }
    });
  };

  const render = (mainCamera: THREE.Camera) => {
    const size = new THREE.Vector2();
    renderer.getDrawingBufferSize(size);
    if (size.x < 1 || size.y < 1) return;

    const dpr = renderer.getPixelRatio();
    const dim = Math.round(76 * dpr);
    const margin = Math.round(10 * dpr);
    const x = size.x - dim - margin;
    const y = size.y - dim - margin;

    camera.quaternion.copy(mainCamera.quaternion);

    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    renderer.setScissor(x, y, dim, dim);
    renderer.setViewport(x, y, dim, dim);
    renderer.setClearColor(0xffffff, 1);
    renderer.clear(true, true, true);
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, size.x, size.y);
    renderer.autoClear = autoClear;
  };

  return { render, dispose };
}
