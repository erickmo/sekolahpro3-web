import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { AbsensiItem } from "./types";
import { mockAbsensi } from "./mock";

const METHOD = "sekolahpro.api.parent.child_absensi";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export function useChildAbsensi(nis: string | null, month?: string) {
  const real = useFrappeMethod<AbsensiItem[]>(METHOD, { nis, month }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<AbsensiItem[]>({
    queryKey: [METHOD, { nis, month }, "mock"],
    queryFn: async () => (nis ? (mockAbsensi[nis] as AbsensiItem[] | undefined) ?? [] : []),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  return USE_MOCKS ? mock : real;
}
