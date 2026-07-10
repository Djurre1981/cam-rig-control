import demoShowcase from "../data/demo_showcase.json";
import exampleSlowSwing from "../data/example_slow_swing.json";
import { builtinAnimationAim } from "../data/builtinAnimationAims";
import { EXTRA_BUILTIN_ANIMATIONS } from "../data/extraBuiltinAnimations";
import { MOTOR_TRACK_COLORS, type TimelineProject } from "../types";
import { normalizeProject } from "./normalizeProject";

export const BUILTIN_ANIMATION_IDS = [
  "demo",
  "slow_swing",
  "blank",
  "reveal_rise",
  "orbit_slow",
  "push_in",
  "crane_down",
  "whip_pan",
  "interview_two",
  "timelapse_sweep",
] as const;
export type BuiltinAnimationId = (typeof BUILTIN_ANIMATION_IDS)[number];

export type AnimationMeta = {
  id: string;
  name: string;
  builtin: boolean;
  /** Built-in animation has user-saved changes in local storage. */
  overridden: boolean;
  /** User-created animation (deletable). */
  userCreated: boolean;
  updatedAt?: string;
};

type StoredRecord = {
  name: string;
  project: TimelineProject;
  updatedAt: string;
};

type AnimationStore = {
  user: Record<string, StoredRecord>;
  overrides: Partial<Record<BuiltinAnimationId, StoredRecord>>;
};

const STORAGE_KEY = "camrig-animation-library-v1";

function blankProject(): TimelineProject {
  return normalizeProject({
    version: 1,
    name: "Untitled animation",
    duration: 30,
    tracks: [
      { id: "track_boom", axis: 0, label: "Boom", color: MOTOR_TRACK_COLORS[0], clips: [] },
      { id: "track_swing", axis: 1, label: "Swing", color: MOTOR_TRACK_COLORS[1], clips: [] },
      { id: "track_yaw", axis: 2, label: "Yaw", color: MOTOR_TRACK_COLORS[2], clips: [] },
      { id: "track_pitch", axis: 3, label: "Pitch", color: MOTOR_TRACK_COLORS[3], clips: [] },
    ],
    camera_tracks: [
      { id: "record", label: "Record", color: "#c44d6d", clips: [] },
      { id: "zoom", label: "Zoom", color: "#2d9d8a", clips: [] },
      { id: "focus", label: "Focus", color: "#d4844a", clips: [] },
    ],
  });
}

const BUILTIN_PROJECTS: Record<BuiltinAnimationId, TimelineProject> = {
  demo: normalizeProject(demoShowcase as TimelineProject),
  slow_swing: normalizeProject(exampleSlowSwing as TimelineProject),
  blank: blankProject(),
  reveal_rise: EXTRA_BUILTIN_ANIMATIONS.reveal_rise,
  orbit_slow: EXTRA_BUILTIN_ANIMATIONS.orbit_slow,
  push_in: EXTRA_BUILTIN_ANIMATIONS.push_in,
  crane_down: EXTRA_BUILTIN_ANIMATIONS.crane_down,
  whip_pan: EXTRA_BUILTIN_ANIMATIONS.whip_pan,
  interview_two: EXTRA_BUILTIN_ANIMATIONS.interview_two,
  timelapse_sweep: EXTRA_BUILTIN_ANIMATIONS.timelapse_sweep,
};

BUILTIN_PROJECTS.blank.name = "Empty 30s";

function withBuiltinAim(id: BuiltinAnimationId, project: TimelineProject): TimelineProject {
  const aim = project.subjectAim ?? builtinAnimationAim(id, project);
  if (!aim) return project;
  return { ...project, subjectAim: aim };
}

for (const id of BUILTIN_ANIMATION_IDS) {
  BUILTIN_PROJECTS[id] = withBuiltinAim(id, BUILTIN_PROJECTS[id]);
}

function readStore(): AnimationStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: {}, overrides: {} };
    const parsed = JSON.parse(raw) as AnimationStore;
    return {
      user: parsed.user ?? {},
      overrides: parsed.overrides ?? {},
    };
  } catch {
    return { user: {}, overrides: {} };
  }
}

