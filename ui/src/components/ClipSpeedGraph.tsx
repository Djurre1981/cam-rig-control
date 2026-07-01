import { useCallback, useEffect, useRef, useState } from "react";
import { snapTime } from "../lib/timelineUtils";
import type { MotorClip, SpeedKeyframe } from "../types";
import {
  addSpeedKeyframe,
  ensureSpeedCurve,
  removeSpeedKeyframe,
  sortSpeedCurve,
  speedCurvePolyline,
} from "../lib/speedCurve";

type Props = {
  clip: MotorClip;
  clipWidth: number;
  clipHeight: number;
  snapEnabled: boolean;
  selected: boolean;
  label: string;
  onCurveChange: (curve: SpeedKeyframe[]) => void;
};

/** Side inset: resize handle on the right; symmetric inset on the left for balance. */
function graphPad(clipHeight: number, handleR: number) {
  const margin = Math.min(8, Math.max(4, Math.round(clipHeight * 0.1)));
  const side = Math.max(handleR + 2, 6);
  return { left: side, right: Math.max(side + 4, 14), top: margin, bottom: margin };
}

type DragHint = {
  clientX: number;
  clientY: number;
  v: number;
  timeSec: number;
};

export function ClipSpeedGraph({
  clip,
  clipWidth,
  clipHeight,
  snapEnabled,
  selected,
  label,
  onCurveChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const curveRef = useRef<SpeedKeyframe[]>([]);
  const [dragHint, setDragHint] = useState<DragHint | null>(null);
  const curve = ensureSpeedCurve(clip);
  curveRef.current = curve;

  const hitR = selected ? 8 : 6;
  const dotR = selected ? 4 : 3;
  const PAD = graphPad(clipHeight, hitR);
  const graphW = Math.max(8, clipWidth - PAD.left - PAD.right);
  const graphH = Math.max(12, clipHeight - PAD.top - PAD.bottom);
  /** Keep endpoint circle centers inside the plot so radii do not spill past clip edges. */
  const plotInset = hitR + 1;
  const plotW = Math.max(4, graphW - 2 * plotInset);

  const tToPlotX = useCallback((t: number) => plotInset + t * plotW, [plotInset, plotW]);

  const plotXToT = useCallback(
    (x: number) => {
      const tNorm = Math.max(0, Math.min(1, (x - plotInset) / plotW));
      let sec = tNorm * clip.duration;
      if (snapEnabled) sec = snapTime(sec, true);
      return Math.max(0, Math.min(clip.duration, sec));
    },
    [plotInset, plotW, snapEnabled, clip.duration]
  );

  const yToSpeed = useCallback(
    (clientY: number, svgTop: number) => {
      const localY = clientY - svgTop - PAD.top;
      return Math.max(0, Math.min(1, 1 - localY / graphH));
    },
    [graphH, PAD.top]
  );

  const applyPointPatch = useCallback(
    (index: number, patch: Partial<SpeedKeyframe>) => {
      const next = sortSpeedCurve(
        curveRef.current.map((k, i) => (i === index ? { ...k, ...patch } : k))
      );
      curveRef.current = next;
      onCurveChange(next);
    },
    [onCurveChange]
  );

  const onPointPointerDown = (e: React.PointerEvent<SVGCircleElement>, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const svg = svgRef.current;
    if (!svg) return;

    const isEndpoint = index === 0 || index === curveRef.current.length - 1;

    const onMove = (ev: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      const v = yToSpeed(ev.clientY, rect.top);
      const patch: Partial<SpeedKeyframe> = { v };

      if (!isEndpoint) {
        const x = ev.clientX - rect.left - PAD.left;
        patch.t = plotXToT(x) / clip.duration;
      }

      applyPointPatch(index, patch);

      const timeSec = isEndpoint
        ? curveRef.current[index].t * clip.duration
        : plotXToT(ev.clientX - rect.left - PAD.left);
      setDragHint({
        clientX: ev.clientX,
        clientY: ev.clientY,
        v,
        timeSec,
      });
    };

    const onUp = (ev: PointerEvent) => {
      if (target.hasPointerCapture(ev.pointerId)) {
        target.releasePointerCapture(ev.pointerId);
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragHint(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onGraphDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selected || plotW < 8) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - PAD.left;
    const v = yToSpeed(e.clientY, rect.top);
    const t = plotXToT(x) / clip.duration;
    onCurveChange(addSpeedKeyframe(curveRef.current, t, v, clip.duration));
  };

  useEffect(() => {
    curveRef.current = ensureSpeedCurve(clip);
  }, [clip]);

  if (clip.type === "RecordedClip" || graphH < 16 || graphW < 16) return null;

  const path = speedCurvePolyline(curve, graphW, graphH, plotInset);
  const clipPathId = `graph-clip-${clip.id}`;

  return (
    <>
      <svg
        ref={svgRef}
        className="clip-speed-graph"
        width={clipWidth}
        height={clipHeight}
        viewBox={`0 0 ${clipWidth} ${clipHeight}`}
        preserveAspectRatio="none"
        overflow="hidden"
        onDoubleClick={onGraphDoubleClick}
      >
        <defs>
          <clipPath id={clipPathId}>
            <rect x={0} y={0} width={clipWidth} height={clipHeight} rx={3} ry={3} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipPathId})`}>
          <g transform={`translate(${PAD.left} ${PAD.top})`}>
            <rect x={0} y={0} width={graphW} height={graphH} className="speed-graph-fill" />
            <line x1={0} y1={graphH} x2={graphW} y2={graphH} className="speed-graph-axis" />
            <line x1={0} y1={0} x2={0} y2={graphH} className="speed-graph-axis" />
            <path d={path} className="speed-graph-line" fill="none" vectorEffect="non-scaling-stroke" />
            {curve.map((k, i) => {
              const cx = tToPlotX(k.t);
              const cy = Math.max(dotR, Math.min(graphH - dotR, graphH - k.v * graphH));
              return (
                <g key={`${k.t}-${i}`} className="speed-graph-point-group">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={hitR}
                    className="speed-graph-hit"
                    onPointerDown={(ev) => onPointPointerDown(ev, i)}
                    onContextMenu={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      if (curveRef.current.length <= 2) return;
                      onCurveChange(removeSpeedKeyframe(curveRef.current, i));
                    }}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={dotR}
                    className={`speed-graph-point ${selected ? "selected" : ""}`}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <div className="clip-graph-label">{label}</div>
      {dragHint && (
        <div
          className="speed-graph-tooltip"
          style={{
            position: "fixed",
            left: dragHint.clientX + 12,
            top: dragHint.clientY - 28,
          }}
        >
          {Math.round(dragHint.v * 100)}%
          <span className="speed-graph-tooltip-time">
            @ {dragHint.timeSec.toFixed(2)}s
          </span>
        </div>
      )}
    </>
  );
}
