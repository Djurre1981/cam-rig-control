import type { TimelineProject } from "../types";
import { chainEnd } from "./timelineTrackChain";

/** Minimum workspace when the timeline is empty (seconds). */
export const MIN_TIMELINE_DURATION_SEC = 30;

/** Extra empty time kept beyond the last clip end. */
export const CONTENT_DURATION_PADDING_SEC = 5;

/** Extra seconds added when the user scrolls or zooms near the right edge. */
export const SCROLL_EXTEND_CHUNK_SEC = 60;

/** Extend when the viewport end is within this many seconds of timeline duration. */
export const SCROLL_EXTEND_THRESHOLD_SEC = 8;

export function contentDuration(project: TimelineProject): number {
  let max = 0;
  for (const track of project.tracks) {
    max = Math.max(max, chainEnd(track.clips));
  }
  for (const track of project.camera_tracks) {
    max = Math.max(max, chainEnd(track.clips));
  }
  return max;
}

/** Rightmost visible time (seconds) for the current scroll position and zoom. */
export function viewportEndTime(
  scrollLeft: number,
  viewportWidth: number,
  pixelsPerSecond: number,
  labelWidth: number
): number {
  const timelinePx = Math.max(0, scrollLeft + viewportWidth - labelWidth);
  return timelinePx / Math.max(pixelsPerSecond, 1e-6);
}

/**
 * Timeline length required for clip content and/or the visible viewport.
 * Never shrinks below the stored project duration.
 */
export function requiredTimelineDuration(
  project: TimelineProject,
  viewportEndSec?: number
): number {
  const content = contentDuration(project);
  let needed = Math.max(
    MIN_TIMELINE_DURATION_SEC,
    content + CONTENT_DURATION_PADDING_SEC,
    project.duration
  );

  if (viewportEndSec != null) {
    if (viewportEndSec + SCROLL_EXTEND_THRESHOLD_SEC > needed) {
      needed = Math.max(needed, viewportEndSec + SCROLL_EXTEND_CHUNK_SEC);
    }
  }

  return needed;
}

export function ensureTimelineDuration(project: TimelineProject): TimelineProject {
  const duration = requiredTimelineDuration(project);
  if (duration <= project.duration) return project;
  return { ...project, duration };
}

export function extendTimelineDuration(
  project: TimelineProject,
  minDuration: number
): TimelineProject {
  if (minDuration <= project.duration) return project;
  return { ...project, duration: minDuration };
}
