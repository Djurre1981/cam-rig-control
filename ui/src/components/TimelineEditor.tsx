import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipSpeedGraph } from "./ClipSpeedGraph";
import { readDragClip } from "./ClipPalette";
import {
  cameraDirectionLabel,
  cameraDirectionTitle,
  cameraSupportsDirection,
  isCameraReversed,
  motorDirectionIcon,
  motorDirectionTitle,
  motorClipLabel,
  cameraClipLabel,
  motorSupportsDirection,
  axisUsesVerticalDirection,
  reverseCameraClip,
  reverseMotorClip,
  relinkFollowingMovePositions,
  relinkFollowingZoomPositions,
} from "../lib/clipDirection";
import { defaultSpeedCurve } from "../lib/speedCurve";
import { clipIsOffTimeline, clipRectInLane } from "../lib/timelineClipLayout";
import {
  insertClipInChain,
  moveClipInChain,
  removeClipFromChain,
  resizeClipInChain,
  relinkFollowingClipStarts,
} from "../lib/timelineTrackChain";
import { resolveDropTrack } from "../lib/trackResolver";
import { clampDuration, snapTime, uid } from "../lib/timelineUtils";
import {
  contentDuration,
  MIN_TIMELINE_DURATION_SEC,
  requiredTimelineDuration,
  viewportEndTime,
} from "../lib/timelineDuration";
import {
  DEFAULT_CAMERA_ROW_HEIGHT,
  DEFAULT_MOTOR_ROW_HEIGHT,
  DEFAULT_PIXELS_PER_SECOND,
  formatRulerLabel,
  MAX_TRACK_ROW_HEIGHT,
  MIN_TRACK_ROW_HEIGHT,
  pixelsPerSecondForFit,
  rulerTickInterval,
  zoomFromWheel,
} from "../lib/timelineView";
import type {
  CameraClip,
  CameraTrackId,
  ClipSelection,
  MotorClip,
  PaletteItem,
  TimelineProject,
} from "../types";
import { TRACK_LABEL_WIDTH } from "../types";

type Props = {
  project: TimelineProject;
  playhead: number;
  selection: ClipSelection;
  snapEnabled: boolean;
  activePaletteItem: PaletteItem | null;
  onSnapToggle: (v: boolean) => void;
  onProjectChange: (p: TimelineProject) => void;
  onEnsureDuration: (minDuration: number) => void;
  onSelect: (s: ClipSelection) => void;
  onSeek: (t: number) => void;
  hiddenTrackIds?: ReadonlySet<string>;
};

type DragState =
  | { mode: "move"; kind: "motor" | "camera"; trackId: string; clipId: string; offsetX: number }
  | { mode: "resize"; kind: "motor" | "camera"; trackId: string; clipId: string }
  | { mode: "scrub" }
  | { mode: "pan"; startX: number; startScrollLeft: number }
  | { mode: "row-resize"; kind: "motor" | "camera"; trackId: string; startY: number; startHeight: number }
  | null;

function clipLabel(clip: MotorClip | CameraClip): string {
  return clip.label ?? clip.type.replace("Clip", "");
}

function motorRowHeight(track: { row_height?: number }): number {
  return track.row_height ?? DEFAULT_MOTOR_ROW_HEIGHT;
}

function cameraRowHeight(track: { row_height?: number }): number {
  return track.row_height ?? DEFAULT_CAMERA_ROW_HEIGHT;
}

type TimedClip = {
  id: string;
  start: number;
  duration: number;
};

