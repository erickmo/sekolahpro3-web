// Client-side global search across mock data fixtures.
// Replace dengan @sekolahpro/api-client hooks ketika backend siap.

import { SISWA_LIST } from "../data/siswa";
import { PEGAWAI_LIST, isGuru, isStaff } from "../data/pegawai";
import { KELAS_LIST } from "../data/kelas";

export type SearchCategory = "Siswa" | "Guru" | "Staff" | "Kelas";

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

  for (const p of PEGAWAI_LIST) {
    if (!(includes(p.namaLengkap, q) || includes(p.nip, q))) continue;
    if (isGuru(p)) {
      hits.push({
        id: `pegawai:${p.nip}`,
        label: p.namaLengkap,
        category: "Guru",
        meta: `NIP ${p.nip}`,
        href: `/staff/${p.nip}`,
      });
      if (hits.length >= max) return hits;
    }
    if (isStaff(p)) {
      hits.push({
        id: `pegawai-staff:${p.nip}`,
        label: p.namaLengkap,
        category: "Staff",
        meta: `NIP ${p.nip}`,
        href: `/staff/${p.nip}`,
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
  const order: SearchCategory[] = ["Siswa", "Guru", "Staff", "Kelas"];
  return order
    .map((category) => ({
      category,
      items: hits.filter((h) => h.category === category),
    }))
    .filter((g) => g.items.length > 0);
}
