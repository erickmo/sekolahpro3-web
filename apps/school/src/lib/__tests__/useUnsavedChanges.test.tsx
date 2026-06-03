// useUnsavedChanges: guards against losing unsaved CMS edits on tab close/reload.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useUnsavedChanges } from "../useUnsavedChanges";

afterEach(() => cleanup());

function fireBeforeUnload(): Event {
  const e = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(e);
  return e;
}

describe("useUnsavedChanges", () => {
  it("blocks unload while there are unsaved changes", () => {
    renderHook(() => useUnsavedChanges(true));
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
  });

  it("allows unload when there are no unsaved changes", () => {
    renderHook(() => useUnsavedChanges(false));
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it("stops blocking after unmount", () => {
    const { unmount } = renderHook(() => useUnsavedChanges(true));
    unmount();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});
