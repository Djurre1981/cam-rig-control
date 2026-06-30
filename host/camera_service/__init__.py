"""Sony ZV-1 II camera control — stub until PTP backend is wired."""

from __future__ import annotations

from enum import Enum


class CameraBackend(str, Enum):
    STUB = "stub"
    PTP = "ptp"


class CameraService:
  def __init__(self, backend: CameraBackend = CameraBackend.STUB) -> None:
    self.backend = backend
    self._recording = False

  def connect(self) -> None:
    if self.backend == CameraBackend.PTP:
      raise NotImplementedError(
        "Integrate Sony Camera Remote Command — see docs/camera_zv1m2.md"
      )

  def start_movie(self) -> None:
    self._recording = True

  def stop_movie(self) -> None:
    self._recording = False

  def zoom(self, direction: str, speed: int = 3) -> None:
    pass  # direction: in | out | stop

  def focus(self, direction: str, step: int = 1) -> None:
    pass  # direction: near | far

  @property
  def is_recording(self) -> bool:
    return self._recording
