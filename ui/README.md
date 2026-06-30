# Cam Rig UI

React + Vite timeline editor and live jog panel.

## Development

```bash
npm install
npm run dev
```

Set `VITE_WS_URL=ws://192.168.1.x:8080/ws` to point at the Pi.

## Screens

- **Live** — per-axis velocity sliders
- **Timeline** — 4 motor tracks + camera tracks, drag jog clips, play/stop

## Production build

```bash
npm run build
```

Serve `dist/` from the Pi (nginx/caddy) or open from laptop against Pi API.
