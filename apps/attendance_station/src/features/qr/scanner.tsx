// ABS-002 — QR scanner adapter (device camera via @zxing/browser).
//
// Wraps `BrowserQRCodeReader` to continuously decode QR codes from the device
// camera and surface the decoded token (the student attendance JWT) through
// `onToken`. This is a thin hardware adapter: the camera + zxing decode loop are
// hardware-bound and verified manually (see MANUAL TEST below). There is no unit
// test — only a typecheck against the real @zxing types.
//
// @zxing/browser API used (confirmed against @zxing/browser@0.1.5 +
// @zxing/library@0.21.3 type declarations):
//   - new BrowserQRCodeReader()
//   - reader.decodeFromVideoDevice(
//       deviceId: string | undefined,
//       previewElem: string | HTMLVideoElement | undefined,
//       callback: (result?: Result, error?: Exception, controls) => void,
//     ): Promise<IScannerControls>
//   - Result.getText(): string
//   - IScannerControls.stop(): void
//
// MANUAL TEST:
//   1. Open the station on a device with a camera (grant camera permission).
//   2. Mount this component (the station scan screen).
//   3. Point the camera at a student attendance QR code.
//   4. Expect: `onToken` fires once with the decoded JWT string.
//   5. Unmount the screen → the camera stream stops (controls.stop()).
import { useEffect, useRef } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

/** Props for {@link QrScanner}. */
export interface QrScannerProps {
  /** Called with the decoded QR text (the attendance JWT) on each read. */
  onToken: (token: string) => void;
  /** Optional setup/decode error sink (e.g. camera permission denied). */
  onError?: (error: unknown) => void;
}

/**
 * Live camera QR scanner. On mount, starts the zxing decode loop against the
 * default camera and renders a `<video>` preview; each successful decode calls
 * `onToken` with the QR text. Setup failures route to `onError`. On unmount the
 * scan controls are stopped, releasing the camera.
 *
 * Hardware-bound — no unit test; see MANUAL TEST in the file header.
 *
 * @param props - {@link QrScannerProps}.
 */
export function QrScanner({ onToken, onError }: QrScannerProps) {
  const video_ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let cancelled = false;

    try {
      const reader = new BrowserQRCodeReader();
      // decodeFromVideoDevice resolves to controls; capture them so unmount can
      // stop the stream even if mount already happened before the Promise settled.
      reader
        .decodeFromVideoDevice(undefined, video_ref.current ?? undefined, (result) => {
          if (result) {
            onToken(result.getText());
          }
        })
        .then((next_controls) => {
          if (cancelled) {
            next_controls.stop();
            return;
          }
          controls = next_controls;
        })
        .catch((error: unknown) => onError?.(error));
    } catch (error) {
      onError?.(error);
    }

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onToken, onError]);

  return <video ref={video_ref} className="h-full w-full object-cover" />;
}
