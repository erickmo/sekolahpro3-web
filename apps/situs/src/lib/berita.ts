import { useQuery } from "@tanstack/react-query";
import type { KategoriBerita } from "../constants";
import { demoBerita } from "../data/demo-site";
import type { Berita } from "../types";
import { call } from "./api";

interface ApiBerita {
  name?: string;
  judul?: string;
  slug?: string;
  kategori?: string;
  ringkasan?: string;
  konten?: string;
  gambar_sampul?: string | null;
  tanggal_terbit?: string;
  penulis?: string;
}

function mapBerita(r: ApiBerita): Berita {
  return {
    name: r.name ?? "",
    judul: r.judul ?? "",
    slug: r.slug ?? "",
    kategori: (r.kategori as KategoriBerita) ?? "Berita",
    ringkasan: r.ringkasan ?? "",
    konten: r.konten,
    gambarSampul: r.gambar_sampul ?? null,
    tanggalTerbit: r.tanggal_terbit ?? "",
    penulis: r.penulis ?? "",
  };
}

export function useBeritaList(sekolah: string, kategori?: string) {
  return useQuery<Berita[]>({
    queryKey: ["situs.berita", sekolah, kategori ?? "all"],
    queryFn: async () => {
      let list: Berita[];
      try {
        const raw = await call<ApiBerita[]>("situs.list_berita", { sekolah, kategori: kategori ?? "" });
        list = (raw ?? []).map(mapBerita);
      } catch {
        list = demoBerita;
      }
      return kategori ? list.filter((b) => b.kategori === kategori) : list;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBeritaDetail(sekolah: string, slug: string) {
  return useQuery<Berita | null>({
    queryKey: ["situs.berita.detail", sekolah, slug],
    queryFn: async () => {
      try {
        const raw = await call<ApiBerita | null>("situs.get_berita", { sekolah, slug });
        return raw ? mapBerita(raw) : null;
      } catch {
        return demoBerita.find((b) => b.slug === slug) ?? null;
      }
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

export function formatTanggal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
