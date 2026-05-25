// Client-side global search across mock data fixtures.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

import { SISWA_LIST } from "../data/siswa";
import { GURU_LIST } from "../data/guru";
import { KELAS_LIST } from "../data/kelas";

export type SearchCategory = "Siswa" | "Guru" | "Kelas";

export type SearchHit = {
  id: string;
  label: string;
  category: SearchCategory;
  meta?: string;
  href: string;
};

const MIN_QUERY_LENGTH = 2;
const DEFAULT_MAX_HITS = 8;

function includes(haystack: string | number | undefined | null, needle: string): boolean {
  if (haystack === undefined || haystack === null) return false;
  return String(haystack).toLowerCase().includes(needle);
}

export function globalSearch(query: string, max: number = DEFAULT_MAX_HITS): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_QUERY_LENGTH) return [];
  const hits: SearchHit[] = [];

  for (const s of SISWA_LIST) {
    if (includes(s.namaLengkap, q) || includes(s.nis, q) || includes(s.nisn, q)) {
      hits.push({
        id: `siswa:${s.nis}`,
        label: s.namaLengkap,
        category: "Siswa",
        meta: `NIS ${s.nis}${s.kelas ? " · " + s.kelas : ""}`,
        href: `/siswa/${s.nis}`,
      });
      if (hits.length >= max) return hits;
    }
  }

  for (const g of GURU_LIST) {
    if (includes(g.namaLengkap, q) || includes(g.nip, q)) {
      hits.push({
        id: `guru:${g.nip}`,
        label: g.namaLengkap,
        category: "Guru",
        meta: `NIP ${g.nip}`,
        href: `/guru/${g.nip}`,
      });
      if (hits.length >= max) return hits;
    }
  }

  for (const k of KELAS_LIST) {
    if (includes(k.nama, q) || includes(k.kodeKelas, q) || includes(k.waliKelas, q)) {
      hits.push({
        id: `kelas:${k.kodeKelas}`,
        label: k.nama,
        category: "Kelas",
        meta: k.waliKelas ? `Wali: ${k.waliKelas}` : `Kode ${k.kodeKelas}`,
        href: `/kelas/${encodeURIComponent(k.kodeKelas)}`,
      });
      if (hits.length >= max) return hits;
    }
  }

  return hits;
}

export function groupHitsByCategory(hits: SearchHit[]): Array<{ category: SearchCategory; items: SearchHit[] }> {
  const order: SearchCategory[] = ["Siswa", "Guru", "Kelas"];
  return order
    .map((category) => ({
      category,
      items: hits.filter((h) => h.category === category),
    }))
    .filter((g) => g.items.length > 0);
}
