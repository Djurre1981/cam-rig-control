import type { DragEvent } from "react";
import type { CSSProperties } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
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
  compact?: boolean;
};

function PaletteTile({
  item,
  selected,
  onSelect,
}: {
  item: PaletteItem;
  selected: boolean;
  onSelect: (item: PaletteItem) => void;
}) {
  return (
    <div
      className={`palette-item ${selected ? "selected" : ""}`}
      draggable
      style={{ "--palette-accent": item.color } as CSSProperties}
      onClick={() => onSelect(item)}
      onDragStart={(e) => {
        onSelect(item);
        setDragClip(e, item);
      }}
      title={item.description}
    >
      <span className="palette-item-swatch" aria-hidden />
      <span className="palette-item-text">
        <strong>{item.label}</strong>
        <small>{item.description}</small>
      </span>
    </div>
  );
}

export function ClipPalette({ items, selectedId, onSelect, compact }: Props) {
  const motor = items.filter((i) => i.target === "motor");
  const camera = items.filter((i) => i.target !== "motor");

  const motorGrid = (
    <div className="palette-grid">
      {motor.map((item) => (
        <PaletteTile
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );

  const cameraGrid = (
    <div className="palette-grid palette-grid-camera">
      {camera.map((item) => (
        <PaletteTile
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="clip-palette compact">
        <p className="palette-hint">Drag to timeline · click track to place</p>
        <CollapsibleSection title="Axis" storageKey="palette-axis" defaultOpen badge={`${motor.length}`}>
          {motorGrid}
        </CollapsibleSection>
        <CollapsibleSection title="Camera" storageKey="palette-camera" defaultOpen badge={`${camera.length}`}>
          {cameraGrid}
        </CollapsibleSection>
      </div>
    );
  }

  return (
    <div className="clip-palette">
      <h3>Motions</h3>
      <p className="palette-hint">
        Select or drag onto timeline · click empty track to place · right-click clip to remove
      </p>
      <div className="palette-group">
        <span className="palette-group-label">Axis motion (4 tracks)</span>
        {motorGrid}
      </div>
      <div className="palette-group">
        <span className="palette-group-label">Camera (ZV-1 II)</span>
        {cameraGrid}
      </div>
    </div>
  );
}
