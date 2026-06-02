import { useQuery } from "@tanstack/react-query";
import { demoAgenda } from "../data/demo-site";
import type { Agenda } from "../types";
import { call } from "./api";

interface ApiAgenda {
  name?: string;
  judul?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string | null;
  lokasi?: string;
  deskripsi?: string;
}

function mapAgenda(r: ApiAgenda): Agenda {
  return {
    name: r.name ?? "",
    judul: r.judul ?? "",
    tanggalMulai: r.tanggal_mulai ?? "",
    tanggalSelesai: r.tanggal_selesai ?? null,
    lokasi: r.lokasi ?? "",
    deskripsi: r.deskripsi ?? "",
  };
}

export function useAgendaList(sekolah: string) {
  return useQuery<Agenda[]>({
    queryKey: ["situs.agenda", sekolah],
    queryFn: async () => {
      try {
        const raw = await call<ApiAgenda[]>("situs.list_agenda", { sekolah });
        return (raw ?? []).map(mapAgenda);
      } catch {
        return demoAgenda;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function formatRentang(mulai: string, selesai: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  if (!mulai) return "";
  const a = fmt(mulai);
  if (!selesai) return a;
  const b = fmt(selesai);
  return a === b ? a : `${a} – ${b}`;
}
