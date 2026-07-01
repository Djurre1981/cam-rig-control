import { useMemo } from "react";
import { effectorsAtTime } from "../lib/playbackState";
import type { TimelineProject } from "../types";

type Props = {
  project: TimelineProject;
  playhead: number;
  playing: boolean;
  speedPercent: number;
};

export function EffectorBar({ project, playhead, playing, speedPercent }: Props) {
  const effectors = useMemo(
    () => effectorsAtTime(project, playhead, speedPercent),
    [project, playhead, speedPercent]
  );

  return (
    <div className="effector-bar" aria-label="Axis values at playhead">
      <span className="effector-bar-label">{playing ? "Live" : "Scrub"}</span>
      <div className="effector-list">
        {effectors.map((e) => (
          <div
            key={e.id}
            className={`effector-chip ${e.live ? "live" : ""}`}
            title={`${e.name}: ${e.display}`}
          >
            <span className="effector-name" style={{ color: e.color }}>
              {e.name}
            </span>
            <div className="effector-meter">
              <div
                className="effector-meter-fill"
                style={{
                  width: `${e.movement * 100}%`,
                  background: e.color,
                }}
              />
            </div>
            <span className="effector-value">{e.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
