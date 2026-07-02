import { useCallback, useEffect, useRef, useState } from "react";
import { clampAxisVelocity } from "../lib/motionLimits";
import { integrateLiveMotion } from "../lib/liveMotion";
import { poseFromTimeline, type RigPose } from "../lib/rigKinematics";
import type { TimelineProject } from "../types";

const NO_HOMING = [false, false, false, false] as const;

export function useLivePose(
  enabled: boolean,
  project: TimelineProject,
  playhead: number,
  speedPercent: number,
  velocities: number[],
  onHomingComplete?: (axis: number) => void
): {
  pose: RigPose;
  startHoming: (axis: number) => void;
  cancelHoming: (axis: number) => void;
  cancelAllHoming: () => void;
} {
  const [pose, setPose] = useState<RigPose>(() =>
    poseFromTimeline(project, playhead, speedPercent)
  );
  const poseRef = useRef(pose);
  const lastTick = useRef(performance.now());
  const homingRef = useRef<boolean[]>([...NO_HOMING]);
  const onHomingCompleteRef = useRef(onHomingComplete);

  poseRef.current = pose;
  onHomingCompleteRef.current = onHomingComplete;

  const startHoming = useCallback((axis: number) => {
    homingRef.current[axis] = true;
  }, []);

  const cancelHoming = useCallback((axis: number) => {
    homingRef.current[axis] = false;
  }, []);

  const cancelAllHoming = useCallback(() => {
    homingRef.current = [...NO_HOMING];
  }, []);

  useEffect(() => {
    velocities.forEach((v, i) => {
      if (Math.abs(v) > 1e-6) homingRef.current[i] = false;
    });
  }, [velocities]);

  useEffect(() => {
    if (!enabled) return;
    homingRef.current = [...NO_HOMING];
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
      const { moved, homingCompleted } = integrateLiveMotion(
        p,
        velocities,
        homingRef.current,
        dt,
        speedPercent,
        clampAxisVelocity
      );

      for (const axis of homingCompleted) {
        homingRef.current[axis] = false;
        onHomingCompleteRef.current?.(axis);
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
    cancelHoming,
    cancelAllHoming,
  };
}
