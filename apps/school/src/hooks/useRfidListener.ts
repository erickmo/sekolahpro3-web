import { useEffect, useRef } from "react";
import {
  DEFAULT_RFID_CONFIG,
  parseRfidBuffer,
  type RfidConfig,
  type RfidKeyEvent,
} from "../lib/koperasi/rfid";

export interface UseRfidListenerOptions {
  enabled?: boolean;
  config?: RfidConfig;
  onScan: (uid: string) => void;
}

/**
 * Window-level RFID listener.
 *
 * Buffer ditambah setiap keydown; Enter memicu parse + flush. Karena reader
 * HID-class emit burst cepat dengan terminator Enter, parser cukup feed
 * seluruh burst lalu return UID bila lulus heuristik.
 *
 * Buffer di-flush juga setelah idle > 2 × maxGapMs (mencegah stale data
 * lintas event saat halaman idle).
 */
export function useRfidListener(opts: UseRfidListenerOptions): void {
  const { enabled = true, onScan } = opts;
  const config = opts.config ?? DEFAULT_RFID_CONFIG;
  const bufferRef = useRef<RfidKeyEvent[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const flushStale = () => {
      bufferRef.current = [];
      flushTimerRef.current = null;
    };

    const onKey = (e: KeyboardEvent) => {
      // RFID listener bekerja di latar — tidak peduli fokus input;
      // tapi tidak menelan event (no preventDefault). Bila pola RFID
      // matched, kita panggil onScan; consumer boleh ambil tindakan.
      const t = performance.now();
      bufferRef.current.push({ key: e.key, t });

      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
      flushTimerRef.current = window.setTimeout(flushStale, config.maxGapMs * 2);

      if (e.key === "Enter") {
        const uid = parseRfidBuffer(bufferRef.current, config);
        bufferRef.current = [];
        if (uid) {
          onScanRef.current(uid);
        }
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
    };
  }, [enabled, config]);
}
