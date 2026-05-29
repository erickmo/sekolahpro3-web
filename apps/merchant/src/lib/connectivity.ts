import { useEffect, useState } from "react";

interface Options {
  pingFn: () => Promise<boolean>;
  intervalMs: number;
}

export function useConnectivity({ pingFn, intervalMs }: Options) {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const ok = await pingFn();
        if (!cancelled) setOnline(ok);
      } catch {
        if (!cancelled) setOnline(false);
      }
    };
    void tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pingFn, intervalMs]);

  return { online };
}
