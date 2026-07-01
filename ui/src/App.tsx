import { useCallback, useState } from "react";
import { ClipPalette } from "./components/ClipPalette";
import { EffectorBar } from "./components/EffectorBar";
import { Inspector } from "./components/Inspector";
import { LivePanel } from "./components/LivePanel";
import { PresetSidebar } from "./components/PresetSidebar";
import { RigPreview } from "./components/RigPreview";
import { TimelineEditor } from "./components/TimelineEditor";
import { TransportBar } from "./components/TransportBar";
import { WorkspaceResizer } from "./components/WorkspaceResizer";
import { CLIP_PALETTE } from "./data/palette";
import demoShowcase from "./data/demo_showcase.json";
import exampleSlowSwing from "./data/example_slow_swing.json";
import { usePlayback } from "./hooks/usePlayback";
import { defaultSpeedCurve } from "./lib/speedCurve";
import { packClipStarts } from "./lib/timelineTrackChain";
import { MOTOR_TRACK_COLORS, type ClipSelection, type TimelineProject } from "./types";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";

function normalizeProject(raw: TimelineProject): TimelineProject {
  const p = structuredClone(raw) as TimelineProject;
  p.tracks = p.tracks.map((t, i) => ({
    ...t,
    color: t.color ?? MOTOR_TRACK_COLORS[i],
    clips: packClipStarts(
      t.clips.map((c) => ({
        ...c,
        id: c.id ?? `legacy_${Math.random()}`,
        speed_curve: c.speed_curve ?? defaultSpeedCurve(c.type),
      }))
    ),
  }));
  p.camera_tracks = (p.camera_tracks ?? []).map((t) => ({
    ...t,
    clips: packClipStarts(
      t.clips.map((c) => ({ ...c, id: c.id ?? `legacy_${Math.random()}` }))
    ),
  }));
  return p;
}

const PRESETS: Record<string, TimelineProject> = {
  demo: normalizeProject(demoShowcase as TimelineProject),
  slow_swing: normalizeProject(exampleSlowSwing as TimelineProject),
  blank: normalizeProject({
    version: 1,
    name: "Empty 30s",
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
  }),
};

type View = "timeline" | "live";

export default function App() {
  const [view, setView] = useState<View>("timeline");
  const [project, setProject] = useState<TimelineProject>(PRESETS.demo);
  const [selection, setSelection] = useState<ClipSelection>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [liveRecording, setLiveRecording] = useState(false);
  const [velocities, setVelocities] = useState([0, 0, 0, 0]);
  const [speedPercent, setSpeedPercent] = useState(100);
  const [activePaletteItem, setActivePaletteItem] = useState(
    () => CLIP_PALETTE.find((p) => p.id === "move") ?? CLIP_PALETTE[0]
  );

  const { playing, playhead, play, pause, stop, scrub } = usePlayback(project.duration);

  const deleteSelection = useCallback(() => {
    if (!selection) return;
    const next = structuredClone(project);
    if (selection.kind === "motor") {
      const track = next.tracks.find((t) => t.id === selection.trackId);
      if (track) track.clips = track.clips.filter((c) => c.id !== selection.clipId);
    } else {
      const track = next.camera_tracks.find((t) => t.id === selection.trackId);
      if (track) track.clips = track.clips.filter((c) => c.id !== selection.clipId);
    }
    setProject(next);
    setSelection(null);
  }, [selection, project]);

  const loadPreset = (id: string) => {
    const p = PRESETS[id];
    if (p) {
      setProject(structuredClone(p));
      setSelection(null);
      stop();
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <h1>Cam Rig Control</h1>
          <span className="project-name">{project.name}</span>
        </div>
        {DEMO_MODE && (
          <span className="demo-banner" title="No connection to Pi or Mega">
            Demo mode — UI preview
          </span>
        )}
        <nav className="view-tabs">
          <button
            type="button"
            className={view === "timeline" ? "active" : ""}
            onClick={() => setView("timeline")}
          >
            Timeline
          </button>
          <button
            type="button"
            className={view === "live" ? "active" : ""}
            onClick={() => setView("live")}
          >
            Live
          </button>
        </nav>
      </header>

      {view === "timeline" && (
        <div className="workspace timeline-workspace">
          <div className="workspace-left">
            <PresetSidebar projectName={project.name} onSelectPreset={loadPreset} />
            <ClipPalette
              items={CLIP_PALETTE}
              selectedId={activePaletteItem?.id ?? null}
              onSelect={setActivePaletteItem}
            />
          </div>

          <main className="workspace-center">
            <WorkspaceResizer>
              {[
                <div key="preview" className="center-preview-row">
                  <RigPreview
                    project={project}
                    playhead={playhead}
                    speedPercent={speedPercent}
                    docked
                  />
                </div>,
                <div key="timeline-stack" className="timeline-stack">
                  <TransportBar
                    playhead={playhead}
                    duration={project.duration}
                    playing={playing}
                    speedPercent={speedPercent}
                    onPlay={play}
                    onPause={pause}
                    onStop={stop}
                    onSpeedPercentChange={setSpeedPercent}
                  />
                  <EffectorBar
                    project={project}
                    playhead={playhead}
                    playing={playing}
                    speedPercent={speedPercent}
                  />
                  <TimelineEditor
                    project={project}
                    playhead={playhead}
                    selection={selection}
                    snapEnabled={snapEnabled}
                    activePaletteItem={activePaletteItem}
                    onSnapToggle={setSnapEnabled}
                    onProjectChange={setProject}
                    onSelect={setSelection}
                    onSeek={scrub}
                  />
                </div>,
              ]}
            </WorkspaceResizer>
          </main>

          <Inspector
            project={project}
            selection={selection}
            speedPercent={speedPercent}
            onUpdateProject={setProject}
            onDeleteSelection={deleteSelection}
          />
        </div>
      )}

      {view === "live" && (
        <div className="live-workspace">
          <RigPreview
            project={project}
            playhead={playhead}
            speedPercent={speedPercent}
            liveVelocities={velocities}
            compact
          />
          <LivePanel
            velocities={velocities}
            speedPercent={speedPercent}
            onSpeedPercentChange={setSpeedPercent}
            onVelocityChange={(axis, v) => {
              const next = [...velocities];
              next[axis] = v;
              setVelocities(next);
            }}
            onStopAll={() => setVelocities([0, 0, 0, 0])}
            recording={liveRecording}
            onToggleRecord={() => setLiveRecording((r) => !r)}
            demoMode={DEMO_MODE}
          />
        </div>
      )}

      <footer className="app-footer">
        <span>
          Design refs:{" "}
          <a href="https://github.com/EvanBottango/Bottango" target="_blank" rel="noreferrer">
            Bottango
          </a>
          ,{" "}
          <a href="https://www.dragonframe.com/dragonframe-software/" target="_blank" rel="noreferrer">
            Dragonframe Arc
          </a>
        </span>
        <span>v0.2 demo · {project.duration}s timeline</span>
      </footer>
    </div>
  );
}
