import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (t: string) => void },
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export interface TurnstileProps {
  /** Cloudflare Turnstile site key (each app reads its own env and passes it). */
  siteKey: string;
  /** Called with the verification token when the user passes the challenge. */
  onToken: (token: string) => void;
  /**
   * Bump this number after each guest scan to reset the widget and re-issue a
   * fresh token. Cloudflare tokens are single-use; reusing a spent token causes
   * the backend to reject the request.
   */
  resetSignal?: number;
}

/** Cloudflare Turnstile widget. Lazy-loads the script, renders once, reports the token. */
export function Turnstile({ siteKey, onToken, resetSignal }: TurnstileProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  // FIX I4: store onToken in a ref so the render callback always calls the
  // latest handler even though the widget is only rendered once
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

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
          // FIX I4: delegate to ref so stale closure is never an issue
          callback: (token: string) => onTokenRef.current(token),
        });
        clearInterval(t);
      }
    }, 200);

    return () => clearInterval(t);
    // FIX I4: remove onToken from deps — the ref handles freshness; only
    // re-run when siteKey changes (which requires a new widget anyway)
  }, [siteKey]);

  // Reset the widget to re-issue a fresh token after each scan. Guard with
  // optional chaining so this no-ops safely in jsdom / test environments.
  useEffect(() => {
    if (resetSignal === undefined || resetSignal === 0) return;
    if (widgetId.current) {
      window.turnstile?.reset(widgetId.current);
    }
  }, [resetSignal]);

  return <div ref={ref} />;
}
