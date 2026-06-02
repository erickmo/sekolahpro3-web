import { createContext, useContext } from "react";

/**
 * Tracks whether the global "Tahun Ajaran belum aktif" setup banner currently
 * occupies space above the page content (rendered once in the root layout).
 *
 * ModuleHeader reads this to skip its top-bleed margin (`-mt-*`) when the banner
 * is present, so the sticky header does not pull up over the banner. Defaults to
 * false (no banner) for any component rendered outside the provider.
 */
export const SetupBannerContext = createContext(false);

/** True when the global setup banner reserves space above the page content. */
export function useSetupBannerActive(): boolean {
  return useContext(SetupBannerContext);
}
