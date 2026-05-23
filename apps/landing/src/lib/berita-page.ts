import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";

export interface BeritaPageContent {
  hero_eyebrow: string;
  hero_title_main: string;
  hero_title_italic: string;
  hero_lead: string;
  empty_message: string;
  error_message: string;
  detail_back_label: string;
  detail_cta_label: string;
  detail_not_found_title: string;
  detail_not_found_body: string;
  detail_not_found_action: string;
}

const STATIC_FALLBACK: BeritaPageContent = {
  hero_eyebrow: "— Berita",
  hero_title_main: "Cerita dari",
  hero_title_italic: "ruang kelas.",
  hero_lead: "Pengumuman produk, rilis fitur, dan kisah sekolah pengguna SekolahPro.",
  empty_message: "Belum ada artikel pada kategori ini.",
  error_message: "Tidak dapat memuat berita saat ini. Silakan coba lagi sebentar lagi.",
  detail_back_label: "← Semua berita",
  detail_cta_label: "Hubungi Tim",
  detail_not_found_title: "Artikel tidak ditemukan",
  detail_not_found_body: "Tautan ini mungkin sudah dipindahkan atau dihapus.",
  detail_not_found_action: "Kembali ke daftar berita",
};

export function useBeritaPageContent(): BeritaPageContent {
  const [c, setC] = useState<BeritaPageContent>(STATIC_FALLBACK);
  useEffect(() => {
    if (!API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/api/method/sekolahpro.api.berita_page.get_content`, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { message?: Partial<BeritaPageContent> }) => {
        if (cancelled || !body?.message) return;
        setC({ ...STATIC_FALLBACK, ...body.message });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return c;
}
