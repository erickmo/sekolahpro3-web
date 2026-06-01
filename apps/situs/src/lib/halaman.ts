import { useQuery } from "@tanstack/react-query";
import { demoHalaman } from "../data/demo-site";
import type { Halaman } from "../types";
import { call } from "./api";

interface ApiHalaman {
  name?: string;
  slug?: string;
  judul?: string;
  konten?: string;
  ikon?: string;
}

function mapHalaman(r: ApiHalaman): Halaman {
  return {
    name: r.name ?? "",
    slug: r.slug ?? "",
    judul: r.judul ?? "",
    konten: r.konten ?? "",
    ikon: r.ikon ?? "file",
  };
}

export function useHalaman(sekolah: string, slug: string) {
  return useQuery<Halaman | null>({
    queryKey: ["situs.halaman", sekolah, slug],
    queryFn: async () => {
      try {
        const raw = await call<ApiHalaman | null>("situs.get_halaman", { sekolah, slug });
        return raw ? mapHalaman(raw) : null;
      } catch {
        return demoHalaman[slug] ?? null;
      }
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}
