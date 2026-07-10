import { CollapsibleSection } from "./CollapsibleSection";
import { FocusDistanceBadge } from "./FocusDistanceBadge";
import { AXIS_LABELS } from "../types";
import { axisVelocityCap } from "../lib/motionLimits";
import {
  axisRadians,
  formatAxisRotation,
  formatZoomReadout,
  zoomVelocityCap,
  type TargetLockMode,
} from "../lib/liveMotion";
import {
  computedDistanceAtHome,
  focusDistanceAtPose,
  focusFollowHint,
  formatDeltaM,
  type FocusCalibration,
} from "../lib/focusCalibration";
import { formatFocusDiopters, formatFocusDistance, formatMountToLensOffsets } from "../lib/rigFocus";
import { formatSubjectAim, type SubjectAimPoint } from "../lib/subjectTarget";
import type { RigPose } from "../lib/rigKinematics";

type Props = {
  pose: RigPose;
  velocities: number[];
  zoomVelocity: number;
  speedPercent: number;
  targetLock: TargetLockMode;
  calibration: FocusCalibration;
  focusFollow: boolean;
  onMeasuredHomeChange: (metres: number | null) => void;
  onClearCalibration: () => void;
  onFocusFollowChange: (on: boolean) => void;
  onTargetLockChange: (mode: TargetLockMode) => void;
  subjectAimPoint: SubjectAimPoint;
  moveTargetEnabled: boolean;
  onMoveTargetEnabledChange: (on: boolean) => void;
  onResetSubjectAim: () => void;
  gamepadEnabled: boolean;
  onGamepadEnabledChange: (on: boolean) => void;
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
  calibration,
  focusFollow,
  onMeasuredHomeChange,
  onClearCalibration,
  onFocusFollowChange,
  onTargetLockChange,
  subjectAimPoint,
  moveTargetEnabled,
  onMoveTargetEnabledChange,
  onResetSubjectAim,
  gamepadEnabled,
  onGamepadEnabledChange,
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
  const focusState = focusDistanceAtPose(pose, calibration, subjectAimPoint);
  const followHint = focusFollow ? focusFollowHint(focusState.deltaFromHomeM) : null;
  const lockBadge = targetLock === "off" ? undefined : targetLock === "on" ? "lock" : "smooth";
  const homeComputed = computedDistanceAtHome(subjectAimPoint);
  const measuredInput =
    calibration.measuredHomeM != null ? String(calibration.measuredHomeM) : "";

  const focusBlock = (
    <div className="focus-panel">
      <div className="focus-live-readout">
        <FocusDistanceBadge pose={pose} calibration={calibration} focusFollow={focusFollow} />
        <p className="focus-live-caption">Lens → home subject (updates as you jog)</p>
      </div>

      <div className="focus-calibration-grid">
        <label className="focus-cal-label">
          <span>Model at home</span>
          <output>{formatFocusDistance(homeComputed)}</output>
        </label>
        <label className="focus-cal-label">
          <span>Tape measure at home (m)</span>
          <input
            type="number"
            className="focus-cal-input"
            min={0.1}
            max={50}
            step={0.01}
            placeholder={homeComputed.toFixed(2)}
            value={measuredInput}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (!v) {
                onClearCalibration();
                return;
              }
              const n = Number(v);
              if (Number.isFinite(n) && n > 0) onMeasuredHomeChange(n);
            }}
          />
        </label>
      </div>

      <div className="focus-cal-actions">
        <button
          type="button"
          className="btn-compact"
          title="Use current model distance at home as calibration reference"
          onClick={() => onMeasuredHomeChange(homeComputed)}
        >
          Use model distance
        </button>
        {calibration.measuredHomeM != null && (
          <button type="button" className="btn-compact btn-muted" onClick={onClearCalibration}>
            Clear calibration
          </button>
        )}
      </div>

      {focusState.calibrated && (
        <p className="focus-cal-status">
          Scale ×{focusState.scale.toFixed(3)} · model now{" "}
          {formatFocusDistance(focusState.computedM)} → subject{" "}
          {formatFocusDistance(focusState.subjectM)} ({formatFocusDiopters(focusState.subjectM)})
        </p>
      )}

      <label className="focus-follow-toggle">
        <input
          type="checkbox"
          checked={focusFollow}
          onChange={(e) => onFocusFollowChange(e.target.checked)}
        />
        <span>Follow-focus preview (demo)</span>
      </label>
      {focusFollow && (
        <p className="focus-follow-status">
          {followHint?.direction === "hold"
            ? "At home focus — hold"
            : `Would send: ${followHint?.label} (Δ ${formatDeltaM(focusState.deltaFromHomeM)} from home)`}
        </p>
      )}

      <p className="live-focus-hint">Mount offset: {formatMountToLensOffsets()}.</p>
    </div>
  );

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
        <button
          type="button"
          className={["btn-target-lock", moveTargetEnabled ? "active" : ""].filter(Boolean).join(" ")}
          aria-pressed={moveTargetEnabled}
          title="Drag the reference target in 3D and camera previews (disables orbit/pan in 3D view)"
          onClick={() => onMoveTargetEnabledChange(!moveTargetEnabled)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M12 3v4M12 17v4M3 12h4M17 12h4M7.05 7.05l2.83 2.83M14.12 14.12l2.83 2.83M7.05 16.95l2.83-2.83M14.12 9.88l2.83-2.83"
            />
          </svg>
          {embedded ? "Move" : "Move target"}
        </button>
      </div>
      <p className="live-target-readout" title="World aim point (torso centre)">
        Target {formatSubjectAim(subjectAimPoint)}
      </p>
      <div className="live-actions">
        <button
          type="button"
          className="btn-compact"
          title="Reset reference target to home position"
          onClick={onResetSubjectAim}
        >
          Reset target
        </button>
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
          <CollapsibleSection title="Jog axes" storageKey="live-axes" defaultOpen badge="4">
            {axesGrid}
          </CollapsibleSection>
          <CollapsibleSection
            title="Focus distance"
            storageKey="live-focus"
            defaultOpen
            badge={focusState.calibrated ? "cal" : "model"}
          >
            {focusBlock}
          </CollapsibleSection>
          <CollapsibleSection title="Aim & home" storageKey="live-aim" defaultOpen badge={lockBadge}>
            {aimBlock}
          </CollapsibleSection>
          <CollapsibleSection title="Input" storageKey="live-input" defaultOpen badge={gamepadEnabled ? "pad" : undefined}>
            <div className="live-input-block">
              <label className="live-input-toggle">
                <input
                  type="checkbox"
                  checked={gamepadEnabled}
                  onChange={(e) => onGamepadEnabledChange(e.target.checked)}
                />
                Gamepad jog (Web Gamepad API)
              </label>
              <p className="live-input-hint">
                L stick: boom / swing · R stick: yaw / pitch · RB/LB: zoom · Space: play · R: record · H: home all
              </p>
            </div>
          </CollapsibleSection>
        </>
      ) : (
        <>
          {axesGrid}
          {focusBlock}
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
