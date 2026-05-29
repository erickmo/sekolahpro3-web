import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { ChildSummary } from "./types";
import { mockChildren } from "./mock";

interface WireChild {
  nis: string;
  nama: string;
  kelas: string;
  sekolah_id: string;
  avatar_url: string | null;
}

const METHOD = "sekolahpro.api.parent.list_children";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireChild): ChildSummary {
  return {
    nis: w.nis,
    nama: w.nama,
    kelas: w.kelas,
    sekolahId: w.sekolah_id,
    avatarUrl: w.avatar_url,
  };
}

export function useChildren() {
  const real = useFrappeMethod<WireChild[]>(METHOD, {}, { enabled: !USE_MOCKS });
  const mock = useQuery<ChildSummary[]>({
    queryKey: [METHOD, "mock"],
    queryFn: async () => mockChildren,
    enabled: USE_MOCKS,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return {
    ...real,
    data: real.data?.map(fromWire),
  } as unknown as typeof mock;
}
