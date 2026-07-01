import { AXIS_LABELS } from "../types";
import { axisVelocityCap } from "../lib/motionLimits";

type Props = {
  velocities: number[];
  speedPercent: number;
  onSpeedPercentChange: (pct: number) => void;
  onVelocityChange: (axis: number, value: number) => void;
  onStopAll: () => void;
  recording: boolean;
  onToggleRecord: () => void;
  demoMode: boolean;
};

export function LivePanel({
  velocities,
  speedPercent,
  onSpeedPercentChange,
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
        Sliders set velocity as % of axis max. Global cap:
      </p>
      <label className="live-speed-cap">
        <span>Max speed {speedPercent}%</span>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={speedPercent}
          onChange={(e) => onSpeedPercentChange(Number(e.target.value))}
        />
      </label>
      <div className="live-grid">
        {AXIS_LABELS.map((label, i) => {
          const cap = axisVelocityCap(i, speedPercent);
          const steps = velocities[i];
          const pct = cap > 0 ? Math.round((steps / cap) * 100) : 0;
          return (
            <div key={label} className="live-axis" data-axis={label.toLowerCase()}>
              <div className="live-axis-header">
                <span className="live-axis-name">{label}</span>
                <span className="live-axis-value">
                  {pct}% <span className="live-axis-steps">({Math.round(steps)} steps/s)</span>
                </span>
              </div>
              <input
                type="range"
                className="live-slider"
                min={-100}
                max={100}
                value={pct}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  onVelocityChange(i, (p / 100) * cap);
                }}
              />
              <div className="live-axis-labels">
                <span>−100%</span>
                <span>0</span>
                <span>+100%</span>
              </div>
            </div>
          );
        })}
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
