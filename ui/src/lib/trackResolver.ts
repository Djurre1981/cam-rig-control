import type { CameraTrackId, PaletteItem } from "../types";

export type ResolvedTrack = {
  kind: "motor" | "camera";
  trackId: string;
  lane: HTMLElement;
};

/** Motor clips → closest of the 4 motor rows by Y. Camera clips → their dedicated track. */
export function resolveDropTrack(
  canvas: HTMLElement,
  clientY: number,
  item: PaletteItem
): ResolvedTrack | null {
  const rows = Array.from(canvas.querySelectorAll<HTMLElement>(".track-row"));

  if (item.target === "motor") {
    const motorRows = rows.filter((r) => !r.classList.contains("camera"));
    if (motorRows.length === 0) return null;

    let best = motorRows[0];
    let bestDist = Infinity;
    for (const row of motorRows) {
      const rect = row.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = row;
      }
    }
    const trackId = best.dataset.trackId;
    const lane = best.querySelector<HTMLElement>(".track-lane");
    if (!trackId || !lane) return null;
    return { kind: "motor", trackId, lane };
  }

  const cameraId = item.target as CameraTrackId;
  const row = rows.find((r) => r.dataset.trackId === cameraId);
  if (!row) return null;
  const lane = row.querySelector<HTMLElement>(".track-lane");
  if (!lane) return null;
  return { kind: "camera", trackId: cameraId, lane };
}

/** Closest motor track row for lane click on motor area. */
export function resolveMotorTrackAtY(
  canvas: HTMLElement,
  clientY: number
): ResolvedTrack | null {
  return resolveDropTrack(canvas, clientY, {
    id: "_motor",
    label: "",
    description: "",
    clipType: "MoveClip",
    target: "motor",
    color: "",
    defaults: {},
  });
}
