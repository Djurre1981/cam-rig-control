import { useCallback, useEffect, useRef, useState } from "react";
import { AXIS_LABELS } from "./types";
import { Timeline } from "./components/Timeline";
import exampleProject from "./data/example_slow_swing.json";
import type { TimelineProject } from "./types";

const WS_URL =
  import.meta.env.VITE_WS_URL ??
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8080/ws`;

export default function App() {
  const [tab, setTab] = useState<"live" | "timeline">("live");
  const [connected, setConnected] = useState(false);
  const [velocities, setVelocities] = useState([0, 0, 0, 0]);
  const [project, setProject] = useState<TimelineProject>(
    exampleProject as TimelineProject
  );
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "playback.frame") {
        setPlayhead(msg.t);
      }
    };
    return () => ws.close();
  }, []);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const jog = (axis: number, value: number) => {
    const next = [...velocities];
    next[axis] = value;
    setVelocities(next);
    send({ type: "motion.jog", velocities: next });
  };

  const stopAll = () => {
    setVelocities([0, 0, 0, 0]);
    send({ type: "motion.stop" });
  };

  useEffect(() => {
    if (!playing) return;
    const start = performance.now() - playhead * 1000;
    const id = setInterval(() => {
      const t = (performance.now() - start) / 1000;
      if (t >= project.duration) {
        setPlaying(false);
        send({ type: "motion.stop" });
        return;
      }
      send({ type: "playback.tick", t });
    }, 50);
    return () => clearInterval(id);
  }, [playing, playhead, project.duration, send]);

  return (
    <div className="app">
      <header>
        <h1>Cam Rig Control</h1>
        <span className={`status ${connected ? "on" : "off"}`}>
          {connected ? "Connected" : "Disconnected"}
        </span>
        <nav>
          <button
            className={tab === "live" ? "active" : ""}
            onClick={() => setTab("live")}
          >
            Live
          </button>
          <button
            className={tab === "timeline" ? "active" : ""}
            onClick={() => setTab("timeline")}
          >
            Timeline
          </button>
        </nav>
      </header>

      {tab === "live" && (
        <section className="live">
          {AXIS_LABELS.map((label, i) => (
            <div key={label} className="axis-row">
              <label>{label}</label>
              <input
                type="range"
                min={-500}
                max={500}
                value={velocities[i]}
                onChange={(e) => jog(i, Number(e.target.value))}
              />
              <span>{velocities[i]}</span>
            </div>
          ))}
          <button className="danger" onClick={stopAll}>
            Stop all
          </button>
        </section>
      )}

      {tab === "timeline" && (
        <section className="timeline-section">
          <div className="transport">
            <button onClick={() => { setPlayhead(0); setPlaying(true); }}>
              Play
            </button>
            <button onClick={() => { setPlaying(false); send({ type: "motion.stop" }); }}>
              Stop
            </button>
            <span>
              {playhead.toFixed(1)}s / {project.duration}s
            </span>
          </div>
          <Timeline
            project={project}
            playhead={playhead}
            onProjectChange={setProject}
          />
        </section>
      )}
    </div>
  );
}
