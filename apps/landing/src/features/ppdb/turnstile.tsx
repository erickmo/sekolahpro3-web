import { Turnstile as UiTurnstile } from "@sekolahpro/ui";

interface LandingTurnstileProps {
  onToken: (token: string) => void;
  resetSignal?: number;
}

/** Landing Turnstile: supplies the app's env site key to the shared widget. */
export function Turnstile({ onToken, resetSignal }: LandingTurnstileProps) {
  return (
    <UiTurnstile
      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ""}
      onToken={onToken}
      {...(resetSignal !== undefined ? { resetSignal } : {})}
    />
  );
}
