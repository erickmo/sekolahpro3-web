import { useEffect, useRef, useState } from "react";
import { parseCardToken } from "./parse-card-token";
import { CardReaderError, type CardToken } from "./types";

interface Options {
  enabled: boolean;
  onRead?: (token: CardToken) => void;
  onError?: (err: CardReaderError) => void;
}

declare global {
  interface Window {
    NDEFReader?: new () => {
      scan(): Promise<void>;
      onreading: ((e: { message: { records: { recordType: string; data: ArrayBuffer }[] } }) => void) | null;
      onreadingerror: ((e: unknown) => void) | null;
    };
  }
}

export function useNfcReader({ enabled, onRead, onError }: Options) {
  const supported = typeof window !== "undefined" && typeof window.NDEFReader === "function";
  const [armed, setArmed] = useState(false);
  const onReadRef = useRef(onRead);
  const onErrorRef = useRef(onError);
  onReadRef.current = onRead;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || !supported) return;
    const Ctor = window.NDEFReader!;
    const reader = new Ctor();
    let cancelled = false;

    reader.onreading = (e) => {
      const text = e.message.records
        .filter((r) => r.recordType === "text")
        .map((r) => new TextDecoder().decode(r.data))
        .join("");
      try {
        const token = parseCardToken(text);
        onReadRef.current?.(token);
      } catch (err) {
        if (err instanceof CardReaderError) onErrorRef.current?.(err);
      }
    };
    reader.onreadingerror = () => {
      onErrorRef.current?.(new CardReaderError("READ_FAILED"));
    };

    reader.scan()
      .then(() => { if (!cancelled) setArmed(true); })
      .catch((e: unknown) => {
        const code = (e as { name?: string })?.name === "NotAllowedError"
          ? "PERMISSION_DENIED" : "READ_FAILED";
        onErrorRef.current?.(new CardReaderError(code));
      });

    return () => { cancelled = true; setArmed(false); };
  }, [enabled, supported]);

  return { supported, armed };
}
