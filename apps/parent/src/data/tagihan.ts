import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { TagihanItem, TagihanDetail } from "./types";
import { mockTagihan, mockTagihanDetail } from "./mock";

const LIST_METHOD = "sekolahpro.api.parent.list_tagihan";
const DETAIL_METHOD = "sekolahpro.api.parent.tagihan_detail";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function useTagihanList(nis?: string) {
  const real = useFrappeMethod<TagihanItem[]>(LIST_METHOD, { nis }, { enabled: !USE_MOCKS });
  const mock = useQuery<TagihanItem[]>({
    queryKey: [LIST_METHOD, { nis }, "mock"],
    queryFn: async () => (nis ? mockTagihan.filter((t) => t.nis === nis) : mockTagihan),
    enabled: USE_MOCKS,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}

export function useTagihanDetail(id: string | null) {
  const real = useFrappeMethod<TagihanDetail>(DETAIL_METHOD, { id }, { enabled: !USE_MOCKS && !!id });
  const mock = useQuery<TagihanDetail | undefined>({
    queryKey: [DETAIL_METHOD, { id }, "mock"],
    queryFn: async () => (id ? (mockTagihanDetail[id] as TagihanDetail | undefined) : undefined),
    enabled: USE_MOCKS && !!id,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}
