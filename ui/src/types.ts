export type MotorClip = {
  type: "JogClip" | "MoveClip" | "RecordedClip";
  start: number;
  duration: number;
  velocity?: number;
  from_pos?: number;
  to_pos?: number;
};

export type MotorTrack = {
  id: string;
  axis: number;
  label: string;
  clips: MotorClip[];
};

export type CameraClip = {
  type: "RecordClip" | "ZoomClip" | "FocusClip";
  start: number;
  duration: number;
  action?: string;
  from_zoom?: number;
  to_zoom?: number;
};

export type CameraTrack = {
  id: "record" | "zoom" | "focus" | "exposure";
  clips: CameraClip[];
};

export type TimelineProject = {
  version: 1;
  name: string;
  duration: number;
  tracks: MotorTrack[];
  camera_tracks?: CameraTrack[];
};

export const AXIS_LABELS = ["Boom", "Swing", "Yaw", "Pitch"] as const;
export const PIXELS_PER_SECOND = 80;
