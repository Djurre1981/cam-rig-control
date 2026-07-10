import * as THREE from "three";
import type { TimelineProject } from "../types";
import { poseFromTimeline, type RigPose } from "./rigKinematics";

export type OnionSkinMode = "off" | "before" | "after" | "both";

export type OnionSkinConfig = {
  enabled: boolean;
  mode: OnionSkinMode;
  offsetSec: number;
  opacity: number;
};

export const DEFAULT_ONION_SKIN: OnionSkinConfig = {
  enabled: false,
  mode: "both",
  offsetSec: 0.5,
  opacity: 0.35,
};

export function onionGhostPoses(
  project: TimelineProject,
  playhead: number,
  speedPercent: number,
  config: OnionSkinConfig
): { before?: RigPose; after?: RigPose } {
  if (!config.enabled || config.mode === "off") return {};
  const out: { before?: RigPose; after?: RigPose } = {};
  const o = config.offsetSec;
  if (config.mode === "before" || config.mode === "both") {
    const t = Math.max(0, playhead - o);
    out.before = poseFromTimeline(project, t, speedPercent);
  }
  if (config.mode === "after" || config.mode === "both") {
    const t = Math.min(project.duration, playhead + o);
    out.after = poseFromTimeline(project, t, speedPercent);
  }
  return out;
}

export function makeGhostMaterial(color: number, opacity: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    metalness: 0.1,
    roughness: 0.8,
  });
}
