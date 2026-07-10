/**
 * Home-distance calibration for follow-focus planning.
 * Persists tape-measured lens-to-subject distance at rig home.
 */

import { BOOM_REST_ANGLE } from "./rigConstants";
import { homeSubjectDistance } from "./rigFocus";
import type { SubjectAimPoint } from "./subjectTarget";
import type { RigPose } from "./rigKinematics";

const STORAGE_KEY = "camrig-focus-calibration-v1";
const FOLLOW_KEY = "camrig-focus-follow-demo";

export const HOME_POSE: RigPose = {
  boom: BOOM_REST_ANGLE,
  swing: 0,
  yaw: 0,
  pitch: 0,
  zoom: 1,
};

export type FocusCalibration = {
  /** Tape-measured lens-to-subject at rig home (metres). */
  measuredHomeM: number | null;
};

export type FocusDistanceState = {
  /** Raw model distance (metres). */
  computedM: number;
  /** Calibrated distance; equals computed when uncalibrated. */
  subjectM: number;
  /** Home reference used for delta (measured or computed). */
  homeReferenceM: number;
  /** subjectM − homeReferenceM (positive = subject farther than at home). */
  deltaFromHomeM: number;
  calibrated: boolean;
  scale: number;
};

export type FocusFollowHint = {
  direction: "near" | "far" | "hold";
  steps: number;
  label: string;
};

export const DEFAULT_CALIBRATION: FocusCalibration = { measuredHomeM: null };

export function loadFocusCalibration(): FocusCalibration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CALIBRATION };
    const parsed = JSON.parse(raw) as FocusCalibration;
    const m = parsed.measuredHomeM;
    return {
      measuredHomeM: typeof m === "number" && m > 0 ? m : null,
    };
  } catch {
    return { ...DEFAULT_CALIBRATION };
  }
}

export function saveFocusCalibration(cal: FocusCalibration): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cal));
  } catch {
    /* ignore */
  }
}

export function loadFocusFollowDemo(): boolean {
  try {
    return sessionStorage.getItem(FOLLOW_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveFocusFollowDemo(on: boolean): void {
  try {
    sessionStorage.setItem(FOLLOW_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function computedDistanceAtHome(aimPoint?: SubjectAimPoint): number {
  return homeSubjectDistance(HOME_POSE, aimPoint);
}

export function calibrationScale(cal: FocusCalibration, aimPoint?: SubjectAimPoint): number {
  if (cal.measuredHomeM == null || cal.measuredHomeM <= 0) return 1;
  const homeRaw = computedDistanceAtHome(aimPoint);
  if (homeRaw < 1e-6) return 1;
  return cal.measuredHomeM / homeRaw;
}

export function focusDistanceAtPose(
  pose: RigPose,
  cal: FocusCalibration,
  aimPoint?: SubjectAimPoint
): FocusDistanceState {
  const computedM = homeSubjectDistance(pose, aimPoint);
  const scale = calibrationScale(cal, aimPoint);
  const subjectM = computedM * scale;
  const homeReferenceM = cal.measuredHomeM ?? computedDistanceAtHome(aimPoint);
  const deltaFromHomeM = subjectM - homeReferenceM;
  return {
    computedM,
    subjectM,
    homeReferenceM,
    deltaFromHomeM,
    calibrated: cal.measuredHomeM != null && cal.measuredHomeM > 0,
    scale,
  };
}

/** Rough demo mapping for Sony MF pulses (calibrate on hardware later). */
export function focusFollowHint(
  deltaFromHomeM: number,
  deadbandM = 0.008
): FocusFollowHint {
  if (Math.abs(deltaFromHomeM) < deadbandM) {
    return { direction: "hold", steps: 0, label: "hold" };
  }
  const direction = deltaFromHomeM > 0 ? "far" : "near";
  const steps = Math.max(1, Math.min(48, Math.round(Math.abs(deltaFromHomeM) * 100)));
  return {
    direction,
    steps,
    label: `focus_${direction} × ${steps}`,
  };
}

export function formatDeltaM(deltaM: number): string {
  const cm = deltaM * 100;
  const sign = cm >= 0 ? "+" : "";
  if (Math.abs(cm) < 10) return `${sign}${cm.toFixed(1)} cm`;
  return `${sign}${(deltaM).toFixed(2)} m`;
}
