import { Turnstile as UiTurnstile } from "@sekolahpro/ui";

/** Landing Turnstile: supplies the app's env site key to the shared widget. */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  return (
    <UiTurnstile
      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ""}
      onToken={onToken}
    />
  );
}
