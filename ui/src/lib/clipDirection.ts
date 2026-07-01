import { AXIS_LABELS, type CameraClip, type MotorClip } from "../types";
import { mirrorSpeedCurve } from "./speedCurve";

export type MotorDirection = "up" | "down" | "left" | "right";

/** Boom (0) and pitch (3) move vertically; swing (1) and yaw (2) horizontally. */
export function axisUsesVerticalDirection(axis: number): boolean {
  return axis === 0 || axis === 3;
}

export function isMotorReversed(clip: MotorClip, axis: number): boolean {
  const dir = motorClipDirection(axis, clip);
  if (axisUsesVerticalDirection(axis)) return dir === "down";
  return dir === "left";
}

export function isCameraReversed(clip: CameraClip): boolean {
  if (clip.reversed != null) return clip.reversed;
  if (clip.type === "ZoomClip") return (clip.from_zoom ?? 1) > (clip.to_zoom ?? 1);
  return false;
}

export function motorSupportsDirection(clip: MotorClip): boolean {
  return clip.type === "JogClip" || clip.type === "MoveClip";
}

export function cameraSupportsDirection(clip: CameraClip): boolean {
  return clip.type === "ZoomClip" || clip.type === "FocusClip";
}

/** Physical direction from clip parameters (positive velocity / toward higher position = up or right). */
export function motorClipDirection(axis: number, clip: MotorClip): MotorDirection {
  let towardPositive: boolean;
  if (clip.type === "JogClip") {
    towardPositive = (clip.velocity ?? 0) >= 0;
  } else if (clip.type === "MoveClip") {
    towardPositive = (clip.to_pos ?? 0) >= (clip.from_pos ?? 0);
  } else {
    return axisUsesVerticalDirection(axis) ? "up" : "right";
  }

  if (axisUsesVerticalDirection(axis)) {
    return towardPositive ? "up" : "down";
  }
  return towardPositive ? "right" : "left";
}

export function reverseMotorClip(clip: MotorClip, axis: number): void {
  if (clip.type === "JogClip") {
    clip.velocity = -(clip.velocity ?? 100);
  } else if (clip.type === "MoveClip") {
    const from = clip.from_pos ?? 0;
    clip.from_pos = clip.to_pos ?? 0;
    clip.to_pos = from;
  }
  if (clip.speed_curve?.length) {
    clip.speed_curve = mirrorSpeedCurve(clip.speed_curve);
  }
  if (motorSupportsDirection(clip)) {
    clip.label = motorClipLabel(axis, clip);
  }
}

function linkMoveClipFromPredecessor(clip: MotorClip, prev: MotorClip, axis: number): void {
  if (prev.type !== "MoveClip" || clip.type !== "MoveClip") return;
  const delta = (clip.to_pos ?? 0) - (clip.from_pos ?? 0);
  clip.from_pos = prev.to_pos ?? 0;
  clip.to_pos = clip.from_pos + delta;
  if (motorSupportsDirection(clip)) {
    clip.label = motorClipLabel(axis, clip);
  }
}

/** Keep MoveClip chains contiguous in motor space after a direction change. */
export function relinkFollowingMovePositions(
  clips: MotorClip[],
  fromIndex: number,
  axis: number
): void {
  for (let i = fromIndex + 1; i < clips.length; i++) {
    linkMoveClipFromPredecessor(clips[i], clips[i - 1], axis);
  }
}

export function reverseCameraClip(clip: CameraClip): void {
  if (clip.type === "ZoomClip") {
    const from = clip.from_zoom ?? 1;
    clip.from_zoom = clip.to_zoom ?? 1;
    clip.to_zoom = from;
  } else if (clip.type === "FocusClip") {
    clip.reversed = !isCameraReversed(clip);
  }
  if (cameraSupportsDirection(clip)) {
    clip.label = cameraClipLabel(clip);
  }
}

function linkZoomClipFromPredecessor(clip: CameraClip, prev: CameraClip): void {
  if (prev.type !== "ZoomClip" || clip.type !== "ZoomClip") return;
  const delta = (clip.to_zoom ?? 1) - (clip.from_zoom ?? 1);
  clip.from_zoom = prev.to_zoom ?? 1;
  clip.to_zoom = clip.from_zoom + delta;
  if (cameraSupportsDirection(clip)) {
    clip.label = cameraClipLabel(clip);
  }
}

/** Keep ZoomClip chains contiguous after a direction change. */
export function relinkFollowingZoomPositions(clips: CameraClip[], fromIndex: number): void {
  for (let i = fromIndex + 1; i < clips.length; i++) {
    linkZoomClipFromPredecessor(clips[i], clips[i - 1]);
  }
}

const DIRECTION_WORDS: Record<MotorDirection, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
};

/** Display name for a motor clip from axis + current direction. */
export function motorClipLabel(axis: number, clip: MotorClip): string {
  if (!motorSupportsDirection(clip)) {
    return clip.label ?? clip.type.replace("Clip", "");
  }
  const dir = motorClipDirection(axis, clip);
  const axisName = AXIS_LABELS[axis] ?? "Axis";
  return `${axisName} ${DIRECTION_WORDS[dir]}`;
}

/** Display name for a camera clip from current direction / zoom. */
export function cameraClipLabel(clip: CameraClip): string {
  if (clip.type === "ZoomClip") {
    return isCameraReversed(clip) ? "Zoom out" : "Zoom in";
  }
  if (clip.type === "FocusClip") {
    return isCameraReversed(clip) ? "Focus far" : "Focus near";
  }
  return clip.label ?? clip.type.replace("Clip", "");
}

const DIRECTION_ICONS: Record<MotorDirection, string> = {
  up: "▲",
  down: "▼",
  left: "◀",
  right: "▶",
};

export function motorDirectionIcon(axis: number, clip: MotorClip): string {
  return DIRECTION_ICONS[motorClipDirection(axis, clip)];
}

export function motorDirectionTitle(axis: number, clip: MotorClip): string {
  const dir = motorClipDirection(axis, clip);
  const label = AXIS_LABELS[axis] ?? "Axis";
  const words: Record<MotorDirection, string> = {
    up: "up",
    down: "down",
    left: "left",
    right: "right",
  };
  return `${label} ${words[dir]} — click to reverse`;
}

export function cameraDirectionLabel(reversed: boolean): string {
  return reversed ? "−" : "+";
}

export function cameraDirectionTitle(clip: CameraClip, reversed: boolean): string {
  if (clip.type === "ZoomClip") return reversed ? "Zoom out" : "Zoom in";
  return reversed ? "Focus far → near" : "Focus near → far";
}
