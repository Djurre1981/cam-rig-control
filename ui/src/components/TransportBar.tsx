import { formatTime } from "../lib/timelineUtils";

type Props = {
  playhead: number;
  duration: number;
  playing: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeedChange: (s: number) => void;
  onRecord?: () => void;
  recording?: boolean;
};

export function TransportBar({
  playhead,
  duration,
  playing,
  speed,
  onPlay,
  onPause,
  onStop,
  onSpeedChange,
  onRecord,
  recording,
}: Props) {
  return (
    <div className="transport-bar">
      <div className="transport-buttons">
        <button type="button" className="transport-btn" onClick={onStop} title="Stop">
          ■
        </button>
        {playing ? (
          <button type="button" className="transport-btn primary" onClick={onPause} title="Pause">
            ❚❚
          </button>
        ) : (
          <button type="button" className="transport-btn primary" onClick={onPlay} title="Play">
            ▶
          </button>
        )}
        {onRecord && (
          <button
            type="button"
            className={`transport-btn record ${recording ? "active" : ""}`}
            onClick={onRecord}
            title="Record live motion"
          >
            ●
          </button>
        )}
      </div>
      <div className="transport-time">
        <span className="timecode">{formatTime(playhead)}</span>
        <span className="time-sep">/</span>
        <span className="timecode dim">{formatTime(duration)}</span>
      </div>
      <label className="speed-control">
        <span>Speed</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        >
          <option value={0.25}>0.25×</option>
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={1.5}>1.5×</option>
          <option value={2}>2×</option>
        </select>
      </label>
    </div>
  );
}
