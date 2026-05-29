import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { PesanItem } from "./types";
import { mockPesan } from "./mock";

const METHOD = "sekolahpro.api.parent.list_pesan";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function usePesanList() {
  const real = useFrappeMethod<PesanItem[]>(METHOD, {}, { enabled: !USE_MOCKS });
  const mock = useQuery<PesanItem[]>({
    queryKey: [METHOD, "mock"],
    queryFn: async () => mockPesan,
    enabled: USE_MOCKS,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}
