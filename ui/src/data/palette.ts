import type { PaletteItem } from "../types";

export const CLIP_PALETTE: PaletteItem[] = [
  {
    id: "movement",
    label: "Movement",
    description: "Smooth position A → B",
    clipType: "MoveClip",
    target: "motor",
    color: "#6a5a9a",
    defaults: { duration: 4, from_pos: 0, to_pos: 1200, label: "Movement" },
  },
  {
    id: "rec_start",
    label: "Record ▶",
    description: "Start movie recording",
    clipType: "RecordClip",
    target: "record",
    color: "#c44d6d",
    defaults: { duration: 0.25, action: "start", label: "Rec start" },
  },
  {
    id: "rec_stop",
    label: "Record ■",
    description: "Stop movie recording",
    clipType: "RecordClip",
    target: "record",
    color: "#8a3d52",
    defaults: { duration: 0.25, action: "stop", label: "Rec stop" },
  },
  {
    id: "zoom",
    label: "Zoom ramp",
    description: "ZV-1 II optical zoom",
    clipType: "ZoomClip",
    target: "zoom",
    color: "#2d9d8a",
    defaults: { duration: 4, from_zoom: 1, to_zoom: 1.8, label: "Zoom" },
  },
  {
    id: "focus",
    label: "Focus pull",
    description: "Manual focus near → far",
    clipType: "FocusClip",
    target: "focus",
    color: "#d4844a",
    defaults: { duration: 3, label: "Focus" },
  },
];
