import type { ClipSelection, TimelineProject } from "../types";

type Props = {
  project: TimelineProject;
  selection: ClipSelection;
  onUpdateProject: (p: TimelineProject) => void;
  onDeleteSelection: () => void;
};

export function Inspector({
  project,
  selection,
  onUpdateProject,
  onDeleteSelection,
}: Props) {
  if (!selection) {
    return (
      <aside className="inspector">
        <h3>Inspector</h3>
        <p className="inspector-empty">Select a clip to edit its properties.</p>
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
        </div>
      </aside>
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
      <aside className="inspector">
        <h3>Inspector</h3>
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
              onChange={(e) => patch({ velocity: Number(e.target.value) })}
            />
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
            </label>
            <label>
              To position
              <input
                type="number"
                value={clip.to_pos ?? 0}
                onChange={(e) => patch({ to_pos: Number(e.target.value) })}
              />
            </label>
          </>
        )}
        <button type="button" className="btn-danger" onClick={onDeleteSelection}>
          Delete clip
        </button>
      </aside>
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
    <aside className="inspector">
      <h3>Inspector</h3>
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
    </aside>
  );
}
