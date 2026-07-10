import { BOOM_REST_ANGLE } from "../lib/rigConstants";
import { DEFAULT_SUBJECT_AIM, subjectAimForPose } from "../lib/subjectTarget";
import type { NamedPose } from "../types";

const orbitCentre = { fixed: DEFAULT_SUBJECT_AIM };

/** Ten shipped named poses for quick recall. */
export const BUILTIN_POSES: NamedPose[] = [
  {
    id: "pose_home",
    name: "Home master",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE, swing: 0, yaw: 0, pitch: 0, zoom: 1 },
    subjectAim: subjectAimForPose({ boom: BOOM_REST_ANGLE, swing: 0, yaw: 0, pitch: 0, zoom: 1 }),
  },
  {
    id: "pose_low_hero",
    name: "Low hero",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE - 0.35, swing: 0, yaw: 0, pitch: -0.12, zoom: 1.2 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE - 0.35, swing: 0, yaw: 0, pitch: -0.12, zoom: 1.2 },
      { distanceM: 1.05 }
    ),
  },
  {
    id: "pose_high_wide",
    name: "High wide",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE + 0.42, swing: 0, yaw: 0, pitch: 0.08, zoom: 0.85 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE + 0.42, swing: 0, yaw: 0, pitch: 0.08, zoom: 0.85 },
      { distanceM: 1.55 }
    ),
  },
  {
    id: "pose_orbit_left",
    name: "Orbit left 45°",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE, swing: 0.78, yaw: -0.35, pitch: 0, zoom: 1 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE, swing: 0.78, yaw: -0.35, pitch: 0, zoom: 1 },
      orbitCentre
    ),
  },
  {
    id: "pose_orbit_right",
    name: "Orbit right 45°",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE, swing: -0.78, yaw: 0.35, pitch: 0, zoom: 1 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE, swing: -0.78, yaw: 0.35, pitch: 0, zoom: 1 },
      orbitCentre
    ),
  },
  {
    id: "pose_cu_tilt",
    name: "CU tilt down",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE - 0.15, swing: 0, yaw: 0, pitch: -0.45, zoom: 2.2 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE - 0.15, swing: 0, yaw: 0, pitch: -0.45, zoom: 2.2 },
      { distanceM: 0.52 }
    ),
  },
  {
    id: "pose_dutch",
    name: "Dutch angle",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE, swing: 0.4, yaw: 0.5, pitch: -0.2, zoom: 1.4 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE, swing: 0.4, yaw: 0.5, pitch: -0.2, zoom: 1.4 },
      { distanceM: 0.95, lateralM: 0.18 }
    ),
  },
  {
    id: "pose_over_shoulder",
    name: "Over shoulder",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE + 0.1, swing: 1.2, yaw: -0.9, pitch: -0.05, zoom: 1.6 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE + 0.1, swing: 1.2, yaw: -0.9, pitch: -0.05, zoom: 1.6 },
      { distanceM: 1.1, lateralM: -0.42 }
    ),
  },
  {
    id: "pose_macro",
    name: "Macro close",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE - 0.25, swing: 0.15, yaw: 0.1, pitch: -0.08, zoom: 3 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE - 0.25, swing: 0.15, yaw: 0.1, pitch: -0.08, zoom: 3 },
      { distanceM: 0.38 }
    ),
  },
  {
    id: "pose_sky_clean",
    name: "Sky clean plate",
    builtin: true,
    pose: { boom: BOOM_REST_ANGLE + 0.55, swing: 0, yaw: 0, pitch: 0.55, zoom: 1 },
    subjectAim: subjectAimForPose(
      { boom: BOOM_REST_ANGLE + 0.55, swing: 0, yaw: 0, pitch: 0.55, zoom: 1 },
      { distanceM: 4.5 }
    ),
  },
];
