import type { MotorClip, MotorClipType, SpeedKeyframe } from "../types";

/** Interpolate speed multiplier (0–1) at normalized clip time t ∈ [0, 1]. */
export function speedAtTime(curve: SpeedKeyframe[], t: number): number {
  const sorted = [...curve].sort((a, b) => a.t - b.t);
  if (sorted.length === 0) return 1;
  if (t <= sorted[0].t) return sorted[0].v;
  if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].v;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t;
      if (span < 1e-9) return b.v;
      const u = (t - a.t) / span;
      return a.v + (b.v - a.v) * u;
    }
  }
  return 1;
}

/** Integrate speed curve from 0 → t (trapezoidal). */
function integrateSpeed(curve: SpeedKeyframe[], tEnd: number, steps = 48): number {
  const end = Math.max(0, Math.min(1, tEnd));
  if (end <= 0) return 0;
  let sum = 0;
  let prev = speedAtTime(curve, 0);
  for (let i = 1; i <= steps; i++) {
    const t = (end * i) / steps;
    const cur = speedAtTime(curve, t);
    sum += ((prev + cur) / 2) * (end / steps);
    prev = cur;
  }
  return sum;
}

/** Map wall-clock position in clip (0–1) → motion progress (0–1) via speed envelope. */
export function motionProgressAtTime(curve: SpeedKeyframe[], localT: number): number {
  const t = Math.max(0, Math.min(1, localT));
  const total = integrateSpeed(curve, 1);
  if (total < 1e-9) return t;
  return integrateSpeed(curve, t) / total;
}

export function defaultSpeedCurve(type: MotorClipType): SpeedKeyframe[] {
  if (type === "MoveClip") {
    return [
      { t: 0, v: 0.15 },
      { t: 0.2, v: 1 },
      { t: 0.5, v: 1 },
      { t: 0.8, v: 1 },
      { t: 1, v: 0.15 },
    ];
  }
  if (type === "JogClip") {
    return [
      { t: 0, v: 0.2 },
      { t: 0.15, v: 1 },
      { t: 0.85, v: 1 },
      { t: 1, v: 0.2 },
    ];
  }
  return [
    { t: 0, v: 1 },
    { t: 1, v: 1 },
  ];
}

export function ensureSpeedCurve(clip: MotorClip): SpeedKeyframe[] {
  if (clip.speed_curve && clip.speed_curve.length >= 2) {
    return clip.speed_curve.map((k) => ({
      t: Math.max(0, Math.min(1, k.t)),
      v: Math.max(0, Math.min(1, k.v)),
    }));
  }
  return defaultSpeedCurve(clip.type);
}

export function sortSpeedCurve(curve: SpeedKeyframe[]): SpeedKeyframe[] {
  return [...curve].sort((a, b) => a.t - b.t);
}

const MIN_KEYFRAME_GAP_SEC = 0.05;

function minKeyframeGapNormalized(durationSec: number): number {
  if (durationSec <= 0) return 0.04;
  return Math.min(0.04, MIN_KEYFRAME_GAP_SEC / durationSec);
}

export function addSpeedKeyframe(
  curve: SpeedKeyframe[],
  t: number,
  v = 1,
  durationSec = 1
): SpeedKeyframe[] {
  const nt = Math.max(0, Math.min(1, t));
  const gap = minKeyframeGapNormalized(durationSec);
  const tooClose = curve.some((k) => Math.abs(k.t - nt) < gap);
  if (tooClose) return curve;
  return sortSpeedCurve([...curve, { t: nt, v: Math.max(0, Math.min(1, v)) }]);
}

export function removeSpeedKeyframe(curve: SpeedKeyframe[], index: number): SpeedKeyframe[] {
  if (curve.length <= 2) return curve;
  return curve.filter((_, i) => i !== index);
}

/** Mirror speed envelope horizontally (swap ease at clip start vs end). */
export function mirrorSpeedCurve(curve: SpeedKeyframe[]): SpeedKeyframe[] {
  return sortSpeedCurve(
    curve.map((k) => ({
      t: Math.max(0, Math.min(1, 1 - k.t)),
      v: k.v,
    }))
  );
}

export function speedCurvePolyline(
  curve: SpeedKeyframe[],
  width: number,
  height: number,
  xInset = 0
): string {
  const plotW = Math.max(1, width - 2 * xInset);
  const sorted = sortSpeedCurve(curve);
  return sorted
    .map((k, i) => {
      const x = xInset + k.t * plotW;
      const y = Math.max(0, Math.min(height, height - k.v * height));
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
