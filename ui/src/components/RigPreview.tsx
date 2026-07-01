import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { BOOM_REST_ANGLE, poseFromLive, poseFromTimeline } from "../lib/rigKinematics";
import { applyRigPose, buildRig } from "../lib/rigGeometry";
import { PREVIEW_VIEW_ASPECT, PREVIEW_BACKGROUND } from "../lib/rigFraming";
import { createRigAxisCompass } from "../lib/rigAxisCompass";
import { createViewportControls } from "../lib/rigViewportControls";
import type { TimelineProject } from "../types";
type Props = {
  project: TimelineProject;
  playhead: number;
  speedPercent?: number;
  liveVelocities?: number[];
  compact?: boolean;
  docked?: boolean;
};

export function RigPreview({ project, playhead, speedPercent = 100, liveVelocities, compact, docked }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<ReturnType<typeof buildRig> | null>(null);
  const controlsRef = useRef<ReturnType<typeof createViewportControls> | null>(null);

  /** Fill workspace-resizer-top height; keep viewport at PREVIEW_VIEW_ASPECT (2∶1). */
  useLayoutEffect(() => {
    if (!docked) return;
    const shell = shellRef.current;
    const row = shell?.parentElement;
    if (!shell || !row) return;

    const fit = () => {
      const rowW = row.clientWidth;
      const rowH = row.clientHeight;
      if (rowW <= 0 || rowH <= 0) return;

      const header = shell.querySelector<HTMLElement>(".rig-preview-header");
      const headerH = header?.offsetHeight ?? 0;
      const availH = Math.max(0, rowH - headerH);
      const availW = rowW;

      let canvasH = availH;
      let canvasW = canvasH * PREVIEW_VIEW_ASPECT;
      if (canvasW > availW) {
        canvasW = availW;
        canvasH = canvasW / PREVIEW_VIEW_ASPECT;
      }

      shell.style.width = `${Math.round(canvasW)}px`;
      shell.style.height = `${rowH}px`;

      const canvas = containerRef.current;
      if (canvas) {
        canvas.style.width = `${Math.round(canvasW)}px`;
        canvas.style.height = `${Math.round(canvasH)}px`;
      }
    };

    const ro = new ResizeObserver(fit);
    ro.observe(row);
    fit();
    return () => ro.disconnect();
  }, [docked]);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PREVIEW_BACKGROUND);

    const useOrtho = !!docked;
    const camera: THREE.Camera = useOrtho
      ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 40)
      : new THREE.PerspectiveCamera(34, 1, 0.05, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x6880b0, 0.55));
    const key = new THREE.DirectionalLight(0xfff2e0, 1.1);
    key.position.set(-1, 3, -2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x6090d0, 0.4);
    fill.position.set(2, 1, 3);
    scene.add(fill);

    const nodes = buildRig(scene);
    nodesRef.current = nodes;
    applyRigPose(nodes, {
      boom: BOOM_REST_ANGLE,
      swing: 0,
      yaw: 0,
      pitch: 0,
      zoom: 1,
    });

    const getAspect = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      return h > 0 ? w / h : 1;
    };

    if (!useOrtho) {
      (camera as THREE.PerspectiveCamera).aspect = getAspect();
    }

    const controls = createViewportControls(
      renderer.domElement,
      () => camera,
      getAspect,
      useOrtho,
      () => renderer.render(scene, camera)
    );
    controlsRef.current = controls;

    const compass = createRigAxisCompass(renderer);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, true);
      if (!useOrtho) {
        (camera as THREE.PerspectiveCamera).aspect = w / h;
      }
      controls.apply();
      renderer.render(scene, camera);
      compass.render(camera);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    requestAnimationFrame(() => requestAnimationFrame(resize));

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      compass.render(camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      compass.dispose();
      controls.dispose();
      controlsRef.current = null;
      ro.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      nodesRef.current = null;
    };
  }, [docked]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    const base = poseFromTimeline(project, playhead, speedPercent);
    const pose = liveVelocities
      ? poseFromLive(liveVelocities, base, speedPercent)
      : base;
    applyRigPose(nodes, pose);
  }, [project, playhead, liveVelocities, speedPercent]);

  return (
    <div
      ref={shellRef}
      className={["rig-preview", compact ? "compact" : "", docked ? "docked" : ""].filter(Boolean).join(" ")}
    >      <div className="rig-preview-header">
        <span>3D preview</span>
        <span className="rig-preview-hint">
          MMB orbit · RMB pan · wheel zoom
          <button
            type="button"
            className="rig-preview-reset"
            title="Reset view"
            onClick={() => controlsRef.current?.reset()}
          >
            Reset view
          </button>
        </span>
      </div>
      <div ref={containerRef} className="rig-preview-canvas" />
    </div>
  );
}
