import { useQuery } from "@tanstack/react-query";
import { demoPpdb } from "../data/demo-site";
import type { PpdbGelombang, PpdbInfo } from "../types";
import { call } from "./api";

interface ApiGelombang {
  name?: string;
  nama?: string;
  tingkat?: string;
  tanggal_buka?: string;
  tanggal_tutup?: string;
  biaya_pendaftaran?: number;
  sisa_kuota?: number;
}
interface ApiPpdb {
  dibuka?: boolean;
  gelombang?: ApiGelombang[];
  jalur?: string[];
  dokumen?: string[];
  catatan?: string;
}

function mapGelombang(r: ApiGelombang): PpdbGelombang {
  return {
    name: r.name ?? "",
    nama: r.nama ?? "",
    tingkat: r.tingkat ?? "",
    tanggalBuka: r.tanggal_buka ?? "",
    tanggalTutup: r.tanggal_tutup ?? "",
    biayaPendaftaran: r.biaya_pendaftaran ?? 0,
    sisaKuota: r.sisa_kuota ?? 0,
  };
}

export function usePpdbInfo(sekolah: string) {
  return useQuery<PpdbInfo>({
    queryKey: ["situs.ppdb", sekolah],
    queryFn: async () => {
      try {
        const raw = await call<ApiPpdb>("situs.get_ppdb_info", { sekolah });
        return {
          dibuka: Boolean(raw.dibuka),
          gelombang: (raw.gelombang ?? []).map(mapGelombang),
          jalur: raw.jalur ?? [],
          dokumen: raw.dokumen ?? [],
          catatan: raw.catatan ?? "",
        };
      } catch {
        return demoPpdb;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
