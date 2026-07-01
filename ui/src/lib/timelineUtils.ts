import { MIN_CLIP_DURATION, SNAP_SECONDS } from "../types";

export function snapTime(t: number, enabled = true): number {
  if (!enabled) return Math.max(0, t);
  return Math.max(0, Math.round(t / SNAP_SECONDS) * SNAP_SECONDS);
}

export function clampDuration(d: number): number {
  return Math.max(MIN_CLIP_DURATION, d);
}

export function uid(): string {
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}
