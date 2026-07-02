import type { ReactNode } from "react";

type Props = {
  side: "left" | "right";
  collapsed: boolean;
  onToggle: () => void;
  label: string;
  children: ReactNode;
};

function Chevron({ side, collapsed }: { side: "left" | "right"; collapsed: boolean }) {
  const expand = (side === "left" && collapsed) || (side === "right" && collapsed);
  const points =
    side === "left"
      ? expand
        ? "8 5 14 12 8 19"
        : "14 5 8 12 14 19"
      : expand
        ? "16 5 10 12 16 19"
        : "10 5 16 12 10 19";

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d={`M${points}`} />
    </svg>
  );
}

export function CollapsibleSidebar({ side, collapsed, onToggle, label, children }: Props) {
  return (
    <div
      className={["sidebar-rail", `sidebar-rail-${side}`, collapsed ? "collapsed" : "expanded"].join(" ")}
    >
      <div className="sidebar-rail-content">{children}</div>
      <button
        type="button"
        className="sidebar-fold-btn"
        onClick={onToggle}
        title={collapsed ? `Show ${label}` : `Hide ${label}`}
        aria-label={collapsed ? `Show ${label}` : `Hide ${label}`}
        aria-expanded={!collapsed}
      >
        <Chevron side={side} collapsed={collapsed} />
      </button>
    </div>
  );
}