export function TimelineEditor({
  project,
  playhead,
  selection,
  snapEnabled,
  activePaletteItem,
  onSnapToggle,
  onProjectChange,
  onEnsureDuration,
  onSelect,
  onSeek,
  hiddenTrackIds,
}: Props) {
  const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PIXELS_PER_SECOND);
  const [drag, setDrag] = useState<DragState>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef(project);
  const ensureDurationRef = useRef(onEnsureDuration);

  projectRef.current = project;
  ensureDurationRef.current = onEnsureDuration;

  const pps = pixelsPerSecond;
  const width = project.duration * pps;

  const syncViewportDuration = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const end = viewportEndTime(scroll.scrollLeft, scroll.clientWidth, pps, TRACK_LABEL_WIDTH);
    const needed = requiredTimelineDuration(projectRef.current, end);
    if (needed > projectRef.current.duration) {
      ensureDurationRef.current(needed);
    }
  }, [pps]);

  const timeFromX = useCallback(
    (clientX: number, laneLeft: number) => {
      const x = clientX - laneLeft;
      return snapTime(x / pps, snapEnabled);
    },
    [snapEnabled, pps]
  );

  const rulerTicks = useMemo(() => {
    const { major, minor } = rulerTickInterval(pps);
    const ticks: { t: number; major: boolean }[] = [];
    const end = project.duration + major;
    for (let t = 0; t <= end; t += minor) {
      const rounded = Math.round(t * 1000) / 1000;
      const isMajor = Math.abs(rounded % major) < minor * 0.01 || rounded === 0;
      ticks.push({ t: rounded, major: isMajor });
    }
    return ticks;
  }, [pps, project.duration]);

  const updateMotorCurve = (trackId: string, clipId: string, curve: MotorClip["speed_curve"]) => {
    const next = structuredClone(project);
    const track = next.tracks.find((t) => t.id === trackId);
    const clip = track?.clips.find((c) => c.id === clipId);
    if (!clip) return;
    clip.speed_curve = curve;
    onProjectChange(next);
  };

  const setTrackHeight = (trackId: string, kind: "motor" | "camera", height: number) => {
    const h = Math.max(MIN_TRACK_ROW_HEIGHT, Math.min(MAX_TRACK_ROW_HEIGHT, height));
    const next = structuredClone(project);
    if (kind === "motor") {
      const track = next.tracks.find((t) => t.id === trackId);
      if (track) track.row_height = h;
    } else {
      const track = next.camera_tracks.find((t) => t.id === trackId);
      if (track) track.row_height = h;
    }
    onProjectChange(next);
  };

  const applyMotorChain = (existing: MotorClip[], chain: TimedClip[], created: MotorClip) => {
    const byId = new Map(existing.map((c) => [c.id, c]));
    byId.set(created.id, created);
    return chain.map((t) => {
      const clip = byId.get(t.id)!;
      return { ...clip, start: t.start, duration: t.duration };
    });
  };

  const applyCameraChain = (existing: CameraClip[], chain: TimedClip[], created: CameraClip) => {
    const byId = new Map(existing.map((c) => [c.id, c]));
    byId.set(created.id, created);
    return chain.map((t) => {
      const clip = byId.get(t.id)!;
      return { ...clip, start: t.start, duration: t.duration };
    });
  };

  const addClipFromPalette = (
    item: PaletteItem,
    resolved: { kind: "motor" | "camera"; trackId: string },
    start: number
  ) => {
    const next = structuredClone(project);
    const defaultDuration = clampDuration(item.defaults.duration ?? 2);

    if (resolved.kind === "motor") {
      const track = next.tracks.find((t) => t.id === resolved.trackId);
      if (!track) return;
      const clipType = item.clipType as MotorClip["type"];
      const newId = uid();
      const clip: MotorClip = {
        id: newId,
        type: clipType,
        start: 0,
        duration: defaultDuration,
        label: item.defaults.label,
        velocity: item.defaults.velocity,
        from_pos: item.defaults.from_pos,
        to_pos: item.defaults.to_pos,
        speed_curve: defaultSpeedCurve(clipType),
      };
      if (motorSupportsDirection(clip)) {
        clip.label = motorClipLabel(track.axis, clip);
      }
      const chain = insertClipInChain(
        track.clips,
        { id: newId, start: 0, duration: defaultDuration },
        start,
        snapEnabled
      );
      if (!chain) return;
      track.clips = applyMotorChain(track.clips, chain, clip);
      const sorted = [...track.clips].sort((a, b) => a.start - b.start);
      const idx = sorted.findIndex((c) => c.id === newId);
      if (idx > 0) relinkFollowingMovePositions(sorted, idx - 1, track.axis);
      track.clips = sorted;
      onProjectChange(next);
      onSelect({ kind: "motor", trackId: track.id, clipId: newId });
      return;
    }

    const track = next.camera_tracks.find((t) => t.id === resolved.trackId);
    if (!track) return;
    const newId = uid();
    const clip: CameraClip = {
      id: newId,
      type: item.clipType as CameraClip["type"],
      start: 0,
      duration: defaultDuration,
      label: item.defaults.label,
      action: item.defaults.action,
      from_zoom: item.defaults.from_zoom,
      to_zoom: item.defaults.to_zoom,
    };
    if (cameraSupportsDirection(clip)) {
      clip.label = cameraClipLabel(clip);
    }
    const chain = insertClipInChain(
      track.clips,
      { id: newId, start: 0, duration: defaultDuration },
      start,
      snapEnabled
    );
    if (!chain) return;
    track.clips = applyCameraChain(track.clips, chain, clip);
    const sorted = [...track.clips].sort((a, b) => a.start - b.start);
    const idx = sorted.findIndex((c) => c.id === newId);
    if (idx > 0) relinkFollowingZoomPositions(sorted, idx - 1);
    track.clips = sorted;
    onProjectChange(next);
    onSelect({ kind: "camera", trackId: track.id as CameraTrackId, clipId: newId });
  };

  const removeMotorClip = (trackId: string, clipId: string) => {
    const next = structuredClone(project);
    const track = next.tracks.find((t) => t.id === trackId);
    if (!track) return;
    track.clips = removeClipFromChain(track.clips, clipId);
    onProjectChange(next);
    if (selection?.kind === "motor" && selection.clipId === clipId) onSelect(null);
  };

  const removeCameraClip = (trackId: string, clipId: string) => {
    const next = structuredClone(project);
    const track = next.camera_tracks.find((t) => t.id === trackId);
    if (!track) return;
    track.clips = removeClipFromChain(track.clips, clipId);
    onProjectChange(next);
    if (selection?.kind === "camera" && selection.clipId === clipId) onSelect(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const item = readDragClip(e);
    const canvas = canvasRef.current;
    if (!item || !canvas) return;

    const resolved = resolveDropTrack(canvas, e.clientY, item);
    if (!resolved) return;

    const rect = resolved.lane.getBoundingClientRect();
    addClipFromPalette(item, resolved, timeFromX(e.clientX, rect.left));
  };

  const handleLaneClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as Element).closest(".clip-block")) return;
    if (!activePaletteItem || !canvasRef.current) return;

    const resolved = resolveDropTrack(canvasRef.current, e.clientY, activePaletteItem);
    if (!resolved) return;
    const rect = resolved.lane.getBoundingClientRect();
    addClipFromPalette(activePaletteItem, resolved, timeFromX(e.clientX, rect.left));
  };

  const toggleMotorDirection = (trackId: string, clipId: string) => {
    const next = structuredClone(project);
    const track = next.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const sorted = [...track.clips].sort((a, b) => a.start - b.start);
    const idx = sorted.findIndex((c) => c.id === clipId);
    if (idx < 0) return;
    const clip = sorted[idx];
    reverseMotorClip(clip, track.axis);
    relinkFollowingMovePositions(sorted, idx, track.axis);
    relinkFollowingClipStarts(sorted, idx);
    track.clips = sorted;
    onProjectChange(next);
  };

  const toggleCameraDirection = (trackId: string, clipId: string) => {
    const next = structuredClone(project);
    const track = next.camera_tracks.find((t) => t.id === trackId);
    if (!track) return;
    const sorted = [...track.clips].sort((a, b) => a.start - b.start);
    const idx = sorted.findIndex((c) => c.id === clipId);
    if (idx < 0) return;
    const clip = sorted[idx];
    reverseCameraClip(clip);
    relinkFollowingZoomPositions(sorted, idx);
    relinkFollowingClipStarts(sorted, idx);
    track.clips = sorted;
    onProjectChange(next);
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;

      if (drag.mode === "scrub") {
        const scroll = scrollRef.current;
        const ruler = scroll?.querySelector(".ruler") as HTMLElement | null;
        if (!ruler) return;
        const rect = ruler.getBoundingClientRect();
        onSeek(timeFromX(e.clientX, rect.left));
        return;
      }

      if (drag.mode === "pan") {
        const scroll = scrollRef.current;
        if (!scroll) return;
        scroll.scrollLeft = Math.max(0, drag.startScrollLeft - (e.clientX - drag.startX));
        syncViewportDuration();
        return;
      }

      if (drag.mode === "row-resize") {
        const dy = e.clientY - drag.startY;
        setTrackHeight(drag.trackId, drag.kind, drag.startHeight + dy);
        return;
      }

      if (!lanesRef.current) return;
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
          track.clips = moveClipInChain(track.clips, clip.id, t, snapEnabled);
        } else {
          const end = timeFromX(e.clientX, rect.left);
          track.clips = resizeClipInChain(track.clips, clip.id, end - clip.start);
        }
      } else {
        const track = next.camera_tracks.find((t) => t.id === drag.trackId);
        const clip = track?.clips.find((c) => c.id === drag.clipId);
        if (!track || !clip) return;

        if (drag.mode === "move") {
          const t = timeFromX(e.clientX - drag.offsetX, rect.left);
          track.clips = moveClipInChain(track.clips, clip.id, t, snapEnabled);
        } else {
          const end = timeFromX(e.clientX, rect.left);
          track.clips = resizeClipInChain(track.clips, clip.id, end - clip.start);
        }
      }

      onProjectChange(next);
    },
    [drag, project, timeFromX, onProjectChange, onSeek, syncViewportDuration]
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

  const zoomAtClientX = useCallback(
    (clientX: number, deltaY: number) => {
      const scroll = scrollRef.current;
      if (!scroll) return;

      const rect = scroll.getBoundingClientRect();
      const anchorX = clientX - rect.left + scroll.scrollLeft;
      const timeAtMouse = (anchorX - TRACK_LABEL_WIDTH) / pps;
      const nextPps = zoomFromWheel(pps, deltaY);
      if (nextPps === pps) return;

      setPixelsPerSecond(nextPps);
      requestAnimationFrame(() => {
        const newAnchorX = TRACK_LABEL_WIDTH + timeAtMouse * nextPps;
        scroll.scrollLeft = Math.max(0, newAnchorX - (clientX - rect.left));
        syncViewportDuration();
      });
    },
    [pps, syncViewportDuration]
  );

  const onTimelineWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scroll = scrollRef.current;
    if (!scroll) return;

    const zoomModifier = e.ctrlKey || e.metaKey || e.altKey;
    if (zoomModifier) {
      zoomAtClientX(e.clientX, e.deltaY);
      return;
    }

    const delta = e.shiftKey ? e.deltaY * 1.5 : e.deltaY + e.deltaX;
    scroll.scrollLeft = Math.max(0, scroll.scrollLeft + delta);
    syncViewportDuration();
  };

  const startPan = (clientX: number) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    setDrag({ mode: "pan", startX: clientX, startScrollLeft: scroll.scrollLeft });
  };

  const zoomToFit = () => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const content = Math.max(contentDuration(project), MIN_TIMELINE_DURATION_SEC);
    const fit = pixelsPerSecondForFit(content, scroll.clientWidth, TRACK_LABEL_WIDTH);
    setPixelsPerSecond(fit);
    scroll.scrollLeft = 0;
    const visibleEnd = viewportEndTime(0, scroll.clientWidth, fit, TRACK_LABEL_WIDTH);
    onEnsureDuration(requiredTimelineDuration(project, visibleEnd));
  };

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const onScroll = () => syncViewportDuration();
    scroll.addEventListener("scroll", onScroll);
    return () => scroll.removeEventListener("scroll", onScroll);
  }, [syncViewportDuration]);

  useEffect(() => {
    syncViewportDuration();
  }, [pps, project.duration, syncViewportDuration]);

  const renderMotorClip = (
    track: (typeof project.tracks)[0],
    clip: MotorClip,
    rowH: number
  ) => {
    if (clipIsOffTimeline(clip.start, clip.duration, project.duration)) return null;

    const { left, top, width: clipW, height: clipH } = clipRectInLane(
      clip.start,
      clip.duration,
      rowH,
      pps,
      project.duration,
      36
    );
    const selected =
      selection?.kind === "motor" &&
      selection.trackId === track.id &&
      selection.clipId === clip.id;
    const showGraph = clip.type !== "RecordedClip" && clipH >= 36 && clipW >= 40;
    const showDirection = motorSupportsDirection(clip);

    return (
      <div
        key={clip.id}
        className={`clip-block motor ${selected ? "selected" : ""} ${showGraph ? "has-graph" : ""}`}
        style={{
          left,
          top,
          width: clipW,
          height: clipH,
          maxHeight: rowH - 8,
          background: showGraph
            ? undefined
            : `linear-gradient(180deg, ${track.color}dd, ${track.color}99)`,
          ["--clip-color" as string]: track.color,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ kind: "motor", trackId: track.id, clipId: clip.id });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeMotorClip(track.id, clip.id);
        }}
        onPointerDown={(e) => {
          const el = e.target as Element;
          if (
            el.classList.contains("resize-handle") ||
            el.classList.contains("clip-direction-btn") ||
            el.classList.contains("speed-graph-point") ||
            el.classList.contains("speed-graph-hit") ||
            el.closest(".clip-speed-graph") ||
            el.closest(".clip-graph-label")
          ) {
            return;
          }
          if (showGraph) return;
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
        {!showGraph && (
          <div className="clip-block-header">
            {showDirection && (
              <button
                type="button"
                className={`clip-direction-btn ${axisUsesVerticalDirection(track.axis) ? "vertical" : "horizontal"}`}
                title={motorDirectionTitle(track.axis, clip)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMotorDirection(track.id, clip.id);
                }}
              >
                {motorDirectionIcon(track.axis, clip)}
              </button>
            )}
            <span className="clip-title">{clipLabel(clip)}</span>
            {clip.type === "JogClip" && (
              <span className="clip-sub">v={clip.velocity}</span>
            )}
          </div>
        )}
        {showGraph && (
          <>
            <div className="clip-graph-chrome">
              {showDirection && (
                <button
                  type="button"
                  className={`clip-direction-btn on-graph ${axisUsesVerticalDirection(track.axis) ? "vertical" : "horizontal"}`}
                  title={motorDirectionTitle(track.axis, clip)}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMotorDirection(track.id, clip.id);
                  }}
                >
                  {motorDirectionIcon(track.axis, clip)}
                </button>
              )}
            </div>
            <div
              className="clip-drag-strip"
              title="Drag to move clip"
              onPointerDown={(e) => {
                e.stopPropagation();
                const lane = e.currentTarget.closest(".clip-block") as HTMLElement;
                const rect = lane.getBoundingClientRect();
                setDrag({
                  mode: "move",
                  kind: "motor",
                  trackId: track.id,
                  clipId: clip.id,
                  offsetX: e.clientX - rect.left,
                });
              }}
            />
            <ClipSpeedGraph
              clip={clip}
              clipWidth={clipW}
              clipHeight={clipH}
              snapEnabled={snapEnabled}
              selected={selected}
              label={clipLabel(clip)}
              onCurveChange={(curve) => updateMotorCurve(track.id, clip.id, curve)}
            />
          </>
        )}
        <span
          className="resize-handle"
          onPointerDown={(e) => {
            e.stopPropagation();
            setDrag({ mode: "resize", kind: "motor", trackId: track.id, clipId: clip.id });
          }}
        />
      </div>
    );
  };

  const renderCameraClip = (
    track: (typeof project.camera_tracks)[0],
    clip: CameraClip,
    rowH: number
  ) => {
    if (clipIsOffTimeline(clip.start, clip.duration, project.duration)) return null;

    const { left, top, width: clipW, height: clipH } = clipRectInLane(
      clip.start,
      clip.duration,
      rowH,
      pps,
      project.duration,
      24
    );
    const selected =
      selection?.kind === "camera" &&
      selection.trackId === track.id &&
      selection.clipId === clip.id;
    const showDirection = cameraSupportsDirection(clip);
    const reversed = isCameraReversed(clip);

    return (
      <div
        key={clip.id}
        className={`clip-block camera ${selected ? "selected" : ""}`}
        style={{
          left,
          top,
          width: clipW,
          height: clipH,
          maxHeight: rowH - 8,
          background: `linear-gradient(180deg, ${track.color}dd, ${track.color}99)`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ kind: "camera", trackId: track.id, clipId: clip.id });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          removeCameraClip(track.id, clip.id);
        }}
        onPointerDown={(e) => {
          const el = e.target as HTMLElement;
          if (el.classList.contains("resize-handle") || el.classList.contains("clip-direction-btn")) {
            return;
          }
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
        {showDirection && (
          <button
            type="button"
            className="clip-direction-btn"
            title={cameraDirectionTitle(clip, reversed)}
            onClick={(e) => {
              e.stopPropagation();
              toggleCameraDirection(track.id, clip.id);
            }}
          >
            {cameraDirectionLabel(reversed)}
          </button>
        )}
        <span className="clip-title">{clipLabel(clip)}</span>
        <span
          className="resize-handle"
          onPointerDown={(e) => {
            e.stopPropagation();
            setDrag({ mode: "resize", kind: "camera", trackId: track.id, clipId: clip.id });
          }}
        />
      </div>
    );
  };

  const visibleMotorTracks = useMemo(
    () => project.tracks.filter((t) => !hiddenTrackIds?.has(t.id)),
    [project.tracks, hiddenTrackIds]
  );
  const visibleCameraTracks = useMemo(
    () => project.camera_tracks.filter((t) => !hiddenTrackIds?.has(t.id)),
    [project.camera_tracks, hiddenTrackIds]
  );
  const hasVisibleTracks = visibleMotorTracks.length > 0 || visibleCameraTracks.length > 0;

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
        <button
          type="button"
          className="timeline-zoom-btn"
          title="Zoom out"
          onClick={() => {
            const scroll = scrollRef.current;
            if (!scroll) return;
            const rect = scroll.getBoundingClientRect();
            zoomAtClientX(rect.left + rect.width / 2, 1);
          }}
        >
          −
        </button>
        <button
          type="button"
          className="timeline-zoom-btn"
          title="Zoom in"
          onClick={() => {
            const scroll = scrollRef.current;
            if (!scroll) return;
            const rect = scroll.getBoundingClientRect();
            zoomAtClientX(rect.left + rect.width / 2, -1);
          }}
        >
          +
        </button>
        <button type="button" className="timeline-zoom-btn" onClick={zoomToFit}>
          Fit
        </button>
        <span className="timeline-zoom-label">{Math.round(pps)} px/s</span>
        <span className="timeline-hint">
          Drag motion to timeline · direction: ▲▼ boom/pitch, ◀▶ swing/yaw · right-click removes
        </span>
      </div>

      <div
        className={`timeline-scroll ${drag?.mode === "pan" ? "is-panning" : ""}`}
        ref={scrollRef}
        onWheel={onTimelineWheel}
        onPointerDown={(e) => {
          if (e.button !== 1) return;
          e.preventDefault();
          startPan(e.clientX);
        }}
      >
        <div
          className="timeline-canvas"
          ref={canvasRef}
          style={{ width: TRACK_LABEL_WIDTH + width } as React.CSSProperties}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          {hasVisibleTracks && (
            <div className="ruler-row">
              <div className="track-label head">Time</div>
              <div
                className="ruler"
                style={{ width }}
                onPointerDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onSeek(timeFromX(e.clientX, rect.left));
                  setDrag({ mode: "scrub" });
                }}
              >
                {rulerTicks.map(({ t, major }) => (
                  <span
                    key={t}
                    className={`ruler-tick ${major ? "major" : "minor"}`}
                    style={{ left: t * pps }}
                  >
                    {major ? formatRulerLabel(t) : ""}
                  </span>
                ))}
                <div className="playhead-head" style={{ left: playhead * pps }} />
              </div>
            </div>
          )}

          {visibleMotorTracks.length > 0 && (
            <div className="track-section-label">Motion axes</div>
          )}
          {visibleMotorTracks.map((track) => {
            const rowH = motorRowHeight(track);
            return (
              <div
                key={track.id}
                className="track-row"
                data-track-id={track.id}
              >
                <div
                  className="track-label"
                  style={{ borderLeftColor: track.color, minHeight: rowH }}
                >
                  {track.label}
                </div>
                <div
                  className="track-lane"
                  style={{ width, height: rowH }}
                  onClick={(e) => handleLaneClick(e)}
                >
                  {track.clips.map((clip) => renderMotorClip(track, clip, rowH))}
                </div>
                <div
                  className="track-row-resize"
                  title="Drag to resize track height"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDrag({
                      mode: "row-resize",
                      kind: "motor",
                      trackId: track.id,
                      startY: e.clientY,
                      startHeight: rowH,
                    });
                  }}
                />
              </div>
            );
          })}

          {visibleCameraTracks.length > 0 && (
            <div className="track-section-label camera">Camera · Sony ZV-1 II</div>
          )}
          {visibleCameraTracks.map((track) => {
            const rowH = cameraRowHeight(track);
            return (
              <div
                key={track.id}
                className="track-row camera"
                data-track-id={track.id}
              >
                <div
                  className="track-label"
                  style={{ borderLeftColor: track.color, minHeight: rowH }}
                >
                  {track.label}
                </div>
                <div
                  className="track-lane"
                  style={{ width, height: rowH }}
                  onClick={(e) => handleLaneClick(e)}
                >
                  {track.clips.map((clip) => renderCameraClip(track, clip, rowH))}
                </div>
                <div
                  className="track-row-resize"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDrag({
                      mode: "row-resize",
                      kind: "camera",
                      trackId: track.id,
                      startY: e.clientY,
                      startHeight: rowH,
                    });
                  }}
                />
              </div>
            );
          })}

          {hasVisibleTracks && (
            <div
              className="playhead-line"
              style={{ left: TRACK_LABEL_WIDTH + playhead * pps }}
              onPointerDown={(e) => {
                e.stopPropagation();
                const scroll = scrollRef.current;
                const ruler = scroll?.querySelector(".ruler") as HTMLElement | null;
                if (!ruler) return;
                const rect = ruler.getBoundingClientRect();
                onSeek(timeFromX(e.clientX, rect.left));
                setDrag({ mode: "scrub" });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
