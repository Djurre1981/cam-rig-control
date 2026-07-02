import type { ReactNode } from "react";
import { CollapsibleSection } from "./CollapsibleSection";
import type { ClipSelection, TimelineProject } from "../types";
import {
  axisLimitLabel,
  axisVelocityCap,
  clampAxisVelocity,
  formatAxisMaxVel,
  ROTATION_UNITS_PER_REV,
  rotationUnitsToDeg,
  usesRotationUnits,
} from "../lib/motionLimits";

type Props = {
  project: TimelineProject;
  selection: ClipSelection;
  speedPercent: number;
  onUpdateProject: (p: TimelineProject) => void;
  onDeleteSelection: () => void;
  embedded?: boolean;
  tabbed?: boolean;
};

function InspectorShell({
  embedded,
  tabbed,
  children,
}: {
  embedded?: boolean;
  tabbed?: boolean;
  children: ReactNode;
}) {
  if (embedded) {
    return (
      <div
        className={["inspector", "inspector-embedded", tabbed ? "tabbed" : ""].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    );
  }
  return <aside className="inspector">{children}</aside>;
}

export function Inspector({
  project,
  selection,
  speedPercent,
  onUpdateProject,
  onDeleteSelection,
  embedded,
  tabbed,
}: Props) {
  if (!selection) {
    const emptyBody = (
      <>
        <p className="inspector-empty">
          {tabbed
            ? "Select a clip on the timeline — then make something beautiful."
            : "Select a clip to edit its properties."}
        </p>
        {embedded ? (
          <CollapsibleSection title="Project" storageKey="insp-project" defaultOpen={false}>
            <div className="inspector-status">
              <span>{project.name}</span>
              <span>{project.duration}s</span>
              <span>{project.tracks.length} motion</span>
              <span>{project.camera_tracks.length} camera</span>
            </div>
            <details className="inspector-details">
              <summary>Axis speed limits</summary>
              <ul className="inspector-limits">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i}>{axisLimitLabel(i)}</li>
                ))}
              </ul>
            </details>
          </CollapsibleSection>
        ) : (
          <div className="inspector-meta">
            <h4>Project</h4>
            <dl>
              <dt>Name</dt>
              <dd>{project.name}</dd>
              <dt>Duration</dt>
              <dd>{project.duration}s</dd>
              <dt>Motor tracks</dt>
              <dd>{project.tracks.length}</dd>
              <dt>Camera tracks</dt>
              <dd>{project.camera_tracks.length}</dd>
            </dl>
            <h4 className="inspector-limits-title">Axis speed limits (100%)</h4>
            <ul className="inspector-limits">
              {[0, 1, 2, 3].map((i) => (
                <li key={i}>{axisLimitLabel(i)}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );

    return (
      <InspectorShell embedded={embedded} tabbed={tabbed}>
        {!tabbed && <h3>Inspector</h3>}
        {emptyBody}
      </InspectorShell>
    );
  }

  if (selection.kind === "motor") {
    const track = project.tracks.find((t) => t.id === selection.trackId);
    const clip = track?.clips.find((c) => c.id === selection.clipId);
    if (!track || !clip) return null;

    const patch = (partial: Partial<typeof clip>) => {
      const next = structuredClone(project);
      const t = next.tracks.find((x) => x.id === track.id)!;
      const c = t.clips.find((x) => x.id === clip.id)!;
      Object.assign(c, partial);
      onUpdateProject(next);
    };

    return (
      <InspectorShell embedded={embedded} tabbed={tabbed}>
        {!tabbed && <h3>Inspector</h3>}
        <p className="inspector-track" style={{ color: track.color }}>
          {track.label} · {clip.type.replace("Clip", "")}
        </p>
        <label>
          Label
          <input
            value={clip.label ?? ""}
            onChange={(e) => patch({ label: e.target.value })}
          />
        </label>
        <label>
          Start (s)
          <input
            type="number"
            step={0.25}
            min={0}
            value={clip.start}
            onChange={(e) => patch({ start: Number(e.target.value) })}
          />
        </label>
        <label>
          Duration (s)
          <input
            type="number"
            step={0.25}
            min={0.25}
            value={clip.duration}
            onChange={(e) => patch({ duration: Number(e.target.value) })}
          />
        </label>
        {clip.type === "JogClip" && (
          <label>
            Velocity (steps/s)
            <input
              type="number"
              value={clip.velocity ?? 0}
              max={axisVelocityCap(track.axis, speedPercent)}
              min={-axisVelocityCap(track.axis, speedPercent)}
              onChange={(e) =>
                patch({
                  velocity: clampAxisVelocity(
                    track.axis,
                    Number(e.target.value),
                    speedPercent
                  ),
                })
              }
            />
            <span className="field-hint">
              Max at {speedPercent}%: ±{Math.round(axisVelocityCap(track.axis, speedPercent))}{" "}
              (100% = {formatAxisMaxVel(track.axis)})
            </span>
          </label>
        )}
        {clip.type === "MoveClip" && (
          <>
            <label>
              From position
              <input
                type="number"
                value={clip.from_pos ?? 0}
                onChange={(e) => patch({ from_pos: Number(e.target.value) })}
              />
              {usesRotationUnits(track.axis) && (
                <span className="field-hint">
                  {rotationUnitsToDeg(clip.from_pos ?? 0).toFixed(1)}° · 10 units/°, {ROTATION_UNITS_PER_REV} = 360°
                </span>
              )}
            </label>
            <label>
              To position
              <input
                type="number"
                value={clip.to_pos ?? 0}
                onChange={(e) => patch({ to_pos: Number(e.target.value) })}
              />
              {usesRotationUnits(track.axis) && (
                <span className="field-hint">
                  {rotationUnitsToDeg(clip.to_pos ?? 0).toFixed(1)}° · Δ{" "}
                  {rotationUnitsToDeg((clip.to_pos ?? 0) - (clip.from_pos ?? 0)).toFixed(1)}°
                </span>
              )}
            </label>
          </>
        )}
        <button type="button" className="btn-danger" onClick={onDeleteSelection}>
          Delete clip
        </button>
      </InspectorShell>
    );
  }

  const track = project.camera_tracks.find((t) => t.id === selection.trackId);
  const clip = track?.clips.find((c) => c.id === selection.clipId);
  if (!track || !clip) return null;

  const patch = (partial: Partial<typeof clip>) => {
    const next = structuredClone(project);
    const t = next.camera_tracks.find((x) => x.id === track.id)!;
    const c = t.clips.find((x) => x.id === clip.id)!;
    Object.assign(c, partial);
    onUpdateProject(next);
  };

  return (
    <InspectorShell embedded={embedded} tabbed={tabbed}>
      {!tabbed && <h3>Inspector</h3>}
      <p className="inspector-track" style={{ color: track.color }}>
        {track.label} · {clip.type.replace("Clip", "")}
      </p>
      <label>
        Start (s)
        <input
          type="number"
          step={0.25}
          min={0}
          value={clip.start}
          onChange={(e) => patch({ start: Number(e.target.value) })}
        />
      </label>
      <label>
        Duration (s)
        <input
          type="number"
          step={0.25}
          min={0.1}
          value={clip.duration}
          onChange={(e) => patch({ duration: Number(e.target.value) })}
        />
      </label>
      {clip.type === "ZoomClip" && (
        <>
          <label>
            From zoom
            <input
              type="number"
              step={0.1}
              value={clip.from_zoom ?? 1}
              onChange={(e) => patch({ from_zoom: Number(e.target.value) })}
            />
          </label>
          <label>
            To zoom
            <input
              type="number"
              step={0.1}
              value={clip.to_zoom ?? 1}
              onChange={(e) => patch({ to_zoom: Number(e.target.value) })}
            />
          </label>
        </>
      )}
      {clip.type === "RecordClip" && (
        <label>
          Action
          <select
            value={clip.action ?? "start"}
            onChange={(e) => patch({ action: e.target.value })}
          >
            <option value="start">Start recording</option>
            <option value="stop">Stop recording</option>
          </select>
        </label>
      )}
      <button type="button" className="btn-danger" onClick={onDeleteSelection}>
        Delete clip
      </button>
    </InspectorShell>
  );
}
