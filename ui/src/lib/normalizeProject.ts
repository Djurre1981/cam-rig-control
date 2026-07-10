import { defaultSpeedCurve } from "./speedCurve";
import { ensureTimelineDuration } from "./timelineDuration";
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
  return ensureTimelineDuration(p);
}

export function projectSnapshot(project: TimelineProject): string {
  return JSON.stringify(project);
}

/**
 * Snapshot of user-editable animation content. Excludes `duration` because the
 * timeline viewport auto-extends duration while scrolling/zooming without a user edit.
 */
export function projectEditSnapshot(project: TimelineProject): string {
  return JSON.stringify({
    version: project.version,
    name: project.name,
    tracks: project.tracks,
    camera_tracks: project.camera_tracks,
    subjectAim: project.subjectAim,
  });
}

export function projectsEqual(a: TimelineProject, b: TimelineProject): boolean {
  return projectEditSnapshot(a) === projectEditSnapshot(b);
}
