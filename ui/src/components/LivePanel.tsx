import { CollapsibleSection } from "./CollapsibleSection";
import { AXIS_LABELS } from "../types";
import { axisVelocityCap } from "../lib/motionLimits";
import {
  axisRadians,
  formatAxisRotation,
  formatZoomReadout,
  zoomVelocityCap,
  type TargetLockMode,
} from "../lib/liveMotion";
import type { RigPose } from "../lib/rigKinematics";

type Props = {
  pose: RigPose;
  velocities: number[];
  zoomVelocity: number;
  speedPercent: number;
  targetLock: TargetLockMode;
  onTargetLockChange: (mode: TargetLockMode) => void;
  onSpeedPercentChange: (pct: number) => void;
  onVelocityChange: (axis: number, value: number) => void;
  onZoomVelocityChange: (value: number) => void;
  onAxisStop: (axis: number) => void;
  onZoomStop: () => void;
  onAxisHome: (axis: number) => void;
  onZoomHome: () => void;
  onHomeAll: () => void;
  demoMode: boolean;
  embedded?: boolean;
  tabbed?: boolean;
};

export function LivePanel({
  pose,
  velocities,
  zoomVelocity,
  speedPercent,
  targetLock,
  onTargetLockChange,
  onSpeedPercentChange,
  onVelocityChange,
  onZoomVelocityChange,
  onAxisStop,
  onZoomStop,
  onAxisHome,
  onZoomHome,
  onHomeAll,
  demoMode,
  embedded,
  tabbed,
}: Props) {
  const zoomCap = zoomVelocityCap(speedPercent);
  const zoomPct = zoomCap > 0 ? Math.round((zoomVelocity / zoomCap) * 100) : 0;
  const zoomReadout = formatZoomReadout(pose.zoom);
  const lockBadge = targetLock === "off" ? undefined : targetLock === "on" ? "lock" : "smooth";

  const axesGrid = (
    <div className="live-grid">
      {AXIS_LABELS.map((label, i) => {
        const cap = axisVelocityCap(i, speedPercent);
        const steps = velocities[i];
        const pct = cap > 0 ? Math.round((steps / cap) * 100) : 0;
        const rad = axisRadians(pose, i);
        const rotation = formatAxisRotation(i, rad, pose);
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
            {!embedded && (
              <div className="live-axis-footer">
                <span className="live-axis-velocity">
                  {pct >= 0 ? "+" : ""}
                  {pct}% · {Math.round(steps)} steps/s
                </span>
              </div>
            )}
          </div>
        );
      })}
      <div className="live-axis live-axis-zoom" data-axis="zoom">
        <div className="live-axis-header">
          <div className="live-axis-title">
            <button
              type="button"
              className="live-axis-home"
              title="Return to 1× zoom at max speed"
              aria-label="Zoom home"
              onClick={onZoomHome}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.2 6 5.4V18h-2v-6H8v6H6v-7.4l6-5.4z"
                />
              </svg>
            </button>
            <span className="live-axis-name">Zoom</span>
          </div>
          <span className="live-axis-rotation" title="Current zoom">
            {zoomReadout.display}
          </span>
        </div>
        <input
          type="range"
          className="live-slider"
          min={-100}
          max={100}
          value={zoomPct}
          title="Right-click to stop"
          onContextMenu={(e) => {
            e.preventDefault();
            onZoomStop();
          }}
          onChange={(e) => {
            const p = Number(e.target.value);
            onZoomVelocityChange((p / 100) * zoomCap);
          }}
        />
        {!embedded && (
          <div className="live-axis-footer">
            <span className="live-axis-velocity">
              {zoomPct >= 0 ? "+" : ""}
              {zoomPct}% · {zoomVelocity.toFixed(2)}×/s
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const aimBlock = (
    <>
      <div className="live-lock-row">
        <button
          type="button"
          className={["btn-target-lock", targetLock === "on" ? "active" : ""].filter(Boolean).join(" ")}
          aria-pressed={targetLock === "on"}
          title="Keep the target centered; other axes auto-aim (may lag at speed limits)"
          onClick={() => onTargetLockChange(targetLock === "on" ? "off" : "on")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {embedded ? "Lock" : "Target lock"}
        </button>
        <button
          type="button"
          className={["btn-target-lock", targetLock === "smooth" ? "active" : ""].filter(Boolean).join(" ")}
          aria-pressed={targetLock === "smooth"}
          title="Keep the target centered; slow driven axes so lock is never lost"
          onClick={() => onTargetLockChange(targetLock === "smooth" ? "off" : "smooth")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          {embedded ? "Smooth" : "Smooth target lock"}
        </button>
      </div>
      <div className="live-actions">
        <button
          type="button"
          className="btn-home-all btn-compact btn-joy"
          title="Everyone back to base camp"
          onClick={onHomeAll}
        >
          Home all
        </button>
      </div>
    </>
  );

  return (
    <section className={["live-panel", embedded ? "embedded" : "", tabbed ? "tabbed" : ""].filter(Boolean).join(" ")}>
      {!tabbed && (
        <div className="live-header">
          <h3>Live control</h3>
          {demoMode && <span className="demo-pill">Demo</span>}
        </div>
      )}
      {tabbed && (
        <div className="live-tab-banner">
          {demoMode && <span className="demo-pill">Demo</span>}
          <span className="live-tab-hint">Right-click slider to stop · transport sets max speed</span>
        </div>
      )}
      {!embedded && (
        <p className="live-hint">
          Sliders jog velocity; readout shows integrated rotation at playhead base.
        </p>
      )}
      {!embedded && (
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
      )}

      {tabbed ? (
        <>
          <CollapsibleSection title="Jog axes" storageKey="live-axes" defaultOpen badge="5">
            {axesGrid}
          </CollapsibleSection>
          <CollapsibleSection title="Aim & home" storageKey="live-aim" defaultOpen badge={lockBadge}>
            {aimBlock}
          </CollapsibleSection>
        </>
      ) : (
        <>
          {axesGrid}
          {aimBlock}
        </>
      )}

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