function writeStore(store: AnimationStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getBuiltinProject(id: BuiltinAnimationId): TimelineProject {
  return structuredClone(BUILTIN_PROJECTS[id]);
}

export function getOriginalBuiltinProject(id: BuiltinAnimationId): TimelineProject {
  return getBuiltinProject(id);
}

export function loadAnimationProject(id: string): TimelineProject | null {
  const store = readStore();
  if (BUILTIN_ANIMATION_IDS.includes(id as BuiltinAnimationId)) {
    const builtinId = id as BuiltinAnimationId;
    const override = store.overrides[builtinId];
    const project = override ? normalizeProject(override.project) : getBuiltinProject(builtinId);
    return withBuiltinAim(builtinId, project);
  }
  const user = store.user[id];
  if (!user) return null;
  return normalizeProject(user.project);
}

export function listAnimations(): AnimationMeta[] {
  const store = readStore();
  const items: AnimationMeta[] = [];

  for (const id of BUILTIN_ANIMATION_IDS) {
    const override = store.overrides[id];
    items.push({
      id,
      name: override?.name ?? BUILTIN_PROJECTS[id].name,
      builtin: true,
      overridden: !!override,
      userCreated: false,
      updatedAt: override?.updatedAt,
    });
  }

  const userEntries = Object.entries(store.user)
    .map(([id, record]) => ({
      id,
      name: record.name,
      builtin: false,
      overridden: false,
      userCreated: true,
      updatedAt: record.updatedAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...items, ...userEntries];
}

function newUserId() {
  return `anim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function saveAnimation(id: string, project: TimelineProject): string {
  const store = readStore();
  const normalized = normalizeProject(project);
  const record: StoredRecord = {
    name: normalized.name,
    project: normalized,
    updatedAt: new Date().toISOString(),
  };

  if (BUILTIN_ANIMATION_IDS.includes(id as BuiltinAnimationId)) {
    store.overrides[id as BuiltinAnimationId] = record;
    writeStore(store);
    return id;
  }

  if (store.user[id]) {
    store.user[id] = record;
    writeStore(store);
    return id;
  }

  const newId = newUserId();
  store.user[newId] = record;
  writeStore(store);
  return newId;
}

export function saveAnimationAs(project: TimelineProject, name: string): string {
  const store = readStore();
  const normalized = normalizeProject({ ...project, name: name.trim() || "Untitled animation" });
  const id = newUserId();
  store.user[id] = {
    name: normalized.name,
    project: normalized,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
  return id;
}

export function renameAnimation(id: string, name: string): void {
  const trimmed = name.trim() || "Untitled animation";
  const store = readStore();

  if (BUILTIN_ANIMATION_IDS.includes(id as BuiltinAnimationId)) {
    const builtinId = id as BuiltinAnimationId;
    const base = store.overrides[builtinId]?.project ?? getBuiltinProject(builtinId);
    const project = normalizeProject({ ...base, name: trimmed });
    store.overrides[builtinId] = {
      name: trimmed,
      project,
      updatedAt: new Date().toISOString(),
    };
    writeStore(store);
    return;
  }

  const record = store.user[id];
  if (!record) return;
  record.name = trimmed;
  record.project = normalizeProject({ ...record.project, name: trimmed });
  record.updatedAt = new Date().toISOString();
  writeStore(store);
}

export function deleteAnimation(id: string): "deleted" | "reverted" | "not_found" | "protected" {
  const store = readStore();

  if (BUILTIN_ANIMATION_IDS.includes(id as BuiltinAnimationId)) {
    if (!store.overrides[id as BuiltinAnimationId]) return "protected";
    delete store.overrides[id as BuiltinAnimationId];
    writeStore(store);
    return "reverted";
  }

  if (!store.user[id]) return "not_found";
  delete store.user[id];
  writeStore(store);
  return "deleted";
}

export function duplicateAnimation(id: string, name?: string): string | null {
  const project = loadAnimationProject(id);
  if (!project) return null;
  const copyName = name?.trim() || `${project.name} copy`;
  return saveAnimationAs(project, copyName);
}

export function createBlankAnimation(name = "Untitled animation"): { id: string; project: TimelineProject } {
  const project = blankProject();
  project.name = name;
  const id = saveAnimationAs(project, name);
  return { id, project: loadAnimationProject(id)! };
}
