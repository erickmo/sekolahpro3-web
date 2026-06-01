import { useQuery } from "@tanstack/react-query";
import { demoPrestasi } from "../data/demo-site";
import type { Prestasi } from "../types";
import { call } from "./api";

interface ApiPrestasi {
  name?: string;
  judul?: string;
  tingkat?: string;
  tahun?: number;
  peraih?: string;
  deskripsi?: string;
  gambar?: string | null;
}

function mapPrestasi(r: ApiPrestasi): Prestasi {
  return {
    name: r.name ?? "",
    judul: r.judul ?? "",
    tingkat: r.tingkat ?? "Sekolah",
    tahun: r.tahun ?? new Date().getFullYear(),
    peraih: r.peraih ?? "",
    deskripsi: r.deskripsi ?? "",
    gambar: r.gambar ?? null,
  };
}

export function usePrestasiList(sekolah: string) {
  return useQuery<Prestasi[]>({
    queryKey: ["situs.prestasi", sekolah],
    queryFn: async () => {
      try {
        const raw = await call<ApiPrestasi[]>("situs.list_prestasi", { sekolah });
        return (raw ?? []).map(mapPrestasi);
      } catch {
        return demoPrestasi;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
