import { forwardRef, useImperativeHandle, useRef } from "react";

export type VirtualHorizonHandle = {
  setAttitude: (rollDeg: number, pitchDeg: number) => void;
};

type Props = {
  visible: boolean;
};

const LEVEL_ROLL_DEG = 1.5;
const LEVEL_PITCH_DEG = 2;

/**
 * EVF-style virtual horizon: fixed frame brackets with a roll/pitch-sensitive level line.
 * Placed in the lower margin so the subject stays unobstructed.
 */
export const VirtualHorizon = forwardRef<VirtualHorizonHandle, Props>(function VirtualHorizon(
  { visible },
  ref
) {
  const rollGroupRef = useRef<SVGGElement>(null);
  const horizonLineRef = useRef<SVGLineElement>(null);

  useImperativeHandle(ref, () => ({
    setAttitude(rollDeg: number, pitchDeg: number) {
      const rollGroup = rollGroupRef.current;
      const line = horizonLineRef.current;
      if (!rollGroup || !line) return;

      rollGroup.setAttribute("transform", `rotate(${rollDeg.toFixed(2)} 60 20)`);

      const level =
        Math.abs(rollDeg) <= LEVEL_ROLL_DEG && Math.abs(pitchDeg) <= LEVEL_PITCH_DEG;
      line.setAttribute("stroke", level ? "#5de88a" : "rgba(255,255,255,0.82)");
      line.setAttribute("stroke-width", level ? "2.2" : "1.8");
    },
  }));

  if (!visible) return null;

  return (
    <div className="virtual-horizon" aria-hidden>
      <svg className="virtual-horizon-svg" viewBox="0 0 120 36" role="presentation">
        {/* Fixed frame — does not rotate; shows viewfinder edges */}
        <g className="virtual-horizon-frame">
          <path
            d="M 8 28 L 8 24 M 8 28 L 14 28 M 112 28 L 112 24 M 112 28 L 106 28"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 60 32 L 60 28"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>

        {/* Roll-sensitive horizon line through center */}
        <g ref={rollGroupRef} className="virtual-horizon-roll" transform="rotate(0)">
          <line
            ref={horizonLineRef}
            x1="22"
            y1="20"
            x2="98"
            y2="20"
            stroke="rgba(255,255,255,0.82)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>

        {/* Subtle arc like compact camera level displays */}
        <path
          d="M 36 24 A 24 24 0 0 1 84 24"
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
});
