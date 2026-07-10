import type { RecordedFrame } from "../types";
import { BOOM_REST_ANGLE } from "./rigConstants";
import type { RigPose } from "./rigKinematics";

/** Axis record value stored in frames (radians; boom is offset from rest). */
export function poseAxisToRecordValue(axis: number, pose: RigPose): number {
  if (axis === 0) return pose.boom - BOOM_REST_ANGLE;
  if (axis === 1) return pose.swing;
  if (axis === 2) return pose.yaw;
  return pose.pitch;
}

export function recordValueToRadians(axis: number, value: number): number {
  if (axis === 0) return BOOM_REST_ANGLE + value;
  return value;
}

export function interpolateRecordedFrames(frames: RecordedFrame[], localT: number): number {
  if (frames.length === 0) return 0;
  if (localT <= frames[0].t) return frames[0].pos;
  const last = frames[frames.length - 1];
  if (localT >= last.t) return last.pos;

  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i];
    const b = frames[i + 1];
    if (localT >= a.t && localT <= b.t) {
      const u = b.t === a.t ? 0 : (localT - a.t) / (b.t - a.t);
      return a.pos + (b.pos - a.pos) * u;
    }
  }
  return last.pos;
}
