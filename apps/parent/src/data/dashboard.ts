import { useQuery } from "@tanstack/react-query";
import { useFrappeMethod } from "@sekolahpro/api-client";
import type { ChildDashboard } from "./types";
import { mockDashboard } from "./mock";

interface WireDashboard {
  rerata_nilai: string;
  kehadiran_pct: string;
  tugas_pending: number;
  info_terkini: Array<{ id: string; title: string; body: string; ago: string }>;
}

const METHOD = "sekolahpro.api.parent.child_dashboard";
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

function fromWire(w: WireDashboard): ChildDashboard {
  return {
    rerataNilai: w.rerata_nilai,
    kehadiranPct: w.kehadiran_pct,
    tugasPending: w.tugas_pending,
    infoTerkini: w.info_terkini,
  };
}

export function useChildDashboard(nis: string | null) {
  const real = useFrappeMethod<WireDashboard>(METHOD, { nis }, { enabled: !USE_MOCKS && !!nis });
  const mock = useQuery<ChildDashboard | undefined>({
    queryKey: [METHOD, { nis }, "mock"],
    queryFn: async () => (nis ? (mockDashboard[nis] as ChildDashboard | undefined) : undefined),
    enabled: USE_MOCKS && !!nis,
    staleTime: Infinity,
  });
  if (USE_MOCKS) return mock;
  return { ...real, data: real.data ? fromWire(real.data) : undefined } as unknown as typeof mock;
}
