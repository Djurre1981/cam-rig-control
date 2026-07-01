import type { DragEvent } from "react";
import type { PaletteItem } from "../types";

const DRAG_MIME = "application/x-camrig-clip";

export function setDragClip(e: DragEvent, item: PaletteItem) {
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(item));
  e.dataTransfer.effectAllowed = "copy";
}

export function readDragClip(e: DragEvent): PaletteItem | null {
  const raw = e.dataTransfer.getData(DRAG_MIME);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaletteItem;
  } catch {
    return null;
  }
}

type Props = {
  items: PaletteItem[];
};

export function ClipPalette({ items }: Props) {
  const motor = items.filter((i) => i.target === "motor");
  const camera = items.filter((i) => i.target !== "motor");

  return (
    <div className="clip-palette">
      <h3>Clips</h3>
      <p className="palette-hint">Drag onto a matching track</p>
      <div className="palette-group">
        <span className="palette-group-label">Motion</span>
        {motor.map((item) => (
          <div
            key={item.id}
            className="palette-item"
            draggable
            style={{ borderLeftColor: item.color }}
            onDragStart={(e) => setDragClip(e, item)}
          >
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </div>
        ))}
      </div>
      <div className="palette-group">
        <span className="palette-group-label">Camera (ZV-1 II)</span>
        {camera.map((item) => (
          <div
            key={item.id}
            className="palette-item"
            draggable
            style={{ borderLeftColor: item.color }}
            onDragStart={(e) => setDragClip(e, item)}
          >
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
