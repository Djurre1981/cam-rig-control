"""Interpolate timeline clips into motion + camera events at playback time."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class PlaybackFrame:
    t: float
    velocities: list[float]
    camera: dict[str, Any]


class TimelineEngine:
    def __init__(self) -> None:
        self.project: dict[str, Any] | None = None

    def load(self, path: Path) -> None:
        self.project = json.loads(path.read_text(encoding="utf-8"))

    def frame_at(self, t: float) -> PlaybackFrame:
        """Sample all tracks at time t (v0.1: constant-velocity clips only)."""
        v = [0.0, 0.0, 0.0, 0.0]
        camera: dict[str, Any] = {}
        if not self.project:
            return PlaybackFrame(t=t, velocities=v, camera=camera)

        for track in self.project.get("tracks", []):
            axis = track.get("axis")
            for clip in track.get("clips", []):
                start = clip.get("start", 0)
                dur = clip.get("duration", 0)
                if start <= t < start + dur:
                    if clip.get("type") == "JogClip" and axis is not None:
                        v[axis] = clip.get("velocity", 0.0)
                    break

        for track in self.project.get("camera_tracks", []):
            for clip in track.get("clips", []):
                start = clip.get("start", 0)
                dur = clip.get("duration", 0)
                if start <= t < start + dur:
                    camera[track["id"]] = clip
                    break

        return PlaybackFrame(t=t, velocities=v, camera=camera)
