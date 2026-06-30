# Host services

Run from `host/` with venv activated:

```bash
python -m api.main
```

## Modules

| Module | Role |
|--------|------|
| `motion_service` | Serial protocol to Mega |
| `camera_service` | ZV-1 II PTP (stub) |
| `timeline_engine` | Clip interpolation |
| `api` | FastAPI + WebSocket |
| `bench_waveshare` | Pi HAT desk test only |

## WebSocket messages

**Client → server**

```json
{"type": "motion.jog", "velocities": [0, 120, 0, -50]}
{"type": "motion.stop"}
{"type": "motion.home_boom"}
{"type": "camera.record", "action": "start"}
{"type": "playback.tick", "t": 3.5}
```

**Server → client**

```json
{"type": "playback.frame", "t": 3.5, "velocities": [...], "camera": {}}
```
