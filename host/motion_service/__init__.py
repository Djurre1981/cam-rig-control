"""USB serial bridge to Arduino Mega motion firmware."""

from __future__ import annotations

import threading
import time
from typing import Callable, Optional

try:
    import serial
except ImportError:
    serial = None  # type: ignore


class MotionService:
    def __init__(self, port: str, baud: int = 115200) -> None:
        self.port = port
        self.baud = baud
        self._ser: Optional["serial.Serial"] = None
        self._lock = threading.Lock()
        self._positions = [0, 0, 0, 0]
        self._on_position: Optional[Callable[[list[int]], None]] = None

    def connect(self) -> None:
        if serial is None:
            raise RuntimeError("pyserial not installed")
        self._ser = serial.Serial(self.port, self.baud, timeout=0.1)
        time.sleep(2)  # Mega reset

    def close(self) -> None:
        if self._ser and self._ser.is_open:
            self._ser.close()

    def _send(self, line: str) -> str:
        if not self._ser or not self._ser.is_open:
            raise RuntimeError("Mega not connected")
        with self._lock:
            self._ser.write((line.strip() + "\n").encode())
            self._ser.flush()
            reply = self._ser.readline().decode(errors="ignore").strip()
            return reply

    def jog(self, velocities: list[float]) -> None:
        if len(velocities) != 4:
            raise ValueError("Expected 4 velocities")
        v = ",".join(f"{x:.2f}" for x in velocities)
        self._send(f"J {v}")

    def stop(self) -> None:
        self._send("STOP")

    def home_boom(self) -> None:
        self._send("HOME 0")

    def poll_positions(self) -> list[int]:
        reply = self._send("P")
        if reply.startswith("P "):
            parts = reply[2:].split(",")
            self._positions = [int(p) for p in parts]
            if self._on_position:
                self._on_position(self._positions)
        return list(self._positions)

    def set_position_callback(self, cb: Callable[[list[int]], None]) -> None:
        self._on_position = cb
