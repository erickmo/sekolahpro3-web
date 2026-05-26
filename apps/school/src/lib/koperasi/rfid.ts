/**
 * RFID HID-keyboard buffer parser.
 *
 * HID-class RFID readers emulate a keyboard: they type the card UID very
 * fast (sub-50ms gap antar karakter) and terminate dengan Enter. Manusia
 * mengetik dengan gap jauh lebih lambat (>120ms typical). Heuristic ini
 * dipakai untuk membedakan input RFID dari ketikan manusia.
 *
 * Constants tunable via `RfidConfig`. Default cocok untuk reader generik
 * (Mifare 13.56MHz emit 8–10 hex chars in <80ms total).
 */

export interface RfidKeyEvent {
  key: string;
  /** Timestamp ms (event.timeStamp atau Date.now()). */
  t: number;
}

export interface RfidConfig {
  /** Gap maksimum (ms) antar keystroke dalam satu burst. */
  maxGapMs: number;
  /** Panjang minimum UID untuk diterima. */
  minLength: number;
  /** Panjang maksimum (guard against runaway). */
  maxLength: number;
}

export const DEFAULT_RFID_CONFIG: RfidConfig = {
  maxGapMs: 50,
  minLength: 6,
  maxLength: 32,
};

/**
 * Parse satu burst keystroke menjadi UID, atau null bila bukan pola RFID.
 *
 * Aturan:
 *   1. Setiap karakter setelah Enter atau gap > maxGapMs me-reset buffer.
 *   2. Hanya karakter alfanumerik di-append. Karakter lain (Shift, Tab, dst)
 *      di-skip; tidak me-reset buffer agar SHIFT+key tetap valid.
 *   3. Enter mengakhiri burst. Bila panjang buffer ∈ [min, max], emit UID.
 *      Bila tidak, return null.
 */
export function parseRfidBuffer(
  events: RfidKeyEvent[],
  config: RfidConfig = DEFAULT_RFID_CONFIG,
): string | null {
  let buf = "";
  let lastCharT: number | null = null;

  for (const ev of events) {
    if (ev.key === "Enter") {
      if (buf.length >= config.minLength && buf.length <= config.maxLength) {
        return buf;
      }
      return null;
    }

    if (ev.key.length === 1 && /[A-Za-z0-9]/.test(ev.key)) {
      if (lastCharT !== null && ev.t - lastCharT > config.maxGapMs) {
        buf = "";
      }
      lastCharT = ev.t;
      buf += ev.key;
    }
  }

  return null;
}

/** True jika gap antara dua event masih dalam ambang RFID (burst). */
export function isWithinBurst(
  prevT: number | null,
  currT: number,
  config: RfidConfig = DEFAULT_RFID_CONFIG,
): boolean {
  if (prevT === null) return true;
  return currT - prevT <= config.maxGapMs;
}
