import { useCallback, useRef, useState } from "react";
import { parseCardToken } from "./parse-card-token";
import { CardReaderError, type CardToken } from "./types";

interface ReaderControl { stop: () => void }
interface ReaderImpl {
  decodeFromVideoDevice(
    deviceId: string | undefined,
    videoEl: HTMLVideoElement,
    cb: (result: { getText: () => string } | undefined, err: unknown) => void,
  ): Promise<ReaderControl>;
}

let impl: ReaderImpl | null = null;

async function getImpl(): Promise<ReaderImpl> {
  if (impl) return impl;
  const { BrowserQRCodeReader } = await import("@zxing/browser");
  const inst = new BrowserQRCodeReader();
  impl = {
    decodeFromVideoDevice: (dev, el, cb) =>
      inst.decodeFromVideoDevice(
        dev,
        el,
        cb as Parameters<typeof inst.decodeFromVideoDevice>[2],
      ) as unknown as Promise<ReaderControl>,
  };
  return impl;
}

/** Test seam — set fake impl before render. */
export function __setQrReaderImpl(fake: ReaderImpl) { impl = fake; }

interface Options {
  onRead?: (token: CardToken) => void;
  onError?: (err: CardReaderError) => void;
}

export function useQrScanner({ onRead, onError }: Options) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ctrlRef = useRef<ReaderControl | null>(null);
  const [scanning, setScanning] = useState(false);
  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  const start = useCallback(async () => {
    if (!supported && !impl) {
      onError?.(new CardReaderError("UNSUPPORTED"));
      return;
    }
    const reader = await getImpl();
    const el = videoRef.current ?? document.createElement("video");
    const ctrl = await reader.decodeFromVideoDevice(undefined, el, (result) => {
      if (!result) return;
      try {
        const t = parseCardToken(result.getText());
        onRead?.(t);
      } catch (e) {
        if (e instanceof CardReaderError) onError?.(e);
      }
    });
    ctrlRef.current = ctrl;
    setScanning(true);
  }, [supported, onRead, onError]);

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setScanning(false);
  }, []);

  return { videoRef, supported, scanning, start, stop };
}
