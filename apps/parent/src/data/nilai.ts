import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { NilaiItem } from "./types";
import { mockNilai } from "./mock";

interface WireNilai {
  id: string; mapel: string; semester: string;
  nilai_angka: number; nilai_huruf: string; catatan: string | null;
}

const METHOD = "sekolahpro.api.parent.child_nilai";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireNilai): NilaiItem {
  return {
    id: w.id, mapel: w.mapel, semester: w.semester,
    nilaiAngka: w.nilai_angka, nilaiHuruf: w.nilai_huruf, catatan: w.catatan,
  };
}

export function useChildNilai(nis: string | null, semester?: string) {
  const real = useFrappeMethod<WireNilai[]>(METHOD, { nis, semester }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<NilaiItem[]>({
    queryKey: [METHOD, { nis, semester }, "mock"],
    queryFn: async () => (nis ? (mockNilai[nis] as NilaiItem[] | undefined) ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data?.map(fromWire) } as unknown as typeof mock;
}
