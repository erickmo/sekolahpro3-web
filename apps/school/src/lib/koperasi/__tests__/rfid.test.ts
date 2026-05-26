import { describe, it, expect } from "vitest";
import {
  parseRfidBuffer,
  isWithinBurst,
  DEFAULT_RFID_CONFIG,
  type RfidKeyEvent,
} from "../rfid";

const burst = (chars: string, startT = 0, gap = 10): RfidKeyEvent[] =>
  Array.from(chars).map((c, i) => ({ key: c, t: startT + i * gap }));

const enterAt = (t: number): RfidKeyEvent => ({ key: "Enter", t });

describe("parseRfidBuffer", () => {
  it("returns UID for fast burst terminated by Enter", () => {
    const events = [...burst("A1B2C3D4", 0, 10), enterAt(90)];
    expect(parseRfidBuffer(events)).toBe("A1B2C3D4");
  });

  it("returns null for human-paced typing", () => {
    const events: RfidKeyEvent[] = [
      { key: "A", t: 0 },
      { key: "1", t: 200 },
      { key: "B", t: 400 },
      enterAt(600),
    ];
    expect(parseRfidBuffer(events)).toBeNull();
  });

  it("returns null when buffer too short", () => {
    const events = [...burst("AB", 0, 5), enterAt(20)];
    expect(parseRfidBuffer(events)).toBeNull();
  });

  it("returns null without Enter terminator", () => {
    expect(parseRfidBuffer(burst("A1B2C3D4", 0, 10))).toBeNull();
  });

  it("ignores modifier keys without resetting buffer", () => {
    const events: RfidKeyEvent[] = [
      { key: "A", t: 0 },
      { key: "Shift", t: 10 },
      { key: "1", t: 20 },
      { key: "B", t: 30 },
      { key: "2", t: 40 },
      { key: "C", t: 50 },
      { key: "3", t: 60 },
      enterAt(70),
    ];
    expect(parseRfidBuffer(events)).toBe("A1B2C3");
  });

  it("resets buffer when gap exceeds threshold mid-stream", () => {
    const events: RfidKeyEvent[] = [
      { key: "X", t: 0 },
      { key: "Y", t: 5 },
      { key: "A", t: 500 },
      { key: "1", t: 510 },
      { key: "B", t: 520 },
      { key: "2", t: 530 },
      { key: "C", t: 540 },
      { key: "3", t: 550 },
      enterAt(560),
    ];
    expect(parseRfidBuffer(events)).toBe("A1B2C3");
  });

  it("rejects when buffer exceeds maxLength", () => {
    const long = "A".repeat(40);
    const events = [...burst(long, 0, 5), enterAt(40 * 5 + 10)];
    expect(parseRfidBuffer(events)).toBeNull();
  });

  it("honors custom config", () => {
    const events = [...burst("ABCD", 0, 30), enterAt(150)];
    expect(parseRfidBuffer(events, { ...DEFAULT_RFID_CONFIG, minLength: 4, maxGapMs: 40 })).toBe("ABCD");
  });
});

describe("isWithinBurst", () => {
  it("returns true on first event (prevT null)", () => {
    expect(isWithinBurst(null, 100)).toBe(true);
  });

  it("returns true when gap <= maxGapMs", () => {
    expect(isWithinBurst(100, 140)).toBe(true);
  });

  it("returns false when gap > maxGapMs", () => {
    expect(isWithinBurst(100, 200)).toBe(false);
  });
});
