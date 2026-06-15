import { useResourceList } from "@sekolahpro/api-client";

// Onboarding checklist source of truth — each step's `done` flag derives
// from a tiny Frappe resource probe (limit_page_length: 1 / 2). All probes
// are independent useResourceList calls so React Query dedups + caches per
// doctype. While probes are loading, `done` stays false so the user sees
// the unfinished state without flashing checks.

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
};

const PENGGUNA_MIN = 2;

/**
 * Fee-setup onboarding step. `done` once any School Fee Component exists, so the
 * checklist reflects a configured fee structure (not just a visited page).
 */
export function buildSppStep(componentCount: number): OnboardingStep {
  return {
    id: "spp",
    label: "Konfigurasi SPP",
    description: "Komponen biaya & harga per tingkat.",
    href: "/keuangan/biaya",
    done: componentCount > 0,
  };
}

export function useOnboardingSteps(): OnboardingStep[] {
  const taQ = useResourceList<{ name: string }>("Tahun Ajaran", {
    filters: { aktif: 1 },
    fields: ["name"],
    limit_page_length: 1,
  });
  const userQ = useResourceList<{ name: string }>("User", {
    filters: { enabled: 1 },
    fields: ["name"],
    limit_page_length: PENGGUNA_MIN,
  });
  const rombelQ = useResourceList<{ name: string }>("Rombongan Belajar", {
    fields: ["name"],
    limit_page_length: 1,
  });
  const siswaQ = useResourceList<{ name: string }>("Siswa", {
    fields: ["name"],
    limit_page_length: 1,
  });
  const jadwalQ = useResourceList<{ name: string }>("Jadwal Pelajaran", {
    fields: ["name"],
    limit_page_length: 1,
  });
  const feeQ = useResourceList<{ name: string }>("School Fee Component", {
    fields: ["name"],
    limit_page_length: 1,
  });

  return [
    {
      id: "jenjang",
      label: "Pilih unit & jenjang",
      description: "Tentukan SD/SMP/SMA aktif untuk tenant.",
      href: "/master/unit-jenjang",
      done: true,
    },
    {
      id: "ta",
      label: "Aktifkan Tahun Ajaran",
      description: "Modul akademik & absensi memerlukan TA aktif.",
      href: "/akademik/tahun-ajaran",
      done: (taQ.data?.length ?? 0) > 0,
    },
    {
      id: "pengguna",
      label: "Undang pengguna",
      description: "Minimal 1 admin + 1 operator.",
      href: "/master/pengguna",
      done: (userQ.data?.length ?? 0) >= PENGGUNA_MIN,
    },
    {
      id: "rombel",
      label: "Buat rombongan belajar",
      description: "Definisi kelas paralel + wali kelas.",
      href: "/kelas/rombel",
      done: (rombelQ.data?.length ?? 0) > 0,
    },
    {
      id: "siswa",
      label: "Import data siswa",
      description: "Tambah siswa massal atau satuan.",
      href: "/siswa/daftar",
      done: (siswaQ.data?.length ?? 0) > 0,
    },
    {
      id: "kurikulum",
      label: "Atur kurikulum & KKM",
      description: "Mapel + nilai minimum per mapel.",
      href: "/akademik/kurikulum",
      done: false,
    },
    {
      id: "jadwal",
      label: "Susun jadwal pelajaran",
      description: "Slot waktu + alokasi guru-kelas-mapel.",
      href: "/jadwal/slot",
      done: (jadwalQ.data?.length ?? 0) > 0,
    },
    buildSppStep(feeQ.data?.length ?? 0),
    {
      id: "modul",
      label: "Aktifkan modul opsional",
      description: "Koperasi, Perpustakaan, PPDB.",
      href: "/pengaturan/modul",
      done: false,
    },
    {
      id: "tour",
      label: "Lihat panduan singkat",
      description: "Tour fitur utama (3 menit).",
      href: "#",
      done: false,
    },
  ];
}
