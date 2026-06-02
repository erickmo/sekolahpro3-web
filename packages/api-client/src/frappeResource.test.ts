import { describe, it, expect } from "vitest";
import { isTenantedDoctype } from "./frappeResource";

describe("TENANT_BLOCKLIST — vernon_ads doctypes are global", () => {
  const adsDoctypes = [
    "Property", "Property Group", "Ad Slot", "Campaign",
    "Ad Creative", "Ad Event", "Ads Customer",
  ];
  it("none of the ads doctypes are tenant-scoped", () => {
    for (const dt of adsDoctypes) {
      expect(isTenantedDoctype(dt)).toBe(false);
    }
  });
});
