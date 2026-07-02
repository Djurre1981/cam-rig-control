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

/** After clip at `afterIndex` changes, keep timeline starts contiguous. */
export function relinkFollowingClipStarts<T extends TimedClip>(clips: T[], afterIndex: number): void {
  for (let i = afterIndex + 1; i < clips.length; i++) {
    clips[i].start = clipEnd(clips[i - 1]);
  }
}

function sortedByStart<T extends TimedClip>(clips: T[]): T[] {
  return [...clips].sort((a, b) => a.start - b.start);
}

/** Assign contiguous starts from 0: clip[i].end === clip[i+1].start */
export function packClipStarts<T extends TimedClip>(clips: T[]): T[] {
  const sorted = sortedByStart(clips);
  let cursor = 0;
  for (const clip of sorted) {
    clip.start = cursor;
    cursor = clip.start + clip.duration;
  }
  return sorted;
}

export function chainEnd(clips: TimedClip[]): number {
  const sorted = sortedByStart(clips);
  if (sorted.length === 0) return 0;
  return clipEnd(sorted[sorted.length - 1]);
}

function insertIndexForTime(clips: TimedClip[], time: number): number {
  const packed = packClipStarts([...clips]);
  for (let i = 0; i < packed.length; i++) {
    const end = clipEnd(packed[i]);
    if (time < end) {
      // Dropping on the last clip always appends after it (sequential add).
      if (i === packed.length - 1) return packed.length;
      const mid = packed[i].start + packed[i].duration / 2;
      return time < mid ? i : i + 1;
    }
  }
  return packed.length;
}

function clampDurationToFitChain(
  clips: TimedClip[],
  requestedDuration: number
): number | null {
  if (requestedDuration < MIN_CLIP_DURATION) return null;
  return clampDuration(requestedDuration);
}

/** Insert a new clip into the chain at drop time; returns packed clips or null. */
export function insertClipInChain(
  clips: TimedClip[],
  newClip: TimedClip,
  dropTime: number,
  snapEnabled: boolean
): TimedClip[] | null {
  const packed = packClipStarts(clips.map((c) => ({ ...c })));
  const t = snapTime(Math.max(0, dropTime), snapEnabled);
  const idx = insertIndexForTime(packed, t);

  const duration = clampDurationToFitChain(packed, newClip.duration);
  if (duration == null) return null;

  const inserted = { ...newClip, duration, start: 0 };
  packed.splice(idx, 0, inserted);
  return packClipStarts(packed);
}

/** Reorder a clip to a new position in the chain based on drop time. */
export function moveClipInChain<T extends TimedClip>(
  clips: T[],
  clipId: string,
  dropTime: number,
  snapEnabled: boolean
): T[] {
  const sorted = sortedByStart(clips);
  const fromIdx = sorted.findIndex((c) => c.id === clipId);
  if (fromIdx < 0) return clips;

  const [moving] = sorted.splice(fromIdx, 1);
  const packed = packClipStarts(sorted);
  const t = snapTime(Math.max(0, dropTime), snapEnabled);
  let insertAt = insertIndexForTime(packed, t);
  packed.splice(insertAt, 0, moving);
  return packClipStarts(packed);
}

/** Resize clip duration and ripple following clips. */
export function resizeClipInChain<T extends TimedClip>(
  clips: T[],
  clipId: string,
  desiredDuration: number
): T[] {
  const sorted = sortedByStart(clips);
  const clip = sorted.find((c) => c.id === clipId);
  if (!clip) return clips;

  clip.duration = clampDuration(desiredDuration);
  return packClipStarts(sorted);
}

/**
 * Remove a clip without moving earlier clips on the track.
 * Clips before the removed one keep their start times.
 * Clips after it ripple left so clip[i].start === clip[i-1].end (contiguous from the gap).
 */
export function removeClipFromChain<T extends TimedClip>(clips: T[], clipId: string): T[] {
  const sorted = sortedByStart(clips);
  const idx = sorted.findIndex((c) => c.id === clipId);
  if (idx < 0) return clips;

  const removed = sorted[idx];
  const result = sorted.filter((c) => c.id !== clipId);

  if (idx === 0 || idx >= result.length) {
    return result;
  }

  let cursor = removed.start;
  for (let i = idx; i < result.length; i++) {
    result[i].start = cursor;
    cursor = result[i].start + result[i].duration;
  }
  return result;
}
