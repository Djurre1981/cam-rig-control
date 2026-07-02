import { useEffect, useId, useState, type ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Persist open/closed in sessionStorage */
  storageKey?: string;
  badge?: string;
  className?: string;
};

function loadOpen(storageKey: string | undefined, defaultOpen: boolean) {
  if (!storageKey) return defaultOpen;
  try {
    const raw = sessionStorage.getItem(`camrig-section-${storageKey}`);
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    /* ignore */
  }
  return defaultOpen;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  storageKey,
  badge,
  className,
}: Props) {
  const [open, setOpen] = useState(() => loadOpen(storageKey, defaultOpen));
  const panelId = useId();

  useEffect(() => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(`camrig-section-${storageKey}`, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open, storageKey]);

  return (
    <section
      className={["collapsible-section", open ? "open" : "collapsed", className]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="collapsible-section-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="collapsible-section-chevron" aria-hidden />
        <span className="collapsible-section-title">{title}</span>
        {badge ? <span className="collapsible-section-badge">{badge}</span> : null}
      </button>
      <div id={panelId} className="collapsible-section-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
