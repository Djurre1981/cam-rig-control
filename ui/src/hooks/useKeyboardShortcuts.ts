import { useEffect } from "react";
import { createShortcutHandler, DEFAULT_SHORTCUTS, type ShortcutAction } from "../lib/shortcutMap";

type Handlers = Partial<Record<ShortcutAction, () => void>>;

export function useKeyboardShortcuts(handlers: Handlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const full = {} as Record<ShortcutAction, () => void>;
    for (const key of Object.keys(DEFAULT_SHORTCUTS) as ShortcutAction[]) {
      full[key] = handlers[key] ?? (() => {});
    }
    const onKey = createShortcutHandler(DEFAULT_SHORTCUTS, full);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, handlers]);
}
