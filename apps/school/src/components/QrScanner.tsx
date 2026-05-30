import { useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

interface Props {
  onDecode: (text: string) => void;
}

export function QrScanner({ onDecode }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stopped = false;
    const reader = new BrowserQRCodeReader();
    let controls: { stop: () => void } | null = null;
    (async () => {
      if (!videoRef.current) return;
      controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (stopped) return;
        if (result) onDecode(result.getText());
        void err;
      });
    })();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onDecode]);

  return (
    <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg border border-border bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
    </div>
  );
}
