import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { BOOM_REST_ANGLE, poseFromLive, poseFromTimeline, type RigPose } from "../lib/rigKinematics";
import { applyRigPose, buildRig } from "../lib/rigGeometry";
import {
  buildCameraViewEnvironment,
  CAMERA_VIEW_ASPECT,
  fovForZoom,
  rigCameraToViewQuaternion,
  SCENE_VIEW_BG,
} from "../lib/rigCameraScene";
import { cameraPitchRadians, cameraRollRadians } from "../lib/cameraAttitude";
import { VirtualHorizon, type VirtualHorizonHandle } from "./VirtualHorizon";
import { FocusDistanceBadge } from "./FocusDistanceBadge";
import { createTargetDragControls } from "../lib/targetDragControls";
import { applySubjectAimToMesh, type SubjectAimPoint } from "../lib/subjectTarget";
import type { FocusCalibration } from "../lib/focusCalibration";
import type { TimelineProject } from "../types";
import { onionGhostPoses } from "../lib/onionSkin";

type Props = {
  project: TimelineProject;
  playhead: number;
  speedPercent?: number;
  liveVelocities?: number[];
  livePose?: RigPose;
  calibration?: FocusCalibration;
  focusFollow?: boolean;
  subjectAimPoint?: SubjectAimPoint;
  moveTargetEnabled?: boolean;
  onSubjectAimChange?: (aim: SubjectAimPoint) => void;
  docked?: boolean;
  showHorizon?: boolean;
  onionSkinEnabled?: boolean;
  onionSkinOffset?: number;
};
export function CameraViewPreview({
  project,
  playhead,
  speedPercent = 100,
  liveVelocities,
  livePose,
  calibration,
  focusFollow,
  subjectAimPoint,
  moveTargetEnabled = false,
  onSubjectAimChange,
  docked,
  showHorizon = true,
  onionSkinEnabled = false,
  onionSkinOffset = 0.5,
}: Props) {
  const displayPose =
    livePose ??
    (liveVelocities
      ? poseFromLive(liveVelocities, { boom: BOOM_REST_ANGLE, swing: 0, yaw: 0, pitch: 0, zoom: 1 }, speedPercent)
      : poseFromTimeline(project, playhead, speedPercent));
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<ReturnType<typeof buildRig> | null>(null);
  const viewCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const horizonRef = useRef<VirtualHorizonHandle>(null);
  const showHorizonRef = useRef(showHorizon);
  const subjectRef = useRef<THREE.Object3D | null>(null);
  const onAimChangeRef = useRef(onSubjectAimChange);
  const moveTargetRef = useRef(moveTargetEnabled);
  const subjectAimRef = useRef(subjectAimPoint);
  const onionRef = useRef({ enabled: onionSkinEnabled, offset: onionSkinOffset });
  const projectRef = useRef(project);
  const playheadRef = useRef(playhead);
  const speedRef = useRef(speedPercent);

  showHorizonRef.current = showHorizon;
  onAimChangeRef.current = onSubjectAimChange;
  moveTargetRef.current = moveTargetEnabled;
  subjectAimRef.current = subjectAimPoint;
  onionRef.current = { enabled: onionSkinEnabled, offset: onionSkinOffset };
  projectRef.current = project;
  playheadRef.current = playhead;
  speedRef.current = speedPercent;
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
    scene.background = new THREE.Color(SCENE_VIEW_BG);
    buildCameraViewEnvironment(scene);
    subjectRef.current = scene.getObjectByName("reference-subject") ?? null;
    if (subjectRef.current && subjectAimRef.current) {
      applySubjectAimToMesh(subjectRef.current, subjectAimRef.current);
    }

    const rigScene = new THREE.Scene();
    const rigNodes = buildRig(rigScene);
    rigNodes.root.visible = false;
    rigRef.current = rigNodes;

    const onionScene = new THREE.Scene();
    const beforeRig = buildRig(onionScene);
    const afterRig = buildRig(onionScene);
    beforeRig.root.visible = false;
    afterRig.root.visible = false;
    const ghostMatBefore = new THREE.MeshBasicMaterial({
      color: 0x4af626,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      wireframe: true,
    });
    const ghostMatAfter = new THREE.MeshBasicMaterial({
      color: 0xe8c85d,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      wireframe: true,
    });
    const tintGhost = (root: THREE.Object3D, mat: THREE.Material) => {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) o.material = mat;
      });
    };
    tintGhost(beforeRig.root, ghostMatBefore);
    tintGhost(afterRig.root, ghostMatAfter);
    scene.add(beforeRig.root);
    scene.add(afterRig.root);

    const viewCamera = new THREE.PerspectiveCamera(fovForZoom(1), CAMERA_VIEW_ASPECT, 0.02, 40);
    viewCameraRef.current = viewCamera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const targetDrag = createTargetDragControls(
      renderer.domElement,
      () => viewCameraRef.current,
      () => moveTargetRef.current,
      (aim) => onAimChangeRef.current?.(aim)
    );

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

        const onion = onionRef.current;
        if (onion.enabled) {
          const ghosts = onionGhostPoses(projectRef.current, playheadRef.current, speedRef.current, {
            enabled: true,
            mode: "both",
            offsetSec: onion.offset,
            opacity: 0.35,
          });
          beforeRig.root.visible = !!ghosts.before;
          afterRig.root.visible = !!ghosts.after;
          if (ghosts.before) applyRigPose(beforeRig, ghosts.before);
          if (ghosts.after) applyRigPose(afterRig, ghosts.after);
        } else {
          beforeRig.root.visible = false;
          afterRig.root.visible = false;
        }
      }      renderer.render(scene, viewCamera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      targetDrag.dispose();
      ro.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      rigRef.current = null;
      viewCameraRef.current = null;
      subjectRef.current = null;
    };
  }, [docked]);

  useEffect(() => {
    const subject = subjectRef.current;
    if (!subject || !subjectAimPoint) return;
    applySubjectAimToMesh(subject, subjectAimPoint);
  }, [subjectAimPoint]);

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
        {calibration && (
          <FocusDistanceBadge
            pose={displayPose}
            calibration={calibration}
            focusFollow={focusFollow}
            subjectAimPoint={subjectAimPoint}
            compact
          />
        )}
        <span className="rig-preview-hint">
          {moveTargetEnabled
            ? "LMB drag target on ground"
            : onionSkinEnabled
              ? `Onion ±${onionSkinOffset}s`
              : "Lens preview · home aim reference"}
        </span>
      </div>
      <div
        ref={containerRef}
        className={["rig-preview-canvas", moveTargetEnabled ? "move-target-mode" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        <VirtualHorizon ref={horizonRef} visible={showHorizon} />
      </div>    </div>
  );
}
