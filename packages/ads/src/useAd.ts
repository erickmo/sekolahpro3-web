import { useEffect, useState } from "react";
import { fetchAd } from "./client";
import { useAdsConfig } from "./AdsProvider";
import type { AdCreative } from "./types";

export interface UseAdResult {
  creative: AdCreative | null;
  loading: boolean;
}

/** Fetch the creative for `slot` once on mount. No-op (null) when config or
 * propertyKey is missing, so apps render safely before ads are configured. */
export function useAd(slot: string): UseAdResult {
  const cfg = useAdsConfig();
  const [creative, setCreative] = useState<AdCreative | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cfg || !cfg.propertyKey) return;
    let active = true;
    setLoading(true);
    void fetchAd(cfg.baseUrl, slot, cfg.propertyKey).then((ad) => {
      if (!active) return;
      setCreative(ad);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [cfg, slot]);

  return { creative, loading };
}
