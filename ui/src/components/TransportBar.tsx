import { formatTime } from "../lib/timelineUtils";

type Props = {
  playhead: number;
  duration: number;
  playing: boolean;
  speedPercent: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSpeedPercentChange: (pct: number) => void;
  onRecord?: () => void;
  recording?: boolean;
};

export function TransportBar({
  playhead,
  duration,
  playing,
  speedPercent,
  onPlay,
  onPause,
  onStop,
  onSpeedPercentChange,
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
      <label className="speed-control speed-percent" title="Percent of per-axis maximum velocity">
        <span>Max speed</span>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={speedPercent}
          onChange={(e) => onSpeedPercentChange(Number(e.target.value))}
        />
        <span className="speed-percent-value">{speedPercent}%</span>
      </label>
    </div>
  );
}
