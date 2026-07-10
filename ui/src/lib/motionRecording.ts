import type { MotorClip, TimelineProject } from "../types";
import { packClipStarts } from "./timelineTrackChain";
import { uid } from "./timelineUtils";
import type { RigPose } from "./rigKinematics";
import { poseAxisToRecordValue } from "./recordedClipPlayback";

export const RECORD_SAMPLE_HZ = 24;

export type RecordSample = {
  t: number;
  pose: RigPose;
};

export type MotionRecorder = {
  startTime: number;
  samples: RecordSample[];
};

export function createMotionRecorder(startTime: number): MotionRecorder {
  return { startTime, samples: [] };
}

export function addMotionSample(recorder: MotionRecorder, t: number, pose: RigPose): void {
  const last = recorder.samples[recorder.samples.length - 1];
  const minDt = 1 / RECORD_SAMPLE_HZ;
  if (last && t - last.t < minDt * 0.5) return;
  recorder.samples.push({ t, pose: { ...pose } });
}

export function recorderDuration(recorder: MotionRecorder): number {
  if (recorder.samples.length < 2) return 0.5;
  return Math.max(0.5, recorder.samples[recorder.samples.length - 1].t - recorder.startTime);
}

export function buildRecordedClips(
  recorder: MotionRecorder,
  clipStart: number
): { trackIndex: number; clip: MotorClip }[] {
  const duration = recorderDuration(recorder);
  if (recorder.samples.length < 2) return [];

  const out: { trackIndex: number; clip: MotorClip }[] = [];
  for (let axis = 0; axis < 4; axis++) {
    const frames = recorder.samples.map((s) => ({
      t: s.t - recorder.startTime,
      pos: poseAxisToRecordValue(axis, s.pose),
    }));
    const moved = frames.some((f, i) => i > 0 && Math.abs(f.pos - frames[0].pos) > 1e-5);
    if (!moved) continue;

    out.push({
      trackIndex: axis,
      clip: {
        id: `rec_${uid()}`,
        type: "RecordedClip",
        start: clipStart,
        duration,
        label: "Teach",
        frames,
      },
    });
  }
  return out;
}

export function applyRecordedClipsToProject(
  project: TimelineProject,
  _clipStart: number,
  recorded: { trackIndex: number; clip: MotorClip }[]
): TimelineProject {
  const next = structuredClone(project);
  for (const { trackIndex, clip } of recorded) {
    const track = next.tracks[trackIndex];
    if (!track) continue;
    track.clips = packClipStarts([...track.clips, { ...clip, start: 0 }]);
  }
  const maxEnd = Math.max(
    next.duration,
    ...next.tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration))
  );
  next.duration = Math.ceil(maxEnd * 4) / 4;
  return next;
}
