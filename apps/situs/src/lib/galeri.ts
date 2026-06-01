import { useQuery } from "@tanstack/react-query";
import { demoGaleri } from "../data/demo-site";
import type { Galeri } from "../types";
import { call } from "./api";

interface ApiGaleri {
  name?: string;
  judul?: string;
  gambar?: string;
  kategori?: string;
}

function mapGaleri(r: ApiGaleri): Galeri {
  return {
    name: r.name ?? "",
    judul: r.judul ?? "",
    gambar: r.gambar ?? "",
    kategori: r.kategori ?? "Umum",
  };
}

export function useGaleriList(sekolah: string, kategori?: string) {
  return useQuery<Galeri[]>({
    queryKey: ["situs.galeri", sekolah, kategori ?? "all"],
    queryFn: async () => {
      let list: Galeri[];
      try {
        const raw = await call<ApiGaleri[]>("situs.list_galeri", { sekolah, kategori: kategori ?? "" });
        list = (raw ?? []).map(mapGaleri);
      } catch {
        list = demoGaleri;
      }
      return kategori ? list.filter((g) => g.kategori === kategori) : list;
    },
    staleTime: 5 * 60 * 1000,
  });
}
