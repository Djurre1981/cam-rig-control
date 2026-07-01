import { useCallback, useEffect, useRef, useState } from "react";
import { readDragClip } from "./ClipPalette";
import {
  clampDuration,
  snapTime,
  uid,
} from "../lib/timelineUtils";
import type {
  CameraClip,
  CameraTrackId,
  ClipSelection,
  MotorClip,
  PaletteItem,
  TimelineProject,
} from "../types";
import { PIXELS_PER_SECOND, TRACK_LABEL_WIDTH } from "../types";

type Props = {
  project: TimelineProject;
  playhead: number;
  selection: ClipSelection;
  snapEnabled: boolean;
  onSnapToggle: (v: boolean) => void;
  onProjectChange: (p: TimelineProject) => void;
  onSelect: (s: ClipSelection) => void;
  onSeek: (t: number) => void;
};

type DragState =
  | { mode: "move"; kind: "motor" | "camera"; trackId: string; clipId: string; offsetX: number }
  | { mode: "resize"; kind: "motor" | "camera"; trackId: string; clipId: string }
  | null;

function clipLabel(clip: MotorClip | CameraClip): string {
  return clip.label ?? clip.type.replace("Clip", "");
}

export function TimelineEditor({
  project,
  playhead,
  selection,
  snapEnabled,
  onSnapToggle,
  onProjectChange,
  onSelect,
  onSeek,
}: Props) {
  const width = project.duration * PIXELS_PER_SECOND;
  const [drag, setDrag] = useState<DragState>(null);
  const lanesRef = useRef<HTMLDivElement>(null);

  const timeFromX = useCallback(
    (clientX: number, laneLeft: number) => {
      const x = clientX - laneLeft;
      return snapTime(x / PIXELS_PER_SECOND, snapEnabled);
    },
    [snapEnabled]
  );

  const addClipFromPalette = (
    item: PaletteItem,
    trackKey: string,
    start: number
  ) => {
    const next = structuredClone(project);
    const duration = clampDuration(item.defaults.duration ?? 2);
    const startSnapped = snapTime(start, snapEnabled);

    if (item.target === "motor") {
      const track = next.tracks.find((t) => t.id === trackKey);
      if (!track) return;
      const clip: MotorClip = {
        id: uid(),
        type: item.clipType as MotorClip["type"],
        start: startSnapped,
        duration,
        label: item.defaults.label,
        velocity: item.defaults.velocity,
        from_pos: item.defaults.from_pos,
        to_pos: item.defaults.to_pos,
      };
      track.clips.push(clip);
      track.clips.sort((a, b) => a.start - b.start);
      onProjectChange(next);
      onSelect({ kind: "motor", trackId: track.id, clipId: clip.id });
      return;
    }

    const track = next.camera_tracks.find((t) => t.id === item.target);
    if (!track) return;
    const clip: CameraClip = {
      id: uid(),
      type: item.clipType as CameraClip["type"],
      start: startSnapped,
      duration,
      label: item.defaults.label,
      action: item.defaults.action,
      from_zoom: item.defaults.from_zoom,
      to_zoom: item.defaults.to_zoom,
    };
    track.clips.push(clip);
    track.clips.sort((a, b) => a.start - b.start);
    onProjectChange(next);
    onSelect({ kind: "camera", trackId: track.id as CameraTrackId, clipId: clip.id });
  };

  const handleLaneDrop = (
    e: React.DragEvent,
    trackKey: string,
    acceptsMotor: boolean,
    cameraId?: CameraTrackId
  ) => {
    e.preventDefault();
    const item = readDragClip(e);
    if (!item) return;
    if (item.target === "motor" && !acceptsMotor) return;
    if (item.target !== "motor" && item.target !== cameraId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    addClipFromPalette(item, acceptsMotor ? trackKey : cameraId!, timeFromX(e.clientX, rect.left));
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag || !lanesRef.current) return;
      const lane = lanesRef.current.querySelector(
        `[data-track-id="${drag.trackId}"] .track-lane`
      ) as HTMLElement | null;
      if (!lane) return;
      const rect = lane.getBoundingClientRect();

      const next = structuredClone(project);

      if (drag.kind === "motor") {
        const track = next.tracks.find((t) => t.id === drag.trackId);
        const clip = track?.clips.find((c) => c.id === drag.clipId);
        if (!track || !clip) return;

        if (drag.mode === "move") {
          const t = timeFromX(e.clientX - drag.offsetX, rect.left);
          clip.start = Math.max(0, Math.min(project.duration - clip.duration, t));
        } else {
          const end = timeFromX(e.clientX, rect.left);
          clip.duration = clampDuration(end - clip.start);
        }
      } else {
        const track = next.camera_tracks.find((t) => t.id === drag.trackId);
        const clip = track?.clips.find((c) => c.id === drag.clipId);
        if (!track || !clip) return;

        if (drag.mode === "move") {
          const t = timeFromX(e.clientX - drag.offsetX, rect.left);
          clip.start = Math.max(0, Math.min(project.duration - clip.duration, t));
        } else {
          const end = timeFromX(e.clientX, rect.left);
          clip.duration = clampDuration(end - clip.start);
        }
      }

      onProjectChange(next);
    },
    [drag, project, timeFromX, onProjectChange]
  );

  const onPointerUp = useCallback(() => setDrag(null), []);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, onPointerMove, onPointerUp]);

  return (
    <div className="timeline-editor" ref={lanesRef}>
      <div className="timeline-toolbar">
        <label className="snap-toggle">
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={(e) => onSnapToggle(e.target.checked)}
          />
          Snap 0.25s
        </label>
        <span className="timeline-hint">Click ruler to seek · drag clips · resize right edge</span>
      </div>

      <div className="timeline-scroll">
        <div className="timeline-canvas" style={{ width: TRACK_LABEL_WIDTH + width }}>
          <div className="ruler-row">
            <div className="track-label head">Time</div>
            <div
              className="ruler"
              style={{ width }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onSeek(timeFromX(e.clientX, rect.left));
              }}
            >
              {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, s) => (
                <span key={s} className="ruler-tick" style={{ left: s * PIXELS_PER_SECOND }}>
                  {s}s
                </span>
              ))}
              <div
                className="playhead-head"
                style={{ left: playhead * PIXELS_PER_SECOND }}
              />
            </div>
          </div>

          <div className="track-section-label">Motion axes</div>
          {project.tracks.map((track) => (
            <div key={track.id} className="track-row" data-track-id={track.id}>
              <div className="track-label" style={{ borderLeftColor: track.color }}>
                {track.label}
              </div>
              <div
                className="track-lane"
                style={{ width }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleLaneDrop(e, track.id, true)}
              >
                {track.clips.map((clip) => {
                  const selected =
                    selection?.kind === "motor" &&
                    selection.trackId === track.id &&
                    selection.clipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      className={`clip-block ${selected ? "selected" : ""}`}
                      style={{
                        left: clip.start * PIXELS_PER_SECOND,
                        width: Math.max(clip.duration * PIXELS_PER_SECOND, 28),
                        background: `linear-gradient(180deg, ${track.color}dd, ${track.color}99)`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect({ kind: "motor", trackId: track.id, clipId: clip.id });
                      }}
                      onPointerDown={(e) => {
                        if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDrag({
                          mode: "move",
                          kind: "motor",
                          trackId: track.id,
                          clipId: clip.id,
                          offsetX: e.clientX - rect.left,
                        });
                      }}
                    >
                      <span className="clip-title">{clipLabel(clip)}</span>
                      {clip.type === "JogClip" && (
                        <span className="clip-sub">v={clip.velocity}</span>
                      )}
                      <span
                        className="resize-handle"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDrag({
                            mode: "resize",
                            kind: "motor",
                            trackId: track.id,
                            clipId: clip.id,
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="track-section-label camera">Camera · Sony ZV-1 II</div>
          {project.camera_tracks.map((track) => (
            <div key={track.id} className="track-row camera" data-track-id={track.id}>
              <div className="track-label" style={{ borderLeftColor: track.color }}>
                {track.label}
              </div>
              <div
                className="track-lane"
                style={{ width }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleLaneDrop(e, track.id, false, track.id)}
              >
                {track.clips.map((clip) => {
                  const selected =
                    selection?.kind === "camera" &&
                    selection.trackId === track.id &&
                    selection.clipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      className={`clip-block camera ${selected ? "selected" : ""}`}
                      style={{
                        left: clip.start * PIXELS_PER_SECOND,
                        width: Math.max(clip.duration * PIXELS_PER_SECOND, 24),
                        background: `linear-gradient(180deg, ${track.color}dd, ${track.color}99)`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect({
                          kind: "camera",
                          trackId: track.id,
                          clipId: clip.id,
                        });
                      }}
                      onPointerDown={(e) => {
                        if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDrag({
                          mode: "move",
                          kind: "camera",
                          trackId: track.id,
                          clipId: clip.id,
                          offsetX: e.clientX - rect.left,
                        });
                      }}
                    >
                      <span className="clip-title">{clipLabel(clip)}</span>
                      <span
                        className="resize-handle"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setDrag({
                            mode: "resize",
                            kind: "camera",
                            trackId: track.id,
                            clipId: clip.id,
                          });
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div
            className="playhead-line"
            style={{ left: TRACK_LABEL_WIDTH + playhead * PIXELS_PER_SECOND }}
          />
        </div>
      </div>
    </div>
  );
}
