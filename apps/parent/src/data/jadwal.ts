import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { JadwalItem } from "./types";
import { mockJadwal } from "./mock";

interface WireJadwal {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  mapel: string;
  guru: string;
  ruang: string;
}

const METHOD = "sekolahpro.api.parent.child_jadwal";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireJadwal): JadwalItem {
  return {
    id: w.id, hari: w.hari, jamMulai: w.jam_mulai, jamSelesai: w.jam_selesai,
    mapel: w.mapel, guru: w.guru, ruang: w.ruang,
  };
}

export function useChildJadwal(nis: string | null, week?: string) {
  const real = useFrappeMethod<WireJadwal[]>(METHOD, { nis, week }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<JadwalItem[]>({
    queryKey: [METHOD, { nis, week }, "mock"],
    queryFn: async () => (nis ? (mockJadwal[nis] as JadwalItem[] | undefined) ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWire) } as unknown as typeof mock;
}
