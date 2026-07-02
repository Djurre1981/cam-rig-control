import type { TimelineProject } from "../types";

const STORAGE_KEY = "camrig-view-layout-v1";

export type ViewLayout = {
  leftSidebar: boolean;
  rigPreview: boolean;
  cameraView: boolean;
  /** Virtual horizon overlay on the camera view preview. */
  cameraHorizon: boolean;
  inspector: boolean;
  transport: boolean;
  scrubSection: boolean;
  /** track id → visible */
  timelineTracks: Record<string, boolean>;
};

export const DEFAULT_VIEW_LAYOUT: ViewLayout = {
  leftSidebar: true,
  rigPreview: true,
  cameraView: true,
  cameraHorizon: true,
  inspector: true,
  transport: true,
  scrubSection: true,
  timelineTracks: {},
};

function trackVisibility(
  stored: Record<string, boolean> | undefined,
  project: TimelineProject | null
): Record<string, boolean> {
  const out: Record<string, boolean> = { ...stored };
  if (!project) return out;
  for (const t of project.tracks) {
    if (out[t.id] === undefined) out[t.id] = true;
  }
  for (const t of project.camera_tracks) {
    if (out[t.id] === undefined) out[t.id] = true;
  }
  return out;
}

export function loadViewLayout(project: TimelineProject | null): ViewLayout {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VIEW_LAYOUT, timelineTracks: trackVisibility({}, project) };
    const parsed = JSON.parse(raw) as Partial<ViewLayout>;
    return {
      leftSidebar: parsed.leftSidebar ?? DEFAULT_VIEW_LAYOUT.leftSidebar,
      rigPreview: parsed.rigPreview ?? DEFAULT_VIEW_LAYOUT.rigPreview,
      cameraView: parsed.cameraView ?? DEFAULT_VIEW_LAYOUT.cameraView,
      cameraHorizon: parsed.cameraHorizon ?? DEFAULT_VIEW_LAYOUT.cameraHorizon,
      inspector: parsed.inspector ?? DEFAULT_VIEW_LAYOUT.inspector,
      transport: parsed.transport ?? DEFAULT_VIEW_LAYOUT.transport,
      scrubSection: parsed.scrubSection ?? DEFAULT_VIEW_LAYOUT.scrubSection,
      timelineTracks: trackVisibility(parsed.timelineTracks, project),
    };
  } catch {
    return { ...DEFAULT_VIEW_LAYOUT, timelineTracks: trackVisibility({}, project) };
  }
}

export function saveViewLayout(layout: ViewLayout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function mergeTrackVisibility(layout: ViewLayout, project: TimelineProject): ViewLayout {
  return {
    ...layout,
    timelineTracks: trackVisibility(layout.timelineTracks, project),
  };
}

export function isTrackVisible(layout: ViewLayout, trackId: string): boolean {
  return layout.timelineTracks[trackId] !== false;
}
