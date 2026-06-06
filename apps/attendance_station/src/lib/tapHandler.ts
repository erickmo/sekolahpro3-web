/**
 * Tap business rules for the attendance station.
 *
 * Layer: domain logic (pure). Decides whether a scan is a duplicate of the
 * previous one, and which direction (in/out) to record based on station mode.
 */

/** A direction recorded for a tap. */
export type Direction = "in" | "out";

/** Station operating mode, set during pairing/config. */
export type StationMode = "gate" | "classroom" | "event";

/** A single tap event for a subject (student / staff). */
export interface Tap {
  /** Subject record id the card resolved to. */
  subjectId: string;
  /** When the tap happened, as epoch seconds. */
  at: number;
}

/**
 * Reports whether a tap duplicates the immediately preceding one.
 *
 * A tap is a duplicate when it targets the same subject and lands within
 * `windowSec` seconds of the previous tap (debounce against double-scans).
 *
 * @param prev - the previous tap.
 * @param next - the incoming tap.
 * @param windowSec - debounce window, in seconds.
 * @returns true when `next` should be ignored as a duplicate of `prev`.
 */
export function isDuplicate(prev: Tap, next: Tap, windowSec: number): boolean {
  return prev.subjectId === next.subjectId && next.at - prev.at <= windowSec;
}

/**
 * Determines the direction to record for the next tap.
 *
 * In `gate` mode the direction toggles relative to the subject's last
 * direction (defaulting to "in" when there is none). In `classroom` and
 * `event` modes every tap records an arrival ("in").
 *
 * @param mode - the station's operating mode.
 * @param last - the subject's last recorded direction, or null if none.
 * @returns the direction to record for the new tap.
 */
export function nextDirection(mode: StationMode, last: Direction | null): Direction {
  if (mode !== "gate") {
    return "in";
  }
  return last === "in" ? "out" : "in";
}
