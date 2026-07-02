/**
 * DIW 4-axis camera rig kinematics (matches physical axis behavior).
 *
 * Ref: https://www.youtube.com/watch?v=kPe2O8CkQAY (~11:26), construction docs
 *
 * Axis order in firmware / timeline:
 *   0 boom  — A-axis: arm tilts on horizontal axle between risers (parallelogram keeps head level)
 *   1 swing — turret slew bearing: whole upper rig rotates about vertical axis
 *   2 yaw   — Y head: pan at end of boom
 *   3 pitch — Z head: tilt in U-cradle
 */

import type { MotorClip, TimelineProject } from "../types";
import { FRONT_REACH } from "./rigGeometry";
import {
  cappedMoveDelta,
  clampAxisVelocity,
  movePositionToRad,
  stepMotionToRad,
} from "./motionLimits";
import { clampPoseBoom } from "./boomGroundLimits";
import { BOOM_REST_ANGLE } from "./rigConstants";
import { ensureSpeedCurve, motionProgressAtTime, speedAtTime } from "./speedCurve";

export type RigPose = {
  /** Radians — arm tilt about horizontal axle (positive = arm rises). */
  boom: number;
  /** Radians — turret rotation about vertical axis. */
  swing: number;
  yaw: number;
  pitch: number;
  zoom: number;
};

export { BOOM_REST_ANGLE } from "./rigConstants";

/** Pivot to camera-head distance (metres, approximate from 1" arm tubes). */
export const BOOM_REACH = FRONT_REACH;

function axisPositionAtTime(
  clips: MotorClip[],
  t: number,
  axis: number,
  speedPercent: number
): number {
  const sorted = [...clips].sort((a, b) => a.start - b.start);
  let pos = 0;

  for (const clip of sorted) {
    if (clip.start > t) break;
    const end = clip.start + clip.duration;

    if (clip.type === "JogClip") {
      const curve = ensureSpeedCurve(clip);
      const localEnd = Math.min(t, end);
      const dt = localEnd - clip.start;
      if (dt > 0) {
        const baseV = clampAxisVelocity(axis, clip.velocity ?? 0, speedPercent);
        const samples = 24;
        let dist = 0;
        for (let i = 0; i < samples; i++) {
          const u0 = (i / samples) * (dt / clip.duration);
          const u1 = ((i + 1) / samples) * (dt / clip.duration);
          const s0 = speedAtTime(curve, u0);
          const s1 = speedAtTime(curve, u1);
          dist += ((s0 + s1) / 2) * (dt / samples);
        }
        pos += stepMotionToRad(axis, baseV * dist);
      }
    } else if (clip.type === "MoveClip") {
      const from = clip.from_pos ?? 0;
      const to = clip.to_pos ?? 0;
      const cappedTo = cappedMoveDelta(axis, from, to, clip.duration, speedPercent);
      const curve = ensureSpeedCurve(clip);
      if (t >= end) {
        pos = movePositionToRad(axis, cappedTo);
      } else if (t >= clip.start) {
        const u = (t - clip.start) / clip.duration;
        const progress = motionProgressAtTime(curve, u);
        const smooth = progress * progress * (3 - 2 * progress);
        const position = from + (cappedTo - from) * smooth;
        pos = movePositionToRad(axis, position);
      }
    } else if (clip.type === "RecordedClip") {
      const dt = Math.min(t, end) - clip.start;
      pos += Math.sin(dt * 0.7) * 0.12;
    }
  }

  return pos;
}

function zoomAtTime(project: TimelineProject, t: number): number {
  const track = project.camera_tracks.find((ct) => ct.id === "zoom");
  if (!track) return 1;
  for (const clip of track.clips) {
    if (t >= clip.start && t < clip.start + clip.duration && clip.type === "ZoomClip") {
      const u = (t - clip.start) / clip.duration;
      const smooth = u * u * (3 - 2 * u);
      const from = clip.from_zoom ?? 1;
      const to = clip.to_zoom ?? 1;
      return from + (to - from) * smooth;
    }
  }
  return 1;
}

export function poseFromTimeline(
  project: TimelineProject,
  t: number,
  speedPercent = 100
): RigPose {
  const pose: RigPose = {
    boom: BOOM_REST_ANGLE + axisPositionAtTime(project.tracks[0]?.clips ?? [], t, 0, speedPercent),
    swing: axisPositionAtTime(project.tracks[1]?.clips ?? [], t, 1, speedPercent),
    yaw: axisPositionAtTime(project.tracks[2]?.clips ?? [], t, 2, speedPercent),
    pitch: axisPositionAtTime(project.tracks[3]?.clips ?? [], t, 3, speedPercent),
    zoom: zoomAtTime(project, t),
  };
  clampPoseBoom(pose);
  return pose;
}

export function poseFromLive(velocities: number[], base: RigPose, speedPercent = 100): RigPose {
  const v = velocities.map((vel, i) => clampAxisVelocity(i, vel, speedPercent));
  const liveTick = 1 / 60;
  const pose: RigPose = {
    boom: base.boom + stepMotionToRad(0, v[0] * liveTick),
    swing: base.swing + stepMotionToRad(1, v[1] * liveTick),
    yaw: base.yaw + stepMotionToRad(2, v[2] * liveTick),
    pitch: base.pitch + stepMotionToRad(3, v[3] * liveTick),
    zoom: base.zoom,
  };
  clampPoseBoom(pose);
  return pose;
}
