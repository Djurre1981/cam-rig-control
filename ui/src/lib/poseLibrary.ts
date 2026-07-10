import { BUILTIN_POSES } from "../data/builtinPoses";
import type { NamedPose } from "../types";
import type { RigPose } from "./rigKinematics";
import type { SubjectAimPoint } from "./subjectTarget";

const STORAGE_KEY = "camrig-pose-library-v1";

type PoseStore = {
  user: Record<string, NamedPose>;
};

function readStore(): PoseStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: {} };
    const parsed = JSON.parse(raw) as PoseStore;
    return { user: parsed.user ?? {} };
  } catch {
    return { user: {} };
  }
}

function writeStore(store: PoseStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export type PoseMeta = {
  id: string;
  name: string;
  builtin: boolean;
  userCreated: boolean;
};

export function listPoses(): PoseMeta[] {
  const store = readStore();
  const builtins = BUILTIN_POSES.map((p) => ({
    id: p.id,
    name: p.name,
    builtin: true,
    userCreated: false,
  }));
  const users = Object.values(store.user)
    .map((p) => ({
      id: p.id,
      name: p.name,
      builtin: false,
      userCreated: true,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...builtins, ...users];
}

export function loadPose(id: string): NamedPose | null {
  const builtin = BUILTIN_POSES.find((p) => p.id === id);
  if (builtin) return structuredClone(builtin);
  return readStore().user[id] ?? null;
}

export function saveUserPose(name: string, pose: RigPose, subjectAim?: SubjectAimPoint): string {
  const store = readStore();
  const id = `pose_${Date.now().toString(36)}`;
  store.user[id] = {
    id,
    name: name.trim() || "Stored pose",
    pose: { ...pose },
    subjectAim: subjectAim ? { ...subjectAim } : undefined,
    builtin: false,
  };
  writeStore(store);
  return id;
}

export function deleteUserPose(id: string): boolean {
  const store = readStore();
  if (!store.user[id]) return false;
  delete store.user[id];
  writeStore(store);
  return true;
}

export function poseToRigPose(named: NamedPose): RigPose {
  return { ...named.pose };
}
