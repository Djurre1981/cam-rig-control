import { clampDuration, snapTime } from "./timelineUtils";
import { MIN_CLIP_DURATION } from "../types";

export type TimedClip = {
  id: string;
  start: number;
  duration: number;
};

function clipEnd(clip: TimedClip): number {
  return clip.start + clip.duration;
}

function sortedClips(clips: TimedClip[]): TimedClip[] {
  return [...clips].sort((a, b) => a.start - b.start);
}

export type Gap = {
  start: number;
  end: number;
  size: number;
};

/** Empty regions on a track (no overlap allowed). */
export function listGaps(clips: TimedClip[], projectDuration: number): Gap[] {
  const sorted = sortedClips(clips);
  const gaps: Gap[] = [];
  let cursor = 0;

  for (const clip of sorted) {
    if (clip.start > cursor) {
      gaps.push({ start: cursor, end: clip.start, size: clip.start - cursor });
    }
    cursor = Math.max(cursor, clipEnd(clip));
  }
  if (projectDuration > cursor) {
    gaps.push({ start: cursor, end: projectDuration, size: projectDuration - cursor });
  }
  return gaps;
}

function fitInGap(
  gap: Gap,
  desiredStart: number,
  defaultDuration: number,
  snapEnabled: boolean
): { start: number; duration: number } | null {
  if (gap.size < MIN_CLIP_DURATION) return null;

  let duration = Math.min(defaultDuration, gap.size);
  duration = clampDuration(duration);
  if (duration > gap.size) duration = gap.size;
  if (duration < MIN_CLIP_DURATION) return null;

  let start = Math.max(gap.start, Math.min(gap.end - duration, desiredStart));
  start = snapTime(start, snapEnabled);
  start = Math.max(gap.start, Math.min(gap.end - duration, start));

  if (start + duration > gap.end + 1e-6) {
    start = gap.end - duration;
  }
  if (start < gap.start - 1e-6) return null;

  return { start, duration };
}

function placementBesideClip(
  clips: TimedClip[],
  hit: TimedClip,
  desiredStart: number,
  defaultDuration: number,
  projectDuration: number,
  snapEnabled: boolean,
  preferAfter: boolean
): { start: number; duration: number } | null {
  const sorted = sortedClips(clips);
  const idx = sorted.findIndex((c) => c.id === hit.id);

  const tryAfter = (): { start: number; duration: number } | null => {
    const gapStart = clipEnd(hit);
    const next = sorted[idx + 1];
    const gapEnd = next ? next.start : projectDuration;
    return fitInGap(
      { start: gapStart, end: gapEnd, size: gapEnd - gapStart },
      gapStart,
      defaultDuration,
      snapEnabled
    );
  };

  const tryBefore = (): { start: number; duration: number } | null => {
    const gapEnd = hit.start;
    const prev = sorted[idx - 1];
    const gapStart = prev ? clipEnd(prev) : 0;
    return fitInGap(
      { start: gapStart, end: gapEnd, size: gapEnd - gapStart },
      gapEnd - defaultDuration,
      defaultDuration,
      snapEnabled
    );
  };

  if (preferAfter) return tryAfter() ?? tryBefore();
  return tryBefore() ?? tryAfter();
}

/**
 * Place a new clip on a track: no overlap, snap beside existing clips when needed,
 * shrink duration to fit tight gaps.
 */
export function computeClipPlacement(
  clips: TimedClip[],
  desiredStart: number,
  defaultDuration: number,
  projectDuration: number,
  snapEnabled: boolean
): { start: number; duration: number } | null {
  const startSnapped = snapTime(Math.max(0, desiredStart), snapEnabled);
  const durationDefault = clampDuration(defaultDuration);

  const hit = clips.find(
    (c) => startSnapped >= c.start && startSnapped < clipEnd(c)
  );

  if (hit) {
    const mid = hit.start + hit.duration / 2;
    const preferAfter = startSnapped >= mid;
    return placementBesideClip(
      clips,
      hit,
      startSnapped,
      durationDefault,
      projectDuration,
      snapEnabled,
      preferAfter
    );
  }

  const gaps = listGaps(clips, projectDuration);
  if (gaps.length === 0) return null;

  const containing = gaps.find((g) => startSnapped >= g.start && startSnapped < g.end);
  if (containing) {
    const placed = fitInGap(containing, startSnapped, durationDefault, snapEnabled);
    if (placed) return placed;
  }

  const nearest = gaps
    .map((g) => {
      const placed = fitInGap(g, startSnapped, durationDefault, snapEnabled);
      if (!placed) return null;
      return { ...placed, dist: Math.abs(placed.start - startSnapped) };
    })
    .filter((x): x is { start: number; duration: number; dist: number } => x != null)
    .sort((a, b) => a.dist - b.dist)[0];

  return nearest ? { start: nearest.start, duration: nearest.duration } : null;
}
