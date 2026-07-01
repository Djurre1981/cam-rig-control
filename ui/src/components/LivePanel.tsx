import { AXIS_LABELS } from "../types";

type Props = {
  velocities: number[];
  onVelocityChange: (axis: number, value: number) => void;
  onStopAll: () => void;
  recording: boolean;
  onToggleRecord: () => void;
  demoMode: boolean;
};

export function LivePanel({
  velocities,
  onVelocityChange,
  onStopAll,
  recording,
  onToggleRecord,
  demoMode,
}: Props) {
  return (
    <section className="live-panel">
      <div className="live-header">
        <h2>Live control</h2>
        {demoMode && <span className="demo-pill">Demo — no hardware</span>}
      </div>
      <p className="live-hint">
        Drag sliders or use a gamepad (planned). Values map to motor velocity in steps/s.
      </p>
      <div className="live-grid">
        {AXIS_LABELS.map((label, i) => (
          <div key={label} className="live-axis" data-axis={label.toLowerCase()}>
            <div className="live-axis-header">
              <span className="live-axis-name">{label}</span>
              <span className="live-axis-value">{velocities[i]}</span>
            </div>
            <input
              type="range"
              className="live-slider"
              min={-500}
              max={500}
              value={velocities[i]}
              onChange={(e) => onVelocityChange(i, Number(e.target.value))}
            />
            <div className="live-axis-labels">
              <span>−</span>
              <span>0</span>
              <span>+</span>
            </div>
          </div>
        ))}
      </div>
      <div className="live-actions">
        <button
          type="button"
          className={`btn-record ${recording ? "active" : ""}`}
          onClick={onToggleRecord}
        >
          {recording ? "● Recording…" : "● Record motion"}
        </button>
        <button type="button" className="btn-danger" onClick={onStopAll}>
          Stop all axes
        </button>
      </div>
      <div className="gamepad-placeholder">
        <span>Gamepad layout (planned)</span>
        <div className="gamepad-visual">
          <div className="stick">L: Boom / Swing</div>
          <div className="stick">R: Yaw / Pitch</div>
        </div>
      </div>
    </section>
  );
}
