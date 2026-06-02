import { createContext, useContext, type ReactNode } from "react";

export interface AdsConfig {
  /** Base URL of the ad backend. "" = same-origin (proxied). */
  baseUrl: string;
  /** This app's Property api_key. Empty disables ad rendering. */
  propertyKey: string;
}

const AdsContext = createContext<AdsConfig | null>(null);

/** Provides ad backend config to <AdBanner> descendants. */
export function AdsProvider({
  baseUrl,
  propertyKey,
  children,
}: AdsConfig & { children: ReactNode }) {
  return (
    <AdsContext.Provider value={{ baseUrl, propertyKey }}>
      {children}
    </AdsContext.Provider>
  );
}

/** Read ads config. Returns null when no provider is mounted. */
export function useAdsConfig(): AdsConfig | null {
  return useContext(AdsContext);
}
