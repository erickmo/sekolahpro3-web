import { useQuery } from "@tanstack/react-query";
import { frappeFetch } from "@sekolahpro/api-client";
import type { Tenant } from "./types";

interface ResolveResponse {
  tenant_id: string;
  name: string;
  logo: string | null;
  theme: { brand_color: string | null };
  features: string[];
}

export function useTenant(host: string = typeof window !== "undefined" ? window.location.host : "") {
  return useQuery<Tenant>({
    queryKey: ["tenant.resolve", host],
    queryFn: async () => {
      const raw = await frappeFetch<ResolveResponse>(
        "sekolahpro.api.tenant.resolve_by_host",
        { host },
      );
      return {
        tenantId: raw.tenant_id,
        name: raw.name,
        logo: raw.logo,
        theme: { brandColor: raw.theme.brand_color },
        features: raw.features,
      };
    },
    staleTime: 60 * 60 * 1000,
  });
}
