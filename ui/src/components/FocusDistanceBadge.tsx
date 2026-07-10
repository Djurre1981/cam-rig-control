import {
  focusDistanceAtPose,
  focusFollowHint,
  formatDeltaM,
  type FocusCalibration,
} from "../lib/focusCalibration";
import { formatFocusDiopters, formatFocusDistance } from "../lib/rigFocus";
import type { SubjectAimPoint } from "../lib/subjectTarget";
import type { RigPose } from "../lib/rigKinematics";

type Props = {
  pose: RigPose;
  calibration: FocusCalibration;
  focusFollow?: boolean;
  subjectAimPoint?: SubjectAimPoint;
  compact?: boolean;
};

export function FocusDistanceBadge({
  pose,
  calibration,
  focusFollow,
  subjectAimPoint,
  compact,
}: Props) {
  const state = focusDistanceAtPose(pose, calibration, subjectAimPoint);
  const hint = focusFollow ? focusFollowHint(state.deltaFromHomeM) : null;

  return (
    <span
      className={["focus-distance-badge", compact ? "compact" : "", focusFollow ? "follow-on" : ""]
        .filter(Boolean)
        .join(" ")}
      title={
        state.calibrated
          ? `Calibrated · model ${formatFocusDistance(state.computedM)} · scale ×${state.scale.toFixed(3)}`
          : `Model distance · calibrate at home for tape-measure match`
      }
    >
      <span className="focus-distance-value">{formatFocusDistance(state.subjectM)}</span>
      {!compact && (
        <span className="focus-distance-meta">
          {formatFocusDiopters(state.subjectM)}
          {state.calibrated && (
            <span className="focus-distance-delta"> · Δ {formatDeltaM(state.deltaFromHomeM)}</span>
          )}
        </span>
      )}
      {hint && hint.direction !== "hold" && (
        <span className="focus-follow-pulse" title="Demo follow-focus command">
          {hint.label}
        </span>
      )}
    </span>
  );
}
