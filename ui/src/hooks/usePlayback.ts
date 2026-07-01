import { useEffect, useRef, useState } from "react";

export function usePlayback(duration: number) {
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const playheadRef = useRef(0);
  const rafRef = useRef<number>(0);

  playheadRef.current = playhead;

  useEffect(() => {
    if (!playing) return;

    const startWall = performance.now();
    const startPlayhead = playheadRef.current;

    const tick = () => {
      const elapsed = (performance.now() - startWall) / 1000;
      const t = startPlayhead + elapsed;
      if (t >= duration) {
        setPlayhead(duration);
        setPlaying(false);
        return;
      }
      setPlayhead(t);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration]);

  const play = () => {
    if (playheadRef.current >= duration) setPlayhead(0);
    setPlaying(true);
  };

  const pause = () => setPlaying(false);

  const stop = () => {
    setPlaying(false);
    setPlayhead(0);
  };

  const seek = (t: number) => {
    setPlayhead(Math.max(0, Math.min(duration, t)));
  };

  /** Bottango-style: scrubbing pauses playback unless play is explicitly resumed. */
  const scrub = (t: number) => {
    setPlaying(false);
    seek(t);
  };

  return { playing, playhead, play, pause, stop, seek, scrub };
}
