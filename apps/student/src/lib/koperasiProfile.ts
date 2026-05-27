import { useResourceList } from "@sekolahpro/api-client";

/**
 * Portal Anggota Koperasi — lookup chain dari session.user.
 *
 * Frappe `linked_with` siswa-> nasabah-> anggota tidak otomatis joinable
 * via REST. Solusi pragmatis: 3 sequential queries dengan React Query
 * gating via `enabled` flag.
 *
 *   session.user → Siswa.user_id (or Siswa name yang sama dengan user)
 *   → Nasabah where pihak_tipe="Siswa" AND pihak=<siswa>
 *   → Anggota Koperasi where nasabah=<nasabah>
 *
 * Tidak setiap user koperasi adalah Siswa — Guru/Staff/Orang Tua juga
 * bisa jadi anggota. Hook handle Siswa case dulu (mayoritas portal
 * student app). Guru/staff portal di-cover saat app/guru tersedia.
 */

export interface AnggotaProfile {
  anggotaName: string;
  nomor_anggota?: string;
  nasabah: string;
  status?: string;
  jenis_anggota?: string;
  loading: boolean;
}

type NasabahRow = { name: string; status?: string };
type AnggotaRow = { name: string; nomor_anggota?: string; nasabah: string; status?: string; jenis_anggota?: string };

export function useAnggotaProfile(siswaName: string | null): AnggotaProfile | null {
  const nasabahQ = useResourceList<NasabahRow>(
    "Nasabah",
    {
      fields: ["name", "status"],
      filters: siswaName
        ? [
            ["pihak_tipe", "=", "Siswa"],
            ["pihak", "=", siswaName],
          ]
        : [],
      limit_page_length: 1,
    },
    { enabled: !!siswaName },
  );

  const nasabah = nasabahQ.data?.[0];

  const anggotaQ = useResourceList<AnggotaRow>(
    "Anggota Koperasi",
    {
      fields: ["name", "nomor_anggota", "nasabah", "status", "jenis_anggota"],
      filters: nasabah ? [["nasabah", "=", nasabah.name]] : [],
      limit_page_length: 1,
    },
    { enabled: !!nasabah },
  );

  const anggota = anggotaQ.data?.[0];
  const loading = nasabahQ.isFetching || anggotaQ.isFetching;

  if (!nasabah || !anggota) {
    return loading ? { anggotaName: "", nasabah: "", loading: true } : null;
  }

  return {
    anggotaName: anggota.name,
    ...(anggota.nomor_anggota ? { nomor_anggota: anggota.nomor_anggota } : {}),
    nasabah: nasabah.name,
    ...(anggota.status ? { status: anggota.status } : {}),
    ...(anggota.jenis_anggota ? { jenis_anggota: anggota.jenis_anggota } : {}),
    loading: false,
  };
}
