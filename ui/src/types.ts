export type MotorClipType = "JogClip" | "MoveClip" | "RecordedClip";
export type CameraClipType = "RecordClip" | "ZoomClip" | "FocusClip";

export type MotorClip = {
  id: string;
  type: MotorClipType;
  start: number;
  duration: number;
  velocity?: number;
  from_pos?: number;
  to_pos?: number;
  label?: string;
};

export type MotorTrack = {
  id: string;
  axis: number;
  label: string;
  color: string;
  clips: MotorClip[];
};

export type CameraClip = {
  id: string;
  type: CameraClipType;
  start: number;
  duration: number;
  action?: string;
  from_zoom?: number;
  to_zoom?: number;
  label?: string;
};

export type CameraTrackId = "record" | "zoom" | "focus";

export type CameraTrack = {
  id: CameraTrackId;
  label: string;
  color: string;
  clips: CameraClip[];
};

export type TimelineProject = {
  version: 1;
  name: string;
  duration: number;
  tracks: MotorTrack[];
  camera_tracks: CameraTrack[];
};

export type ClipSelection =
  | { kind: "motor"; trackId: string; clipId: string }
  | { kind: "camera"; trackId: CameraTrackId; clipId: string }
  | null;

export type PaletteItem = {
  id: string;
  label: string;
  description: string;
  clipType: MotorClipType | CameraClipType;
  target: "motor" | CameraTrackId;
  defaults: Partial<MotorClip & CameraClip>;
  color: string;
};

export const AXIS_LABELS = ["Boom", "Swing", "Yaw", "Pitch"] as const;
export const TRACK_LABEL_WIDTH = 128;
export const PIXELS_PER_SECOND = 72;
export const SNAP_SECONDS = 0.25;
export const MIN_CLIP_DURATION = 0.25;

export const MOTOR_TRACK_COLORS = ["#e85d5d", "#d4b84a", "#5de88a", "#4f8cff"];
