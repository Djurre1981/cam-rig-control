import { useEffect, useRef, useState } from "react";
import type { TimelineProject } from "../types";
import type { ViewLayout } from "../lib/viewLayout";

type Props = {
  layout: ViewLayout;
  project: TimelineProject;
  onChange: (next: ViewLayout) => void;
};

type MenuItem =
  | { kind: "toggle"; key: keyof Omit<ViewLayout, "timelineTracks">; label: string; indent?: boolean }
  | { kind: "sep" }
  | { kind: "track"; trackId: string; label: string; section?: string };

function buildItems(project: TimelineProject): MenuItem[] {
  const items: MenuItem[] = [
    { kind: "toggle", key: "leftSidebar", label: "Left sidebar" },
    { kind: "toggle", key: "rigPreview", label: "3D preview" },
    { kind: "toggle", key: "cameraView", label: "Camera view" },
    { kind: "toggle", key: "cameraHorizon", label: "Virtual horizon", indent: true },
    { kind: "toggle", key: "inspector", label: "Right sidebar" },
    { kind: "sep" },
    { kind: "toggle", key: "transport", label: "Play / pause & time" },
    { kind: "toggle", key: "scrubSection", label: "Scrub section" },
    { kind: "sep" },
  ];

  for (const track of project.tracks) {
    items.push({ kind: "track", trackId: track.id, label: track.label, section: "Motion tracks" });
  }
  for (const track of project.camera_tracks) {
    items.push({ kind: "track", trackId: track.id, label: track.label, section: "Camera tracks" });
  }
  return items;
}

export function ViewMenu({ layout, project, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const items = buildItems(project);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const setToggle = (key: keyof Omit<ViewLayout, "timelineTracks">, checked: boolean) => {
    onChange({ ...layout, [key]: checked });
  };

  const setTrack = (trackId: string, visible: boolean) => {
    onChange({
      ...layout,
      timelineTracks: { ...layout.timelineTracks, [trackId]: visible },
    });
  };

  let lastSection: string | undefined;

  return (
    <div className="view-menu" ref={rootRef}>
      <button
        type="button"
        className={`view-menu-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        View
      </button>
      {open && (
        <div className="view-menu-panel" role="menu">
          {items.map((item, i) => {
            if (item.kind === "sep") {
              return <div key={`sep-${i}`} className="view-menu-sep" role="separator" />;
            }
            if (item.kind === "toggle") {
              return (
                <label
                  key={item.key}
                  className={["view-menu-item", item.indent ? "view-menu-item-indent" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  role="menuitemcheckbox"
                >
                  <input
                    type="checkbox"
                    checked={layout[item.key]}
                    onChange={(e) => setToggle(item.key, e.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>
              );
            }

            const section = item.section;
            const showSection = section && section !== lastSection;
            if (showSection) lastSection = section;

            return (
              <div key={item.trackId}>
                {showSection && <div className="view-menu-section">{section}</div>}
                <label className="view-menu-item view-menu-item-indent" role="menuitemcheckbox">
                  <input
                    type="checkbox"
                    checked={layout.timelineTracks[item.trackId] !== false}
                    onChange={(e) => setTrack(item.trackId, e.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
