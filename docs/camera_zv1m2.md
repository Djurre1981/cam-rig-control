# Sony ZV-1 II (ZV-1M2) — Remote Control

## Integration path

| Toolkit | ZV-1 II support |
|---------|-----------------|
| [Camera Remote Command](https://support.d-imaging.sony.co.jp/app/cameraremotecommand/en/index.html) | **Yes** — use this |
| [Camera Remote SDK](https://support.d-imaging.sony.co.jp/app/sdk/en/index.html) | **No** |

Protocol: PTP with Sony SDIO extensions over **USB** (Wi‑Fi optional later).

## Camera settings

1. Update firmware to latest
2. **Menu → USB → USB Connection Mode → PC Remote** (Remote Shoot)
3. Use a data-capable USB cable to the Pi 2

## Pi 2 USB setup

```bash
sudo sh -c 'echo 150 > /sys/module/usbcore/parameters/usbfs_memory_mb'
```

Persist in `/etc/rc.local` or a systemd oneshot before services start.

## Timeline camera tracks (v1)

| Track | Commands |
|-------|----------|
| `record` | `start_movie`, `stop_movie` |
| `zoom` | Optical zoom in/out/stop, position ramp |
| `focus` | `focus_near`, `focus_far`, hold |
| `exposure` | ISO, shutter, aperture (optional) |

## Development order

1. `lsusb` — confirm Sony device when in PC Remote mode
2. Download Sony Camera Remote Command package (reference + sample code)
3. Implement `host/camera_service/` PTP backend
4. Wire into `timeline_engine` and UI camera tracks

## Python libraries to evaluate

- Sony official sample (C++ → ctypes/port)
- [pysonycam](https://github.com/olkham/pysonycam) (Community, Command-based)
- `gphoto2` — quick probe only; may be incomplete for ZV-1M2

## Host API (planned)

WebSocket messages:

```json
{"type": "camera.record", "action": "start"}
{"type": "camera.zoom", "speed": 3, "direction": "in"}
{"type": "camera.focus", "direction": "near", "step": 1}
```
