// ABS-002 — HID card-reader adapter (USB keyboard-wedge).
//
// Most cheap RFID/NFC desk readers emulate a USB keyboard: they "type" the card
// UID as printable characters followed by Enter, far faster than a human can
// type. This thin adapter listens for keydown events on a target element,
// buffers the typed characters, and — on Enter — uses inter-keystroke timing to
// decide whether the input came from a reader (fast) or a human (slow). Only
// reader input fires `onUid`.
//
// Layer: infrastructure adapter (DOM-bound). The classification helper is pure
// and unit-tested (// ABS-002); the DOM wiring is hardware-bound and verified
// manually (see MANUAL TEST below).
//
// MANUAL TEST:
//   1. Plug a USB HID card reader into the station device.
//   2. Open the station screen and ensure it has focus (click the page body).
//   3. Tap a card on the reader.
//   4. Expect: `onUid` fires once with the card UID string; the buffer resets
//      so the next tap is independent.
//   5. Type a few characters by hand + Enter → `onUid` must NOT fire (timing
//      classifies as "human").

/** A keyboard-wedge source: fast bursts are readers, slow typing is human. */
export type KeystrokeSource = "reader" | "human";

/**
 * Max median inter-keystroke gap (ms) still considered a hardware reader.
 *
 * HID readers emit characters within a few ms of each other; human typing is
 * tens to hundreds of ms apart. 50ms sits comfortably between the two.
 */
export const READER_MAX_INTERKEY_MS = 50;

/** Key name that terminates a card read. */
const SUBMIT_KEY = "Enter";

/**
 * Classifies a sequence of inter-keystroke deltas as reader or human input.
 *
 * Uses the MEDIAN delta (robust to a single slow outlier — e.g. the first
 * keystroke after focus). A median at or below `READER_MAX_INTERKEY_MS` is a
 * reader; anything slower is treated as human. An empty delta list (0 or 1
 * keystroke) is conservatively classified as "human" — too little signal.
 *
 * @param deltasMs - inter-keystroke gaps in milliseconds, in capture order.
 * @returns "reader" when the median gap is fast enough, otherwise "human".
 */
export function classifyKeystrokeTiming(deltasMs: number[]): KeystrokeSource {
  if (deltasMs.length === 0) {
    return "human";
  }
  const median = computeMedian(deltasMs);
  return median <= READER_MAX_INTERKEY_MS ? "reader" : "human";
}

/**
 * Returns the median of a non-empty number list (averages the middle pair for
 * even-length lists). Does not mutate the input.
 *
 * @param values - non-empty list of numbers.
 * @returns the median value.
 */
function computeMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  // sorted is non-empty (caller guards), so these indices are always defined;
  // `?? 0` satisfies noUncheckedIndexedAccess without changing behaviour.
  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? 0;
  }
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** Options for {@link attachHidListener}. */
export interface HidListenerOptions {
  /** Called with the accumulated UID when a reader scan completes. */
  onUid: (uid: string) => void;
  /** Timing classifier; defaults to {@link classifyKeystrokeTiming}. */
  classifier?: (deltasMs: number[]) => KeystrokeSource;
}

/** Subset of EventTarget we wire onto (keeps the adapter testable/minimal). */
type KeydownTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

/**
 * Attaches a keydown listener that turns HID card-reader input into `onUid`
 * calls. Printable characters accumulate into a buffer with their timestamps;
 * on Enter, if the inter-keystroke timing classifies as "reader" and the buffer
 * is non-empty, `onUid(buffer)` fires. The buffer always resets on Enter.
 *
 * DOM wiring is hardware-bound and NOT unit-tested — see MANUAL TEST in the file
 * header.
 *
 * @param target - element/document to listen on.
 * @param options - {@link HidListenerOptions} (onUid required, classifier optional).
 * @returns a cleanup function that removes the listener.
 */
export function attachHidListener(target: KeydownTarget, options: HidListenerOptions): () => void {
  const classify = options.classifier ?? classifyKeystrokeTiming;
  let buffer = "";
  let lastAt = 0;
  let deltas: number[] = [];

  const reset = (): void => {
    buffer = "";
    lastAt = 0;
    deltas = [];
  };

  const handler = (event: Event): void => {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === SUBMIT_KEY) {
      if (buffer.length > 0 && classify(deltas) === "reader") {
        options.onUid(buffer);
      }
      reset();
      return;
    }
    // Ignore non-printable keys (modifiers, arrows): they carry no UID payload.
    if (keyEvent.key.length !== 1) {
      return;
    }
    const now = keyEvent.timeStamp;
    if (lastAt > 0) {
      deltas.push(now - lastAt);
    }
    lastAt = now;
    buffer += keyEvent.key;
  };

  target.addEventListener("keydown", handler);
  return () => target.removeEventListener("keydown", handler);
}
