import { useEffect, useRef } from "react";

export type HotkeyHandler = (event: KeyboardEvent) => void;

export interface HotkeyMap {
  [key: string]: HotkeyHandler;
}

/**
 * Global keydown listener untuk teller workspace.
 *
 * Skip bila fokus di `<input>`, `<textarea>`, `<select>`, atau element
 * `contenteditable` — agar hotkey F-key tidak menelan input nominal.
 *
 * Match key by `event.key` (case-insensitive untuk huruf, exact untuk F-key
 * dan special key seperti "Escape", "Enter").
 */
export function useGlobalHotkeys(map: HotkeyMap, enabled: boolean = true): void {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const handler =
        mapRef.current[e.key] ??
        mapRef.current[e.key.toLowerCase()] ??
        mapRef.current[e.key.toUpperCase()];
      if (handler) {
        handler(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  const attr = target.getAttribute("contenteditable");
  if (attr !== null && attr !== "false") return true;
  return false;
}
