import { AXIS_LABELS, MOTOR_TRACK_COLORS } from "../types";
import { axisVelocityCap } from "../lib/motionLimits";
import { axisRadians, formatAxisRotation } from "../lib/liveMotion";
import type { RigPose } from "../lib/rigKinematics";

type Props = {
  pose: RigPose;
  velocities: number[];
  speedPercent: number;
  onSpeedPercentChange: (pct: number) => void;
  onVelocityChange: (axis: number, value: number) => void;
  onAxisStop: (axis: number) => void;
  onAxisHome: (axis: number) => void;
  onStopAll: () => void;
  recording: boolean;
  onToggleRecord: () => void;
  demoMode: boolean;
  /** Compact layout for the right sidebar column. */
  embedded?: boolean;
};

export function LivePanel({
  pose,
  velocities,
  speedPercent,
  onSpeedPercentChange,
  onVelocityChange,
  onAxisStop,
  onAxisHome,
  onStopAll,
  recording,
  onToggleRecord,
  demoMode,
  embedded,
}: Props) {
  return (
    <section className={["live-panel", embedded ? "embedded" : ""].filter(Boolean).join(" ")}>
      <div className="live-header">
        <h3>Live control</h3>
        {demoMode && <span className="demo-pill">Demo</span>}
      </div>
      {!embedded && (
        <p className="live-hint">
          Sliders jog velocity; readout shows integrated rotation at playhead base.
        </p>
      )}
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
          const rad = axisRadians(pose, i);
          const rotation = formatAxisRotation(i, rad);
          return (
            <div key={label} className="live-axis" data-axis={label.toLowerCase()}>
              <div className="live-axis-header">
                <div className="live-axis-title">
                  <button
                    type="button"
                    className="live-axis-home"
                    title="Return to home position at max speed"
                    aria-label={`${label} home`}
                    onClick={() => onAxisHome(i)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                      <path
                        fill="currentColor"
                        d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.2 6 5.4V18h-2v-6H8v6H6v-7.4l6-5.4z"
                      />
                    </svg>
                  </button>
                  <span className="live-axis-name">{label}</span>
                </div>
                <span className="live-axis-rotation" title="Current rotation">
                  {rotation.display}
                  {rotation.units != null && (
                    <span className="live-axis-units"> · {rotation.units} u</span>
                  )}
                </span>
              </div>
              <div className="live-axis-meter" aria-hidden>
                <div
                  className="live-axis-meter-fill"
                  style={{
                    width: `${rotation.movement * 100}%`,
                    background: MOTOR_TRACK_COLORS[i],
                  }}
                />
              </div>
              <input
                type="range"
                className="live-slider"
                min={-100}
                max={100}
                value={pct}
                title="Right-click to stop"
                onContextMenu={(e) => {
                  e.preventDefault();
                  onAxisStop(i);
                }}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  onVelocityChange(i, (p / 100) * cap);
                }}
              />
              <div className="live-axis-footer">
                <span className="live-axis-velocity">
                  {pct >= 0 ? "+" : ""}
                  {pct}% · {Math.round(steps)} steps/s
                </span>
                <span className="live-axis-labels">
                  <span>−</span>
                  <span>0</span>
                  <span>+</span>
                </span>
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
          {recording ? "● Recording…" : "● Record"}
        </button>
        <button type="button" className="btn-danger btn-compact" onClick={onStopAll}>
          Stop all
        </button>
      </div>
      {!embedded && (
      <div className="gamepad-placeholder">
        <span>Gamepad layout (planned)</span>
        <div className="gamepad-visual">
          <div className="stick">L: Boom / Swing</div>
          <div className="stick">R: Yaw / Pitch</div>
        </div>
      </div>
      )}
    </section>
  );
}
