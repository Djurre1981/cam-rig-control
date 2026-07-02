import { useCallback, useState } from "react";

const QUIPS = [
  (duration: number) => `v0.2 demo · ${duration}s workspace`,
  () => "Every frame a tiny love letter to motion",
  () => "Dragonframe walked so we could jog",
  () => "Boom goes the dynamite (gently)",
  () => "Click me again — I know more",
  () => "Smooth swings, smooth souls",
  () => "Built with caffeine and trigonometry",
];

type Props = {
  duration: number;
};

export function AppFooter({ duration }: Props) {
  const [quipIndex, setQuipIndex] = useState(0);

  const cycleQuip = useCallback(() => {
    setQuipIndex((i) => (i + 1) % QUIPS.length);
  }, []);

  return (
    <footer className="app-footer">
      <span>
        Design refs:{" "}
        <a href="https://github.com/EvanBottango/Bottango" target="_blank" rel="noreferrer">
          Bottango
        </a>
        ,{" "}
        <a href="https://www.dragonframe.com/dragonframe-software/" target="_blank" rel="noreferrer">
          Dragonframe Arc
        </a>
      </span>
      <button type="button" className="footer-status" onClick={cycleQuip} title="Click for morale">
        {QUIPS[quipIndex](duration)}
      </button>
    </footer>
  );
}
