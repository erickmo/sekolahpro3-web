import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useGlobalHotkeys, type HotkeyMap } from "../useGlobalHotkeys";

afterEach(() => cleanup());

function Harness({ map, enabled = true }: { map: HotkeyMap; enabled?: boolean }) {
  useGlobalHotkeys(map, enabled);
  return (
    <div>
      <input data-testid="inp" />
      <textarea data-testid="ta" />
      <div data-testid="ce" contentEditable="true" suppressContentEditableWarning />
    </div>
  );
}

const fire = (key: string, target: EventTarget = window) => {
  const ev = new KeyboardEvent("keydown", { key, bubbles: true });
  target.dispatchEvent(ev);
};

describe("useGlobalHotkeys", () => {
  it("fires handler for matching key", () => {
    const fn = vi.fn();
    render(<Harness map={{ F2: fn }} />);
    fire("F2");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("ignores keydown when target is <input>", () => {
    const fn = vi.fn();
    const { getByTestId } = render(<Harness map={{ F2: fn }} />);
    fire("F2", getByTestId("inp"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("ignores keydown when target is <textarea>", () => {
    const fn = vi.fn();
    const { getByTestId } = render(<Harness map={{ F2: fn }} />);
    fire("F2", getByTestId("ta"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("ignores keydown when target is contentEditable", () => {
    const fn = vi.fn();
    const { getByTestId } = render(<Harness map={{ F2: fn }} />);
    fire("F2", getByTestId("ce"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("does not fire when disabled", () => {
    const fn = vi.fn();
    render(<Harness map={{ F2: fn }} enabled={false} />);
    fire("F2");
    expect(fn).not.toHaveBeenCalled();
  });

  it("matches case-insensitive for letter keys", () => {
    const fn = vi.fn();
    render(<Harness map={{ a: fn }} />);
    fire("A");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
