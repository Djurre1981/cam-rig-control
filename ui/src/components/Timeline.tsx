import { PIXELS_PER_SECOND, type MotorClip, type TimelineProject } from "../types";

type Props = {
  project: TimelineProject;
  playhead: number;
  onProjectChange: (p: TimelineProject) => void;
};

const CLIP_PALETTE: MotorClip = {
  type: "JogClip",
  start: 0,
  duration: 2,
  velocity: 100,
};

export function Timeline({ project, playhead, onProjectChange }: Props) {
  const width = project.duration * PIXELS_PER_SECOND;

  const onDrop = (axis: number, offsetX: number) => {
    const start = Math.max(0, offsetX / PIXELS_PER_SECOND);
    const next = structuredClone(project);
    const track = next.tracks[axis];
    track.clips.push({ ...CLIP_PALETTE, start });
    track.clips.sort((a, b) => a.start - b.start);
    onProjectChange(next);
  };

  return (
    <div className="timeline">
      <div className="timeline-ruler" style={{ width }}>
        {Array.from({ length: project.duration + 1 }, (_, s) => (
          <span key={s} style={{ left: s * PIXELS_PER_SECOND }}>
            {s}s
          </span>
        ))}
      </div>
      <div
        className="playhead"
        style={{ left: 120 + playhead * PIXELS_PER_SECOND }}
      />
      {project.tracks.map((track) => (
        <div key={track.id} className="track-row">
          <div className="track-label">{track.label}</div>
          <div
            className="track-lane"
            style={{ width }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onDrop(track.axis, e.clientX - rect.left);
            }}
          >
            {track.clips.map((clip, i) => (
              <div
                key={i}
                className={`clip clip-${clip.type}`}
                style={{
                  left: clip.start * PIXELS_PER_SECOND,
                  width: clip.duration * PIXELS_PER_SECOND,
                }}
                title={`${clip.type} v=${clip.velocity ?? 0}`}
              >
                {clip.type.replace("Clip", "")}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="palette">
        <p>Drag onto a track:</p>
        <div
          className="palette-clip"
          draggable
          onDragStart={(e) =>
            e.dataTransfer.setData("text/plain", "JogClip")
          }
        >
          Jog (constant velocity)
        </div>
      </div>
      {(project.camera_tracks ?? []).map((ct) => (
        <div key={ct.id} className="track-row camera">
          <div className="track-label">{ct.id}</div>
          <div className="track-lane" style={{ width }}>
            {ct.clips.map((clip, i) => (
              <div
                key={i}
                className="clip clip-camera"
                style={{
                  left: clip.start * PIXELS_PER_SECOND,
                  width: Math.max(clip.duration * PIXELS_PER_SECOND, 24),
                }}
              >
                {clip.type.replace("Clip", "")}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
