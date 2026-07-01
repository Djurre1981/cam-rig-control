/** Pixel inset from track-lane edge to clip block (top + bottom must fit in row). */
export const CLIP_TRACK_INSET = 4;

export type ClipRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function clipRectInLane(
  start: number,
  duration: number,
  rowHeight: number,
  pixelsPerSecond: number,
  projectDuration: number,
  minWidth = 24
): ClipRect {
  const top = CLIP_TRACK_INSET;
  const height = Math.max(12, rowHeight - CLIP_TRACK_INSET * 2);
  const left = Math.max(0, start * pixelsPerSecond);
  const maxWidth = Math.max(0, (projectDuration - start) * pixelsPerSecond);
  const width = Math.max(minWidth, Math.min(duration * pixelsPerSecond, maxWidth));

  return { left, top, width, height };
}

/** True when clip is entirely outside the project timeline. */
export function clipIsOffTimeline(
  start: number,
  duration: number,
  projectDuration: number
): boolean {
  return start >= projectDuration || duration <= 0;
}
