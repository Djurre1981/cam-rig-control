import { DEFAULT_SHORTCUTS, SHORTCUT_LABELS, type ShortcutAction } from "../lib/shortcutMap";

type Props = {
  onBack: () => void;
};

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    body: `Cam Rig Control is a motion-control workspace for the DIW camera rig. It combines timeline authoring, live jog, dual 3D/camera previews, focus planning, and animation libraries — styled for tactical telemetry operation.`,
    img: "/docs/overview.png",
  },
  {
    id: "animations",
    title: "Animations",
    body: `The left sidebar lists built-in and user animations. Select one to load its timeline. Use New, Save, and Save As to manage projects. Ten built-in sequences ship with the app (demo orbit, slow swing, reveal rise, timelapse sweep, and more).`,
    img: "/docs/animations.png",
  },
  {
    id: "poses",
    title: "Named poses",
    body: `Store and recall rig poses from the Poses section. Ten built-in poses cover common framings (home master, low hero, orbit left/right, macro close, etc.). Click a pose to snap the live rig; use Store to save the current live pose.`,
    img: "/docs/poses.png",
  },
  {
    id: "motions",
    title: "Motion palette",
    body: `Drag motion clips from the palette onto timeline tracks, or click an empty lane to place the selected item. Motor clips support direction toggles and speed curves.`,
    img: "/docs/motions.png",
  },
  {
    id: "previews",
    title: "3D & camera previews",
    body: `3D preview: MMB orbit, RMB pan, wheel zoom. Camera view: lens POV with optional virtual horizon. Enable Move target in Live → Aim & home, then LMB-drag the reference subject on the ground in either preview.`,
    img: "/docs/previews.png",
  },
  {
    id: "onion",
    title: "Onion skin",
    body: `View → Onion skin ghosts overlays previous/next timeline poses in the camera view (±0.5 s by default) so you can judge motion delta while framing.`,
    img: "/docs/onion.png",
  },
  {
    id: "transport",
    title: "Transport & recording",
    body: `Play, pause, stop, and scrub the timeline. The ● button records live jog motion into RecordedClip blocks on motor tracks (teach mode). Max speed caps all axis velocities.`,
    img: "/docs/transport.png",
  },
  {
    id: "timeline",
    title: "Timeline",
    body: `Chain-based editing: clips pack contiguously. Resize, move, snap (0.25 s), zoom/fit, and edit speed envelopes on motor clips. Right-click removes clips.`,
    img: "/docs/timeline.png",
  },
  {
    id: "live",
    title: "Live control",
    body: `Jog all four axes plus zoom from the Live tab. Target lock keeps the aim point centered; Smooth lock throttles driven axes. Focus calibration matches model distance to a tape measure at home.`,
    img: "/docs/live.png",
  },
  {
    id: "input",
    title: "Keyboard & gamepad",
    body: `Space play/pause · ←/→ step 0.25 s · R toggle record · H home all · Delete removes selection · Ctrl+S save. Enable gamepad in Live → Input for stick jog (L: boom/swing, R: yaw/pitch, triggers: zoom).`,
    img: "/docs/input.png",
  },
  {
    id: "view",
    title: "View menu",
    body: `Toggle sidebars, previews, transport, scrub section, per-track lanes, virtual horizon, and onion skin. Layout persists in localStorage.`,
    img: "/docs/view.png",
  },
  {
    id: "inspector",
    title: "Inspector",
    body: `Select a timeline clip to edit label, timing, velocity, zoom range, or record action. Project metadata appears when nothing is selected.`,
    img: "/docs/inspector.png",
  },
  {
    id: "workspace",
    title: "Workspace layout",
    body: `Left sidebar order: Animations (projects) → Poses (spatial bookmarks) → Motions (clip palette). Center: dual previews over timeline stack (transport → effectors → lanes). Right: Live tab for real-time control and Input; Inspector for clip properties. Header: Docs + View menu. This groups authoring (left), monitoring (center), and operation (right).`,
    img: "/docs/overview.png",
  },
] as const;

export function DocsPage({ onBack }: Props) {
  return (
    <div className="docs-page">
      <header className="docs-header">
        <button type="button" className="btn-compact" onClick={onBack}>
          ← Back to editor
        </button>
        <h1>Cam Rig Control — Documentation</h1>
        <p className="docs-sub">v0.2 · DIW rig motion workspace</p>
      </header>

      <nav className="docs-toc" aria-label="Contents">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            {s.title}
          </a>
        ))}
        <hr />
        <div className="docs-shortcuts">
          <strong>Shortcuts</strong>
          {(Object.keys(DEFAULT_SHORTCUTS) as ShortcutAction[]).map((k) => (
            <div key={k} className="docs-shortcut-row">
              <kbd>{DEFAULT_SHORTCUTS[k]}</kbd>
              <span>{SHORTCUT_LABELS[k]}</span>
            </div>
          ))}
        </div>
      </nav>

      <main className="docs-main">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="docs-section">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
            <figure className="docs-figure">
              <img src={s.img} alt={`Screenshot: ${s.title}`} loading="lazy" />
              <figcaption>{s.title}</figcaption>
            </figure>
          </section>
        ))}
      </main>
    </div>
  );
}
