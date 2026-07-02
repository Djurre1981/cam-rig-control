import type { ReactNode } from "react";

export type PanelTab<T extends string> = {
  id: T;
  label: string;
  badge?: string;
  title?: string;
};

type Props<T extends string> = {
  tabs: PanelTab<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  children: ReactNode;
};

export function PanelTabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
  children,
}: Props<T>) {
  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div className={["panel-tabs-shell", className].filter(Boolean).join(" ")}>
      <div className="panel-tabs" role="tablist" aria-label="Sidebar panels">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`panel-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls="panel-tabpanel-active"
            title={tab.title}
            className={["panel-tab", active === tab.id ? "active" : ""].filter(Boolean).join(" ")}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {tab.badge ? <span className="panel-tab-badge">{tab.badge}</span> : null}
          </button>
        ))}
      </div>
      <div
        id="panel-tabpanel-active"
        role="tabpanel"
        aria-labelledby={activeTab ? `panel-tab-${activeTab.id}` : undefined}
        className="panel-tabpanel"
      >
        {children}
      </div>
    </div>
  );
}
