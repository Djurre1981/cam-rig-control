import { useEffect, useRef, useState } from "react";
import type { AnimationMeta } from "../lib/animationLibrary";

type Props = {
  animations: AnimationMeta[];
  activeId: string;
  dirty: boolean;
  onSelect: (id: string) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
};

export function PresetSidebar({
  animations,
  activeId,
  dirty,
  onSelect,
  onSave,
  onSaveAs,
  onNew,
  onRename,
  onDuplicate,
  onDelete,
  compact,
}: Props) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuId) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuId]);

  const active = animations.find((a) => a.id === activeId);

  return (
    <div className={["preset-sidebar", compact ? "compact" : ""].filter(Boolean).join(" ")}>
      {!compact && (
        <div className="preset-sidebar-header">
          <h3>Animations</h3>
          <div className="preset-toolbar">
            <button type="button" className="preset-tool" onClick={onNew} title="New animation">
              New
            </button>
            <button
              type="button"
              className="preset-tool"
              onClick={onSave}
              disabled={!dirty}
              title="Save animation"
            >
              Save
            </button>
            <button type="button" className="preset-tool" onClick={onSaveAs} title="Save as new animation">
              Save as
            </button>
          </div>
        </div>
      )}

      {compact && (
        <div className="preset-toolbar preset-toolbar-inline">
          <button type="button" className="preset-tool" onClick={onNew} title="New animation">
            New
          </button>
          <button
            type="button"
            className="preset-tool"
            onClick={onSave}
            disabled={!dirty}
            title="Save animation"
          >
            Save
          </button>
          <button type="button" className="preset-tool" onClick={onSaveAs} title="Save as">
            As…
          </button>
        </div>
      )}

      {dirty && active && (
        <p className="preset-dirty-hint">Unsaved · {active.name}</p>
      )}

      <ul className="preset-list">
        {animations.map((anim) => {
          const isActive = anim.id === activeId;
          const showDirty = isActive && dirty;
          return (
            <li key={anim.id} className={`preset-item ${isActive ? "active" : ""}`}>
              <button
                type="button"
                className="preset-item-select"
                onClick={() => onSelect(anim.id)}
              >
                <span className="preset-item-name">
                  {anim.name}
                  {showDirty && <span className="preset-modified">•</span>}
                </span>
                {anim.userCreated && <span className="preset-item-badge">custom</span>}
                {anim.overridden && <span className="preset-item-badge">edited</span>}
              </button>
              <div className="preset-item-menu-wrap" ref={menuId === anim.id ? menuRef : undefined}>
                <button
                  type="button"
                  className="preset-item-menu-btn"
                  aria-label={`Actions for ${anim.name}`}
                  onClick={() => setMenuId(menuId === anim.id ? null : anim.id)}
                >
                  ⋮
                </button>
                {menuId === anim.id && (
                  <div className="preset-item-menu">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuId(null);
                        onRename(anim.id);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuId(null);
                        onDuplicate(anim.id);
                      }}
                    >
                      Save as copy
                    </button>
                    {anim.userCreated ? (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          setMenuId(null);
                          onDelete(anim.id);
                        }}
                      >
                        Delete
                      </button>
                    ) : anim.overridden ? (
                      <button
                        type="button"
                        className="danger"
                        onClick={() => {
                          setMenuId(null);
                          onDelete(anim.id);
                        }}
                      >
                        Revert to original
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {!compact && (
        <p className="preset-note">Animations are saved in this browser. Use Save before switching if you have edits.</p>
      )}
    </div>
  );
}
