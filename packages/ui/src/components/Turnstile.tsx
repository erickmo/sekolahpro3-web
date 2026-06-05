import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (t: string) => void },
      ) => string;
      reset: (id: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export interface TurnstileProps {
  /** Cloudflare Turnstile site key (each app reads its own env and passes it). */
  siteKey: string;
  /** Called with the verification token when the user passes the challenge. */
  onToken: (token: string) => void;
}

/** Cloudflare Turnstile widget. Lazy-loads the script, renders once, reports the token. */
export function Turnstile({ siteKey, onToken }: TurnstileProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.head.appendChild(s);
    }

    const t = setInterval(() => {
      if (window.turnstile && ref.current && !widgetId.current) {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          callback: onToken,
        });
        clearInterval(t);
      }
    }, 200);

    return () => clearInterval(t);
  }, [siteKey, onToken]);

  return <div ref={ref} />;
}
