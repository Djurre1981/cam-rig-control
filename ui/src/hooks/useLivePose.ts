import { useCallback, useEffect, useRef, useState } from "react";
import { clampAxisVelocity } from "../lib/motionLimits";
import { integrateLiveMotion, type TargetLockMode } from "../lib/liveMotion";
import { poseFromTimeline, type RigPose } from "../lib/rigKinematics";
import type { TimelineProject } from "../types";

const NO_HOMING = [false, false, false, false] as const;

export function useLivePose(
  enabled: boolean,
  project: TimelineProject,
  playhead: number,
  speedPercent: number,
  velocities: number[],
  targetLock: TargetLockMode = "off",
  zoomVelocity = 0,
  onHomingComplete?: (axis: number) => void,
  onZoomHomingComplete?: () => void
): {
  pose: RigPose;
  startHoming: (axis: number) => void;
  startZoomHoming: () => void;
  homeAll: () => void;
  cancelHoming: (axis: number) => void;
  cancelZoomHoming: () => void;
} {
  const [pose, setPose] = useState<RigPose>(() =>
    poseFromTimeline(project, playhead, speedPercent)
  );
  const poseRef = useRef(pose);
  const lastTick = useRef(performance.now());
  const homingRef = useRef<boolean[]>([...NO_HOMING]);
  const zoomHomingRef = useRef(false);
  const onHomingCompleteRef = useRef(onHomingComplete);
  const onZoomHomingCompleteRef = useRef(onZoomHomingComplete);
  const targetLockRef = useRef(targetLock);
  const zoomVelocityRef = useRef(zoomVelocity);

  poseRef.current = pose;
  onHomingCompleteRef.current = onHomingComplete;
  onZoomHomingCompleteRef.current = onZoomHomingComplete;
  targetLockRef.current = targetLock;
  zoomVelocityRef.current = zoomVelocity;

  const startHoming = useCallback((axis: number) => {
    homingRef.current[axis] = true;
  }, []);

  const startZoomHoming = useCallback(() => {
    zoomHomingRef.current = true;
  }, []);

  const homeAll = useCallback(() => {
    homingRef.current = [true, true, true, true];
    zoomHomingRef.current = true;
  }, []);

  const cancelHoming = useCallback((axis: number) => {
    homingRef.current[axis] = false;
  }, []);

  const cancelZoomHoming = useCallback(() => {
    zoomHomingRef.current = false;
  }, []);

  useEffect(() => {
    velocities.forEach((v, i) => {
      if (Math.abs(v) > 1e-6) homingRef.current[i] = false;
    });
  }, [velocities]);

  useEffect(() => {
    if (Math.abs(zoomVelocity) > 1e-6) zoomHomingRef.current = false;
  }, [zoomVelocity]);

  useEffect(() => {
    if (!enabled) return;
    homingRef.current = [...NO_HOMING];
    zoomHomingRef.current = false;
    const base = poseFromTimeline(project, playhead, speedPercent);
    poseRef.current = { ...base };
    setPose({ ...base });
    lastTick.current = performance.now();
  }, [enabled, project, playhead, speedPercent]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - lastTick.current) / 1000, 0.05);
      lastTick.current = now;
      const p = { ...poseRef.current };
      const { moved, homingCompleted, zoomHomingCompleted } = integrateLiveMotion(
        p,
        velocities,
        homingRef.current,
        dt,
        speedPercent,
        clampAxisVelocity,
        targetLockRef.current,
        zoomVelocityRef.current,
        zoomHomingRef.current
      );

      for (const axis of homingCompleted) {
        homingRef.current[axis] = false;
        onHomingCompleteRef.current?.(axis);
      }

      if (zoomHomingCompleted) {
        zoomHomingRef.current = false;
        onZoomHomingCompleteRef.current?.();
      }

      if (moved) {
        poseRef.current = p;
        setPose(p);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, velocities, speedPercent]);

  return {
    pose: enabled ? pose : poseFromTimeline(project, playhead, speedPercent),
    startHoming,
    startZoomHoming,
    homeAll,
    cancelHoming,
    cancelZoomHoming,
  };
}
