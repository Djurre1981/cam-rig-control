import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { BOOM_REST_ANGLE, poseFromLive, poseFromTimeline, type RigPose } from "../lib/rigKinematics";
import { applyRigPose, buildRig } from "../lib/rigGeometry";
import {
  buildCameraViewEnvironment,
  CAMERA_VIEW_ASPECT,
  fovForZoom,
  rigCameraToViewQuaternion,
} from "../lib/rigCameraScene";
import { cameraPitchRadians, cameraRollRadians } from "../lib/cameraAttitude";
import { VirtualHorizon, type VirtualHorizonHandle } from "./VirtualHorizon";
import type { TimelineProject } from "../types";

type Props = {
  project: TimelineProject;
  playhead: number;
  speedPercent?: number;
  liveVelocities?: number[];
  livePose?: RigPose;
  docked?: boolean;
  showHorizon?: boolean;
};
const VIEW_BG = 0x1a1c22;

export function CameraViewPreview({
  project,
  playhead,
  speedPercent = 100,
  liveVelocities,
  livePose,
  docked,
  showHorizon = true,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<ReturnType<typeof buildRig> | null>(null);
  const viewCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const horizonRef = useRef<VirtualHorizonHandle>(null);
  const showHorizonRef = useRef(showHorizon);

  showHorizonRef.current = showHorizon;
  useLayoutEffect(() => {
    if (!docked) return;
    const shell = shellRef.current;
    const pane = shell?.parentElement;
    if (!shell || !pane) return;

    const fit = () => {
      const paneW = pane.clientWidth;
      const paneH = pane.clientHeight;
      if (paneW <= 0 || paneH <= 0) return;

      const header = shell.querySelector<HTMLElement>(".rig-preview-header");
      const headerH = header?.offsetHeight ?? 0;
      const availH = Math.max(0, paneH - headerH);
      const availW = paneW;

      let canvasH = availH;
      let canvasW = canvasH * CAMERA_VIEW_ASPECT;
      if (canvasW > availW) {
        canvasW = availW;
        canvasH = canvasW / CAMERA_VIEW_ASPECT;
      }

      shell.style.width = `${Math.round(canvasW)}px`;
      shell.style.height = `${paneH}px`;

      const canvas = containerRef.current;
      if (canvas) {
        canvas.style.width = `${Math.round(canvasW)}px`;
        canvas.style.height = `${Math.round(canvasH)}px`;
      }
    };

    const ro = new ResizeObserver(fit);
    ro.observe(pane);
    fit();
    return () => ro.disconnect();
  }, [docked]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(VIEW_BG);
    buildCameraViewEnvironment(scene);

    const rigScene = new THREE.Scene();
    const rigNodes = buildRig(rigScene);
    rigNodes.root.visible = false;
    rigRef.current = rigNodes;

    const viewCamera = new THREE.PerspectiveCamera(fovForZoom(1), CAMERA_VIEW_ASPECT, 0.02, 40);
    viewCameraRef.current = viewCamera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xfff4e8, 1.05);
    key.position.set(2, 4, 1);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x88a8d8, 0.35);
    fill.position.set(-2, 2, -3);
    scene.add(fill);

    applyRigPose(rigNodes, {
      boom: BOOM_REST_ANGLE,
      swing: 0,
      yaw: 0,
      pitch: 0,
      zoom: 1,
    });

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, true);
      viewCamera.aspect = w / h;
      viewCamera.updateProjectionMatrix();
      renderer.render(scene, viewCamera);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    requestAnimationFrame(() => requestAnimationFrame(resize));

    const _worldPos = new THREE.Vector3();
    const _worldQuat = new THREE.Quaternion();

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const nodes = rigRef.current;
      const cam = viewCameraRef.current;
      if (nodes && cam) {
        nodes.root.updateMatrixWorld(true);
        nodes.camera.getWorldPosition(_worldPos);
        nodes.camera.getWorldQuaternion(_worldQuat);
        cam.position.copy(_worldPos);
        rigCameraToViewQuaternion(_worldQuat, cam.quaternion);
        cam.updateMatrixWorld();

        if (showHorizonRef.current) {
          const rollDeg = (cameraRollRadians(_worldQuat) * 180) / Math.PI;
          const pitchDeg = (cameraPitchRadians(_worldQuat) * 180) / Math.PI;
          horizonRef.current?.setAttitude(rollDeg, pitchDeg);
        }
      }      renderer.render(scene, viewCamera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      rigRef.current = null;
      viewCameraRef.current = null;
    };
  }, [docked]);

  useEffect(() => {
    const nodes = rigRef.current;
    const cam = viewCameraRef.current;
    if (!nodes || !cam) return;
    const base = poseFromTimeline(project, playhead, speedPercent);
    const pose = livePose
      ? livePose
      : liveVelocities
        ? poseFromLive(liveVelocities, base, speedPercent)
        : base;
    applyRigPose(nodes, pose);
    cam.fov = fovForZoom(pose.zoom);
    cam.updateProjectionMatrix();
  }, [project, playhead, liveVelocities, livePose, speedPercent]);

  return (
    <div
      ref={shellRef}
      className={["rig-preview", "camera-view-preview", docked ? "docked" : ""].filter(Boolean).join(" ")}
    >
      <div className="rig-preview-header">
        <span>Camera view</span>
        <span className="rig-preview-hint">Lens preview · home aim reference</span>
      </div>
      <div ref={containerRef} className="rig-preview-canvas">
        <VirtualHorizon ref={horizonRef} visible={showHorizon} />
      </div>    </div>
  );
}
