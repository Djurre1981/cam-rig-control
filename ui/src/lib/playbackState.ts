/**
 * Playback state at a timeline instant — mirrors Bottango's per-effector readout
 * (GET /PlaybackState/ effectors[] with movement 0–1).
 */

import { BOOM_REST_ANGLE, poseFromTimeline } from "./rigKinematics";
import { BOOM_MAX_DEG, BOOM_MIN_DEG, BOOM_RANGE_DEG } from "./rigConstants";
import type { TimelineProject } from "../types";

export type EffectorState = {
  id: string;
  name: string;
  color: string;
  /** Normalized position 0–1 (Bottango `movement`). */
  movement: number;
  /** Human-readable value at playhead. */
  display: string;
  /** Clip active on this track at playhead. */
  live: boolean;
};

const RAD = 180 / Math.PI;

function degSigned(rad: number): number {
  return (rad - BOOM_REST_ANGLE) * RAD;
}

function boomMovement(rad: number): number {
  const deg = (rad - BOOM_REST_ANGLE) * RAD;
  return Math.max(0, Math.min(1, (deg - BOOM_MIN_DEG) / BOOM_RANGE_DEG));
}

function cyclicMovement(rad: number): number {
  const deg = ((rad * RAD) % 360 + 360) % 360;
  return deg / 360;
}

function motorLive(track: TimelineProject["tracks"][0], t: number): boolean {
  return track.clips.some((c) => t >= c.start && t < c.start + c.duration);
}

function cameraLive(track: TimelineProject["camera_tracks"][0], t: number): boolean {
  return track.clips.some((c) => t >= c.start && t < c.start + c.duration);
}

export function effectorsAtTime(
  project: TimelineProject,
  t: number,
  speedPercent = 100
): EffectorState[] {
  const pose = poseFromTimeline(project, t, speedPercent);
  const motors: EffectorState[] = project.tracks.map((track, i) => {
    const rad = [pose.boom, pose.swing, pose.yaw, pose.pitch][i];
    const movement =
      i === 0 ? boomMovement(rad) : cyclicMovement(rad);
    const deg = ((rad * RAD) % 360 + 360) % 360;
    return {
      id: track.id,
      name: track.label,
      color: track.color,
      movement,
      display: i === 0 ? `${degSigned(rad).toFixed(1)}°` : `${deg.toFixed(0)}°`,
      live: motorLive(track, t),
    };
  });

  const recordTrack = project.camera_tracks.find((ct) => ct.id === "record");
  const zoomTrack = project.camera_tracks.find((ct) => ct.id === "zoom");
  const focusTrack = project.camera_tracks.find((ct) => ct.id === "focus");

  const recording =
    recordTrack?.clips.some(
      (c) => c.type === "RecordClip" && t >= c.start && t < c.start + c.duration
    ) ?? false;

  const cameras: EffectorState[] = [
    {
      id: "record",
      name: "Record",
      color: recordTrack?.color ?? "#c44d6d",
      movement: recording ? 1 : 0,
      display: recording ? "REC" : "—",
      live: recordTrack ? cameraLive(recordTrack, t) : false,
    },
    {
      id: "zoom",
      name: "Zoom",
      color: zoomTrack?.color ?? "#2d9d8a",
      movement: Math.max(0, Math.min(1, (pose.zoom - 1) / 9)),
      display: `${pose.zoom.toFixed(1)}×`,
      live: zoomTrack ? cameraLive(zoomTrack, t) : false,
    },
    {
      id: "focus",
      name: "Focus",
      color: focusTrack?.color ?? "#d4844a",
      movement: 0.5,
      display: "—",
      live: focusTrack ? cameraLive(focusTrack, t) : false,
    },
  ];

  return [...motors, ...cameras];
}
