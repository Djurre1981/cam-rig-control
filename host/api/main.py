"""FastAPI hub — WebSocket for live jog, timeline playback, presets."""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

import yaml
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from camera_service import CameraBackend, CameraService
from motion_service import MotionService
from timeline_engine import TimelineEngine

CONFIG_PATH = Path(__file__).resolve().parents[1] / "config.yaml"
EXAMPLE = Path(__file__).resolve().parents[1] / "config.example.yaml"

app = FastAPI(title="Cam Rig Control API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

motion: MotionService | None = None
camera = CameraService(CameraBackend.STUB)
engine = TimelineEngine()


def load_config() -> dict:
    path = CONFIG_PATH if CONFIG_PATH.exists() else EXAMPLE
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


@app.on_event("startup")
async def startup() -> None:
    global motion
    cfg = load_config()
    port = cfg["serial"]["mega_port"]
    motion = MotionService(port, cfg["serial"]["baud"])
    try:
        motion.connect()
    except Exception as e:
        print(f"[warn] Mega not connected: {e}")
    try:
        camera.connect()
    except NotImplementedError as e:
        print(f"[warn] Camera: {e}")


@app.get("/health")
def health() -> dict:
    return {
        "ok": True,
        "mega": motion is not None,
        "camera_recording": camera.is_recording,
    }


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    cfg = load_config()
    hz = cfg["motion"]["command_hz"]
    interval = 1.0 / hz
    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            mtype = msg.get("type")

            if mtype == "motion.jog" and motion:
                motion.jog(msg.get("velocities", [0, 0, 0, 0]))
            elif mtype == "motion.stop" and motion:
                motion.stop()
            elif mtype == "motion.home_boom" and motion:
                motion.home_boom()
            elif mtype == "camera.record":
                if msg.get("action") == "start":
                    camera.start_movie()
                else:
                    camera.stop_movie()
            elif mtype == "camera.zoom":
                camera.zoom(msg.get("direction", "stop"), msg.get("speed", 3))
            elif mtype == "playback.tick":
                t = float(msg.get("t", 0))
                frame = engine.frame_at(t)
                if motion:
                    motion.jog(frame.velocities)
                await ws.send_json({
                    "type": "playback.frame",
                    "t": t,
                    "velocities": frame.velocities,
                    "camera": frame.camera,
                })

            await asyncio.sleep(interval)
    except WebSocketDisconnect:
        if motion:
            motion.stop()


def main() -> None:
    import uvicorn
    cfg = load_config()
    uvicorn.run(
        "api.main:app",
        host=cfg["api"]["host"],
        port=cfg["api"]["port"],
        reload=False,
    )


if __name__ == "__main__":
    main()
