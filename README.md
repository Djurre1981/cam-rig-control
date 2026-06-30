# Cam Rig Control

Custom motion control stack for a 4-axis DIY camera arm ([DIW rig](https://www.thingiverse.com/thing:4652484)) with **Sony ZV-1 II** integration.

## Architecture

| Layer | Technology |
|-------|------------|
| Motion | Arduino Mega 2560 + custom velocity firmware |
| Host | Raspberry Pi 2 Model B (headless) |
| Camera | Sony Camera Remote Command (PTP/USB) |
| UI | React timeline + live jog (browser on laptop) |

## Quick start

### Firmware (Arduino IDE)

1. Open `firmware/cam_rig_mega/cam_rig_mega.ino`
2. Install library: **AccelStepper**
3. Board: **Arduino Mega 2560**
4. Upload; serial monitor @ 115200 → `READY cam_rig_mega 0.1.0`

Test: `J 100,0,0,0` then `STOP`

### Host (Raspberry Pi or dev PC)

```bash
cd host
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp config.example.yaml config.yaml   # set mega_port
cd api && python main.py
```

API: `http://0.0.0.0:8080/health`  
WebSocket: `ws://<host>:8080/ws`

### UI (development)

```bash
cd ui
npm install
npm run dev
```

Open `http://localhost:5173` (proxies API when configured).

## Documentation

- **[Build plan](docs/BUILD_PLAN.md)** — full hardware, firmware, and software phases
- [Hardware inventory](docs/hardware_inventory.md)
- [Pin map](docs/pin_map.md)
- [Sony ZV-1 II](docs/camera_zv1m2.md)

## Project status

| Component | Status |
|-----------|--------|
| 3D printed parts | Complete |
| Mechanical assembly | Not started |
| Motors | 2/4 ordered |
| Firmware | v0.1 scaffold |
| Host services | v0.1 scaffold |
| UI timeline | v0.1 scaffold |
| Sony PTP backend | Stub |

## License

GPL-3.0-or-later (firmware inherits GPL ecosystem choices; adjust as needed).
