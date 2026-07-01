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
  selectedId: string | null;
  onSelect: (item: PaletteItem) => void;
};

export function ClipPalette({ items, selectedId, onSelect }: Props) {
  const motor = items.filter((i) => i.target === "motor");
  const camera = items.filter((i) => i.target !== "motor");

  return (
    <div className="clip-palette">
      <h3>Motions</h3>
      <p className="palette-hint">
        Select or drag onto timeline · click empty track to place · right-click clip to remove
      </p>
      <div className="palette-group">
        <span className="palette-group-label">Axis motion (4 tracks)</span>
        {motor.map((item) => (
          <div
            key={item.id}
            className={`palette-item ${selectedId === item.id ? "selected" : ""}`}
            draggable
            style={{ borderLeftColor: item.color }}
            onClick={() => onSelect(item)}
            onDragStart={(e) => {
              onSelect(item);
              setDragClip(e, item);
            }}
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
            className={`palette-item ${selectedId === item.id ? "selected" : ""}`}
            draggable
            style={{ borderLeftColor: item.color }}
            onClick={() => onSelect(item)}
            onDragStart={(e) => {
              onSelect(item);
              setDragClip(e, item);
            }}
          >
            <strong>{item.label}</strong>
            <small>{item.description}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
