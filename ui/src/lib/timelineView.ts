export const MIN_PIXELS_PER_SECOND = 18;
export const MAX_PIXELS_PER_SECOND = 360;
export const DEFAULT_PIXELS_PER_SECOND = 72;
export const ZOOM_WHEEL_FACTOR = 1.12;

export const DEFAULT_MOTOR_ROW_HEIGHT = 56;
export const DEFAULT_CAMERA_ROW_HEIGHT = 44;
export const MIN_TRACK_ROW_HEIGHT = 32;
export const MAX_TRACK_ROW_HEIGHT = 160;

export function clampPixelsPerSecond(pps: number): number {
  return Math.max(MIN_PIXELS_PER_SECOND, Math.min(MAX_PIXELS_PER_SECOND, pps));
}

export function zoomFromWheel(current: number, deltaY: number): number {
  if (deltaY > 0) return clampPixelsPerSecond(current / ZOOM_WHEEL_FACTOR);
  if (deltaY < 0) return clampPixelsPerSecond(current * ZOOM_WHEEL_FACTOR);
  return current;
}

/** Ruler major tick interval (seconds) for current zoom. */
export function rulerTickInterval(pps: number): { major: number; minor: number } {
  if (pps >= 200) return { major: 0.5, minor: 0.1 };
  if (pps >= 120) return { major: 1, minor: 0.25 };
  if (pps >= 60) return { major: 1, minor: 0.5 };
  if (pps >= 30) return { major: 2, minor: 1 };
  return { major: 5, minor: 1 };
}

export function formatRulerLabel(seconds: number): string {
  if (seconds % 1 === 0) return `${seconds}s`;
  return `${seconds.toFixed(1)}s`;
}

export function pixelsPerSecondForFit(
  duration: number,
  laneWidth: number,
  labelWidth: number
): number {
  const available = Math.max(200, laneWidth - labelWidth - 24);
  return clampPixelsPerSecond(available / Math.max(duration, 1));
}
