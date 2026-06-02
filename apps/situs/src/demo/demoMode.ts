// The demo template switcher is a presentation aid, not a visitor-facing
// feature. It renders only in dev (`vite dev`) or when the URL carries `?demo`
// (or `?demo=1`), so production visitors never see it.
export function isDemoMode(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("demo");
}
