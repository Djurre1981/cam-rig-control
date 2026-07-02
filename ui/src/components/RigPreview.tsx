import { useEffect, useLayoutEffect, useRef } from "react";

import * as THREE from "three";

import { BOOM_REST_ANGLE, poseFromLive, poseFromTimeline, type RigPose } from "../lib/rigKinematics";

import { applyRigPose, buildRig } from "../lib/rigGeometry";

import { buildPreviewEnvironment, CAMERA_VIEW_ASPECT } from "../lib/rigCameraScene";

import { PREVIEW_BACKGROUND } from "../lib/rigFraming";

import { createRigAxisCompass } from "../lib/rigAxisCompass";

import { createViewportControls } from "../lib/rigViewportControls";

import type { TimelineProject } from "../types";

type Props = {

  project: TimelineProject;

  playhead: number;

  speedPercent?: number;

  liveVelocities?: number[];

  livePose?: RigPose;

  compact?: boolean;

  docked?: boolean;

};



export function RigPreview({ project, playhead, speedPercent = 100, liveVelocities, livePose, compact, docked }: Props) {

  const shellRef = useRef<HTMLDivElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const nodesRef = useRef<ReturnType<typeof buildRig> | null>(null);

  const controlsRef = useRef<ReturnType<typeof createViewportControls> | null>(null);



  const fitSizeRef = useRef({ w: 0, h: 0 });

  const resizeSceneRef = useRef<(() => boolean) | null>(null);



  /** Fill preview pane height; keep viewport at 16∶9 (same as camera view). */

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

      let canvasW = canvasH * CAMERA_VIEW_ASPECT;

      if (canvasW > availW) {

        canvasW = availW;

        canvasH = canvasW / CAMERA_VIEW_ASPECT;

      }



      canvasW = Math.round(canvasW);

      canvasH = Math.round(canvasH);



      shell.style.width = `${canvasW}px`;

      shell.style.height = `${rowH}px`;



      const canvas = containerRef.current;

      if (canvas) {

        canvas.style.width = `${canvasW}px`;

        canvas.style.height = `${canvasH}px`;

      }



      fitSizeRef.current = { w: canvasW, h: canvasH };

      resizeSceneRef.current?.();

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

    scene.add(buildPreviewEnvironment());



    const useOrtho = false;

    const camera = new THREE.PerspectiveCamera(34, CAMERA_VIEW_ASPECT, 0.05, 60);



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



    const getAspect = () => {

      if (docked) return CAMERA_VIEW_ASPECT;

      const w = container.clientWidth;

      const h = container.clientHeight;

      return h > 0 ? w / h : CAMERA_VIEW_ASPECT;

    };



    const readSize = () => {

      if (docked) {

        const { w, h } = fitSizeRef.current;

        if (w > 0 && h > 0) return { w, h };

      }

      return { w: container.clientWidth, h: container.clientHeight };

    };



    const controls = createViewportControls(

      renderer.domElement,

      () => camera,

      getAspect,

      useOrtho,

      () => renderer.render(scene, camera)

    );

    controlsRef.current = controls;



    const compass = createRigAxisCompass(renderer);

    let framingApplied = false;



    const resize = (): boolean => {

      const { w, h } = readSize();

      if (w < 8 || h < 8) return false;



      if (docked && Math.abs(w / h - CAMERA_VIEW_ASPECT) > 0.08) return false;



      renderer.setSize(w, h, false);



      if (!framingApplied) {

        controls.apply();

        framingApplied = true;

      } else {

        camera.aspect = getAspect();

        camera.updateProjectionMatrix();

      }



      renderer.render(scene, camera);

      compass.render(camera);

      return true;

    };



    resizeSceneRef.current = resize;



    const ro = new ResizeObserver(resize);

    ro.observe(container);



    const applyPose = (pose: RigPose) => applyRigPose(nodes, pose);

    applyPose(poseFromTimeline(project, playhead, speedPercent));



    let frameId = 0;

    const animate = () => {

      frameId = requestAnimationFrame(animate);

      if (!framingApplied) {

        resize();

        return;

      }

      renderer.render(scene, camera);

      compass.render(camera);

    };

    animate();



    return () => {

      cancelAnimationFrame(frameId);

      resizeSceneRef.current = null;

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

    const pose = livePose

      ? livePose

      : liveVelocities

        ? poseFromLive(liveVelocities, base, speedPercent)

        : base;

    applyRigPose(nodes, pose);

  }, [project, playhead, liveVelocities, livePose, speedPercent]);



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


