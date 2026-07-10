export type ShortcutAction =
  | "playPause"
  | "stop"
  | "stepBack"
  | "stepForward"
  | "deleteSelection"
  | "save"
  | "toggleRecord"
  | "homeAll";

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  playPause: "Play / Pause",
  stop: "Stop",
  stepBack: "Step back 0.25 s",
  stepForward: "Step forward 0.25 s",
  deleteSelection: "Delete selection",
  save: "Save animation",
  toggleRecord: "Toggle motion record",
  homeAll: "Home all axes",
};

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  playPause: " ",
  stop: "Escape",
  stepBack: "ArrowLeft",
  stepForward: "ArrowRight",
  deleteSelection: "Delete",
  save: "ctrl+s",
  toggleRecord: "r",
  homeAll: "h",
};

function isInputTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function matchShortcut(e: KeyboardEvent, binding: string): boolean {
  const parts = binding.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const needCtrl = parts.includes("ctrl") || parts.includes("meta");
  const needShift = parts.includes("shift");
  const needAlt = parts.includes("alt");
  if (needCtrl && !(e.ctrlKey || e.metaKey)) return false;
  if (needShift && !e.shiftKey) return false;
  if (needAlt && !e.altKey) return false;
  if (key === " ") return e.key === " " || e.code === "Space";
  return e.key.toLowerCase() === key || e.code.toLowerCase() === key;
}

export function createShortcutHandler(
  bindings: Record<ShortcutAction, string>,
  handlers: Record<ShortcutAction, () => void>
) {
  return (e: KeyboardEvent) => {
    if (isInputTarget(e.target)) return;
    for (const action of Object.keys(bindings) as ShortcutAction[]) {
      if (matchShortcut(e, bindings[action])) {
        e.preventDefault();
        handlers[action]();
        return;
      }
    }
  };
}
