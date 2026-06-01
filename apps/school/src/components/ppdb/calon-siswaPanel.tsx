/**
 * calon-siswaPanel — kartu pendaftar untuk direktori Calon Siswa PPDB.
 *
 * Komponen presentational yang dipakai HANYA oleh halaman
 * routes/sch.$sekolah.ppdb.calon-siswa.tsx. Setiap kartu menampilkan avatar,
 * nama, badge jenjang/jalur, dan ProgressRing kelengkapan dokumen.
 *
 * Navigasi disuntik lewat `renderLink` agar komponen bebas-router (mengikuti
 * pola NextActionCard) sehingga mudah diuji tanpa <RouterProvider>.
 */

import type { ReactNode } from "react";
import { Avatar, Badge, SectionCard, cn } from "@sekolahpro/ui";
import { ProgressRing } from "../viz";
import { docCompleteness } from "../../lib/ppdbAnalytics";
import {
  TONE_BY_STATUS,
} from "../../lib/ppdbApi";
import type {
  JenisKelamin,
  JenjangTujuan,
  Pendaftar,
} from "../../data/ppdb";

// Ambang persentase kelengkapan dokumen untuk pemilihan nada ProgressRing.
const DOC_PCT_GOOD = 80;
const DOC_PCT_WARN = 40;

// Label UI Bahasa Indonesia — tidak boleh tersebar (no magic strings).
const DOC_RING_LABEL = "Dokumen";
const VIEW_DETAIL_LABEL = "Lihat detail";

// Nilai default untuk field Pendaftar yang TIDAK tersedia pada doctype
// "Calon Siswa" (jalur/status/dll). Calon Siswa hanya membawa identitas, jadi
// kartu live menampilkan jenjang + nama sementara field lain diisi placeholder.
const LIVE_DEFAULT_JALUR: Pendaftar["jalur"] = "Reguler";
const LIVE_DEFAULT_STATUS: Pendaftar["statusPendaftaran"] = "Terkirim";
const LIVE_DEFAULT_JENJANG: JenjangTujuan = "SD";
const LIVE_DEFAULT_GENDER: JenisKelamin = "Laki-laki";

/** Baris live "Calon Siswa" (whitelisted fields) yang dikonsumsi kartu. */
export interface CalonSiswaLiveRow {
  name: string;
  nama_lengkap?: string;
  nisn?: string;
  jenis_kelamin?: string;
  jenjang?: string;
}

/** Override kelengkapan dokumen (dari useDokumenLive) per-pendaftaran. */
export interface DocCompleteness {
  done: number;
  total: number;
  pct: number;
}

/**
 * Pilih nada ProgressRing dokumen dari persentase kelengkapan:
 * tinggi -> emerald, sedang -> amber, rendah -> rose. Mencegah magic warna.
 */
function docRingTone(pct: number): "emerald" | "amber" | "rose" {
  if (pct >= DOC_PCT_GOOD) return "emerald";
  if (pct >= DOC_PCT_WARN) return "amber";
  return "rose";
}

/** Cast string backend → union jenjang bila valid, jika tidak pakai default. */
function asJenjang(value: string | undefined): JenjangTujuan {
  const valid: JenjangTujuan[] = ["TK", "SD", "SMP", "SMA"];
  return valid.includes(value as JenjangTujuan)
    ? (value as JenjangTujuan)
    : LIVE_DEFAULT_JENJANG;
}

/**
 * Adaptasi satu baris live "Calon Siswa" → bentuk Pendaftar yang dipahami
 * kartu. Doctype Calon Siswa hanya membawa identitas (nama/nisn/jenis
 * kelamin/jenjang), jadi field PPDB lain (jalur/status/dokumen/biaya) diisi
 * default aman agar kartu tetap valid tanpa crash. `name` dipakai sebagai
 * noPendaftaran sehingga key dokumen live cocok untuk override cincin.
 */
export function calonSiswaToPendaftar(row: CalonSiswaLiveRow): Pendaftar {
  return {
    noPendaftaran: row.name,
    sekolah: "" as Pendaftar["sekolah"],
    namaLengkap: row.nama_lengkap ?? row.name,
    nisn: row.nisn,
    jenisKelamin: (row.jenis_kelamin as JenisKelamin) ?? LIVE_DEFAULT_GENDER,
    tempatLahir: "",
    tanggalLahir: "",
    agama: "Islam",
    kewarganegaraan: "WNI",
    jenjangTujuan: asJenjang(row.jenjang),
    jalur: LIVE_DEFAULT_JALUR,
    asalSekolah: "",
    statusPendaftaran: LIVE_DEFAULT_STATUS,
    tahunAjaran: "",
    tanggalDaftar: "",
    biayaPendaftaran: 0,
    totalBiaya: 0,
    totalDibayar: 0,
    wali: [],
    dokumen: [],
    tahapan: [],
    raporSmp: [],
    pembayaran: [],
    wawancara: [],
    aktivitas: [],
  };
}

interface CalonSiswaCardProps {
  pendaftar: Pendaftar;
  /** Pemanggil menyuntik tautan detail (mis. TanStack <Link to=...>). */
  renderDetailLink: (noPendaftaran: string, children: ReactNode) => ReactNode;
  /**
   * Kelengkapan dokumen live (per-pendaftaran). Bila ada, MENGGANTIKAN
   * perhitungan dari mock pendaftar.dokumen — fallback ke mock saat undefined.
   */
  docOverride?: DocCompleteness | undefined;
}

/**
 * Satu kartu pendaftar: identitas + badge jenjang/jalur + cincin kelengkapan
 * dokumen. Dibungkus <article> agar mudah di-scope dalam test (getByText →
 * closest("article")).
 */
export function CalonSiswaCard({
  pendaftar,
  renderDetailLink,
  docOverride,
}: CalonSiswaCardProps): ReactNode {
  // Live override jika tersedia, jika tidak hitung dari dokumen mock.
  const doc = docOverride ?? docCompleteness(pendaftar);
  const statusTone = TONE_BY_STATUS[pendaftar.statusPendaftaran] ?? "neutral";

  return (
    <article>
      <SectionCard className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <Avatar name={pendaftar.namaLengkap} src={pendaftar.fotoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">
              {pendaftar.namaLengkap}
            </p>
            <p className="truncate font-mono text-xs text-muted-fg">
              {pendaftar.noPendaftaran}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="brand">{pendaftar.jenjangTujuan}</Badge>
              <Badge tone="neutral">{pendaftar.jalur}</Badge>
            </div>
          </div>
          {/* Cincin kecil kelengkapan dokumen di pojok kanan kartu. */}
          <ProgressRing
            value={doc.pct}
            size={56}
            thickness={6}
            tone={docRingTone(doc.pct)}
            label={DOC_RING_LABEL}
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <Badge tone={statusTone} dot>
            {pendaftar.statusPendaftaran}
          </Badge>
          {/* CTA detail disuntik via renderDetailLink agar bebas-router. */}
          {renderDetailLink(
            pendaftar.noPendaftaran,
            <span
              className={cn(
                "inline-flex h-8 items-center rounded-md border border-border px-3",
                "text-xs font-medium text-fg transition-colors hover:border-brand hover:text-brand",
              )}
            >
              {VIEW_DETAIL_LABEL}
            </span>,
          )}
        </div>
      </SectionCard>
    </article>
  );
}
