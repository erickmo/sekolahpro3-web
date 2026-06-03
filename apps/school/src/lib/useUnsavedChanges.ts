import { useEffect } from "react";

/**
 * Warn the user before the tab unloads (close/reload/navigate-away) while they
 * hold unsaved CMS edits, so layout/content work in the situs editor is not lost
 * silently. No-op when `dirty` is false. Cleans up its listener on unmount.
 *
 * @param dirty - true when the local form/array diverges from the saved server state.
 */
export function useUnsavedChanges(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      // Calling preventDefault + setting returnValue is what triggers the
      // browser's native "leave site?" confirmation across engines.
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
