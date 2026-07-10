import type { CameraTrack, TimelineProject } from "../types";
import { MOTOR_TRACK_COLORS } from "../types";
import { normalizeProject } from "../lib/normalizeProject";

function baseTracks() {
  return [
    { id: "track_boom", axis: 0, label: "Boom", color: MOTOR_TRACK_COLORS[0], clips: [] as TimelineProject["tracks"][0]["clips"] },
    { id: "track_swing", axis: 1, label: "Swing", color: MOTOR_TRACK_COLORS[1], clips: [] },
    { id: "track_yaw", axis: 2, label: "Yaw", color: MOTOR_TRACK_COLORS[2], clips: [] },
    { id: "track_pitch", axis: 3, label: "Pitch", color: MOTOR_TRACK_COLORS[3], clips: [] },
  ];
}

function baseCamera(): CameraTrack[] {
  return [
    { id: "record", label: "Record", color: "#c44d6d", clips: [] },
    { id: "zoom", label: "Zoom", color: "#2d9d8a", clips: [] },
    { id: "focus", label: "Focus", color: "#d4844a", clips: [] },
  ];
}

function anim(name: string, duration: number, tracks: TimelineProject["tracks"], camera = baseCamera()): TimelineProject {
  return normalizeProject({ version: 1, name, duration, tracks, camera_tracks: camera });
}

/** Seven additional builtin sequences (demo, slow_swing, blank registered separately). */
export const EXTRA_BUILTIN_ANIMATIONS: Record<string, TimelineProject> = {
  reveal_rise: anim("Reveal rise", 12, [
    { ...baseTracks()[0], clips: [{ id: "r1", type: "MoveClip", start: 0, duration: 6, from_pos: 0, to_pos: 600, label: "Rise" }] },
    baseTracks()[1],
    { ...baseTracks()[2], clips: [{ id: "r2", type: "JogClip", start: 3, duration: 6, velocity: 40, label: "Pan in" }] },
    baseTracks()[3],
  ]),
  orbit_slow: anim("Slow 180° orbit", 16, [
    baseTracks()[0],
    { ...baseTracks()[1], clips: [{ id: "o1", type: "MoveClip", start: 0, duration: 14, from_pos: 0, to_pos: 1800, label: "Half orbit" }] },
    baseTracks()[2],
    baseTracks()[3],
  ]),
  push_in: anim("Push in zoom", 10, [
    baseTracks()[0],
    baseTracks()[1],
    baseTracks()[2],
    { ...baseTracks()[3], clips: [{ id: "p1", type: "MoveClip", start: 0, duration: 4, from_pos: 0, to_pos: -20, label: "Tilt" }] },
  ], [
    { id: "record", label: "Record", color: "#c44d6d", clips: [] },
    { id: "zoom", label: "Zoom", color: "#2d9d8a", clips: [{ id: "pz1", type: "ZoomClip", start: 1, duration: 8, from_zoom: 1, to_zoom: 2.5, label: "Push" }] },
    { id: "focus", label: "Focus", color: "#d4844a", clips: [] },
  ]),
  crane_down: anim("Crane down", 14, [
    { ...baseTracks()[0], clips: [{ id: "c1", type: "MoveClip", start: 0, duration: 10, from_pos: 400, to_pos: -200, label: "Lower" }] },
    baseTracks()[1],
    baseTracks()[2],
    baseTracks()[3],
  ]),
  whip_pan: anim("Whip pan", 8, [
    baseTracks()[0],
    baseTracks()[1],
    { ...baseTracks()[2], clips: [{ id: "w1", type: "JogClip", start: 0, duration: 3, velocity: 120, label: "Whip L" }, { id: "w2", type: "JogClip", start: 4, duration: 3, velocity: -120, label: "Whip R" }] },
    baseTracks()[3],
  ]),
  interview_two: anim("Interview two-shot", 20, [
    { ...baseTracks()[0], clips: [{ id: "i1", type: "MoveClip", start: 0, duration: 5, from_pos: 0, to_pos: 200, label: "Lift" }] },
    { ...baseTracks()[1], clips: [{ id: "i2", type: "MoveClip", start: 5, duration: 6, from_pos: 0, to_pos: 900, label: "Swing A" }, { id: "i3", type: "MoveClip", start: 12, duration: 6, from_pos: 900, to_pos: -900, label: "Swing B" }] },
    { ...baseTracks()[2], clips: [{ id: "i4", type: "JogClip", start: 0, duration: 18, velocity: -25, label: "Follow" }] },
    baseTracks()[3],
  ]),
  timelapse_sweep: anim("Timelapse sweep", 30, [
    baseTracks()[0],
    { ...baseTracks()[1], clips: [{ id: "t1", type: "MoveClip", start: 0, duration: 28, from_pos: -1800, to_pos: 1800, label: "Full sweep" }] },
    baseTracks()[2],
    { ...baseTracks()[3], clips: [{ id: "t2", type: "MoveClip", start: 0, duration: 28, from_pos: -15, to_pos: 15, label: "Tilt drift" }] },
  ]),
};
