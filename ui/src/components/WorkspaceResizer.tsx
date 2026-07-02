import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const MIN_PREVIEW = 120;
const MAX_PREVIEW_RATIO = 0.72;
const STORAGE_KEY = "camrig-preview-ratio";

type Props = {
  top?: ReactNode;
  bottom: ReactNode;
};

export function WorkspaceResizer({ top, bottom }: Props) {
  const [ratio, setRatio] = useState(() => {
    if (typeof localStorage === "undefined") return 0.38;
    const saved = localStorage.getItem(STORAGE_KEY);
    const n = saved ? Number(saved) : 0.38;
    return Number.isFinite(n) ? Math.max(0.2, Math.min(MAX_PREVIEW_RATIO, n)) : 0.38;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const next = (e.clientY - rect.top) / rect.height;
    const clamped = Math.max(
      MIN_PREVIEW / rect.height,
      Math.min(MAX_PREVIEW_RATIO, next)
    );
    setRatio(clamped);
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  useEffect(() => {
    if (top) localStorage.setItem(STORAGE_KEY, String(ratio));
  }, [ratio, top]);

  const showTop = top != null;

  return (
    <div className="workspace-resizer" ref={containerRef}>
      {showTop && (
        <>
          <div className="workspace-resizer-top" style={{ flex: `${ratio} 1 0` }}>
            {top}
          </div>
          <div
            className="workspace-resizer-handle"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize preview and timeline"
            onPointerDown={onPointerDown}
          />
        </>
      )}
      <div
        className="workspace-resizer-bottom"
        style={{ flex: showTop ? `${1 - ratio} 1 0` : "1 1 0" }}
      >
        {bottom}
      </div>
    </div>
  );
}
