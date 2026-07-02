import { defaultSpeedCurve } from "./speedCurve";
import { packClipStarts } from "./timelineTrackChain";
import { MOTOR_TRACK_COLORS, type TimelineProject } from "../types";

export function normalizeProject(raw: TimelineProject): TimelineProject {
  const p = structuredClone(raw) as TimelineProject;
  p.tracks = p.tracks.map((t, i) => ({
    ...t,
    color: t.color ?? MOTOR_TRACK_COLORS[i],
    clips: packClipStarts(
      t.clips.map((c) => ({
        ...c,
        id: c.id ?? `legacy_${Math.random()}`,
        speed_curve: c.speed_curve ?? defaultSpeedCurve(c.type),
      }))
    ),
  }));
  p.camera_tracks = (p.camera_tracks ?? []).map((t) => ({
    ...t,
    clips: packClipStarts(
      t.clips.map((c) => ({ ...c, id: c.id ?? `legacy_${Math.random()}` }))
    ),
  }));
  return p;
}

export function projectSnapshot(project: TimelineProject): string {
  return JSON.stringify(project);
}

export function projectsEqual(a: TimelineProject, b: TimelineProject): boolean {
  return projectSnapshot(a) === projectSnapshot(b);
}
