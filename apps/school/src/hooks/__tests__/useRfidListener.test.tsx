import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useRfidListener } from "../useRfidListener";

afterEach(() => cleanup());

function Harness({ onScan }: { onScan: (uid: string) => void }) {
  useRfidListener({ onScan });
  return null;
}

const fire = (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
};

describe("useRfidListener", () => {
  it("emits UID for fast burst terminated by Enter", () => {
    const onScan = vi.fn();
    render(<Harness onScan={onScan} />);
    "ABCDEF12".split("").forEach((k) => fire(k));
    fire("Enter");
    expect(onScan).toHaveBeenCalledWith("ABCDEF12");
  });

  it("does not emit for human-paced typing", async () => {
    vi.useFakeTimers();
    const onScan = vi.fn();
    render(<Harness onScan={onScan} />);
    fire("A");
    vi.advanceTimersByTime(200);
    fire("B");
    vi.advanceTimersByTime(200);
    fire("C");
    vi.advanceTimersByTime(200);
    fire("Enter");
    expect(onScan).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
