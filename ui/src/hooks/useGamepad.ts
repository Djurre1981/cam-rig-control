import { useEffect, useRef } from "react";

export type GamepadMapping = {
  boom: { axis: number; invert?: boolean };
  swing: { axis: number; invert?: boolean };
  yaw: { axis: number; invert?: boolean };
  pitch: { axis: number; invert?: boolean };
  zoom: { buttonPlus: number; buttonMinus: number };
};

export const DEFAULT_GAMEPAD_MAPPING: GamepadMapping = {
  boom: { axis: 1, invert: true },
  swing: { axis: 0, invert: false },
  yaw: { axis: 2, invert: false },
  pitch: { axis: 3, invert: true },
  zoom: { buttonPlus: 5, buttonMinus: 4 },
};

const DEADZONE = 0.12;

function applyDeadzone(v: number): number {
  if (Math.abs(v) < DEADZONE) return 0;
  const sign = Math.sign(v);
  return sign * ((Math.abs(v) - DEADZONE) / (1 - DEADZONE));
}

export function useGamepad(
  enabled: boolean,
  speedPercent: number,
  onVelocities: (v: [number, number, number, number]) => void,
  onZoomVelocity: (v: number) => void,
  mapping: GamepadMapping = DEFAULT_GAMEPAD_MAPPING
) {
  const onVelRef = useRef(onVelocities);
  const onZoomRef = useRef(onZoomVelocity);
  const speedRef = useRef(speedPercent);
  onVelRef.current = onVelocities;
  onZoomRef.current = onZoomVelocity;
  speedRef.current = speedPercent;

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = pads.find((p) => p?.connected) ?? null;
      if (pad) {
        const read = (cfg: { axis: number; invert?: boolean }) => {
          const raw = pad.axes[cfg.axis] ?? 0;
          const v = applyDeadzone(raw) * (cfg.invert ? -1 : 1);
          return v;
        };
        const scale = speedRef.current / 100;
        const boom = read(mapping.boom) * 0.85 * scale;
        const swing = read(mapping.swing) * 0.85 * scale;
        const yaw = read(mapping.yaw) * 0.7 * scale;
        const pitch = read(mapping.pitch) * 0.7 * scale;
        onVelRef.current([boom, swing, yaw, pitch]);

        let zoom = 0;
        if (pad.buttons[mapping.zoom.buttonPlus]?.pressed) zoom += 0.35 * scale;
        if (pad.buttons[mapping.zoom.buttonMinus]?.pressed) zoom -= 0.35 * scale;
        onZoomRef.current(zoom);
      } else {
        onVelRef.current([0, 0, 0, 0]);
        onZoomRef.current(0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, mapping]);
}

export function gamepadConnected(): boolean {
  const pads = navigator.getGamepads?.() ?? [];
  return pads.some((p) => p?.connected);
}
