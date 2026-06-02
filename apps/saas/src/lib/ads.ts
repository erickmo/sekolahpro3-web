import { frappeFetch } from "@sekolahpro/api-client";

export interface AdsTotals { impressions: number; clicks: number; }
export interface AdsByCampaign { campaign: string; impressions: number; clicks: number; }
export interface AdsByProperty { property: string; impressions: number; clicks: number; }
export interface AdsDaily { day: string; impressions: number; clicks: number; }

export interface AdsOverview {
  from_date: string;
  to_date: string;
  totals: AdsTotals;
  by_campaign: AdsByCampaign[];
  by_property: AdsByProperty[];
  daily: AdsDaily[];
}

/** Fetch aggregated ad metrics from vernon_ads.api.stats.overview. */
export function fetchAdsOverview(from_date?: string, to_date?: string): Promise<AdsOverview> {
  return frappeFetch<AdsOverview>("vernon_ads.api.stats.overview", {
    from_date: from_date ?? "",
    to_date: to_date ?? "",
  });
}

/** Clicks ÷ impressions as a percentage string. Guards divide-by-zero. */
export function ctr(impressions: number, clicks: number): string {
  if (!impressions) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

// --- Admin CRUD row types (subset of doctype fields shown in tables) ---
export interface CustomerRow { name: string; customer_name?: string; status?: string; email?: string; company?: string; }
export interface PropertyRow { name: string; property_name?: string; status?: string; platform?: string; property_group?: string; url?: string; api_key?: string; }
export interface PropertyGroupRow { name: string; description?: string; }
export interface SlotRow { name: string; slot_key?: string; property?: string; ad_type?: string; width?: number; height?: number; }
export interface CampaignRow { name: string; campaign_name?: string; status?: string; customer?: string; property_group?: string; start_date?: string; end_date?: string; pricing_model?: string; budget?: number; }
export interface CreativeRow { name: string; creative_name?: string; campaign?: string; ad_type?: string; status?: string; title?: string; destination_url?: string; width?: number; height?: number; image?: string; }
