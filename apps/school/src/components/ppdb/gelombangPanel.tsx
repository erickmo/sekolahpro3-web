/**
 * GelombangBatchCard — kartu ringkas satu batch Gelombang PPDB.
 *
 * Menyajikan tiga sudut pandang sekaligus untuk satu gelombang:
 *  1. GaugeArc kuota (pendaftar terisi / kuota) lewat quotaInfo,
 *  2. mini FunnelChart komposisi status pendaftar di batch itu (jika ada data),
 *  3. timeline teks tanggal_buka..tanggal_tutup + status & biaya.
 *
 * Komponen presentational: semua hitungan analitik diterima sebagai prop atau
 * dihitung dari helper murni (ppdbAnalytics). Aksi ubah-status disuntik lewat
 * callback agar kartu tidak terikat ke layer data/mutasi tertentu.
 *
 * HANYA diimpor oleh route sch.$sekolah.ppdb.gelombang.tsx (colocated child).
 */

import type { ReactNode } from "react";
import { Badge, Button, SectionCard } from "@sekolahpro/ui";
import { FunnelChart, GaugeArc } from "../viz";
import { funnelData } from "../../lib/ppdbAnalytics";
import { quotaInfo } from "../../lib/ppdbAnalytics";

/** Baris Gelombang PPDB seperti yang dipakai halaman (subset doctype). */
export interface GelombangRow {
  name: string;
  nama?: string;
  tingkat?: string;
  status?: string;
  tahun_ajaran?: string;
  sekolah?: string;
  tanggal_buka?: string;
  tanggal_tutup?: string;
  biaya_pendaftaran?: number;
  kuota?: number;
}

/** Baris status pendaftaran untuk komposisi funnel per batch. */
export interface BatchStatusRow {
  status?: string;
}

interface Props {
  gelombang: GelombangRow;
  /** Jumlah pendaftar tercatat di batch ini (untuk kuota meter). */
  terisi: number;
  /** Baris status pendaftaran milik batch ini (untuk mini funnel). */
  statusRows: BatchStatusRow[];
  /** True saat mutasi status sedang berjalan (men-disable tombol). */
  busy: boolean;
  /** Callback ubah status batch (Aktifkan / Tutup). */
  onToggleStatus: (next: "Aktif" | "Tutup") => void;
}

// Token UI Bahasa Indonesia — tidak boleh tersebar sebagai magic string.
const LABEL_KUOTA = "Kuota terisi";
const LABEL_KOMPOSISI = "Komposisi status pendaftar";
const LABEL_BUKA = "Buka";
const LABEL_TUTUP = "Tutup";
const LABEL_BIAYA = "Biaya pendaftaran";
const DASH = "—";
const KUOTA_TANPA_BATAS = "∞";
const STATUS_AKTIF = "Aktif";
const ACTION_AKTIFKAN = "Aktifkan";
const ACTION_TUTUP = "Tutup";
const LOCALE_ID = "id-ID";

/** Peta status batch → tone Badge @sekolahpro/ui. */
const STATUS_TONE: Record<string, "success" | "neutral" | "warning"> = {
  Aktif: "success",
  Tutup: "neutral",
  Draft: "warning",
};

/** Format angka rupiah ringkas tanpa simbol mata uang penuh. */
function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString(LOCALE_ID)}`;
}

/** Resolusi tone Badge untuk status batch (fallback netral). */
function toneFor(status: string | undefined): "success" | "neutral" | "warning" {
  return STATUS_TONE[status ?? ""] ?? "neutral";
}

/** Header kartu: nama batch, meta (TA/tingkat), badge status. */
function CardHeader({ gelombang }: { gelombang: GelombangRow }): ReactNode {
  const meta = [
    gelombang.tahun_ajaran && `TA ${gelombang.tahun_ajaran}`,
    gelombang.tingkat && `Tingkat ${gelombang.tingkat}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-fg">
          {gelombang.nama ?? gelombang.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-fg">{meta || DASH}</p>
      </div>
      <Badge tone={toneFor(gelombang.status)} dot>
        {gelombang.status ?? DASH}
      </Badge>
    </div>
  );
}

/** Baris timeline + biaya batch (tanggal buka..tutup, biaya pendaftaran). */
function CardTimeline({ gelombang }: { gelombang: GelombangRow }): ReactNode {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      <dt className="text-muted-fg">{LABEL_BUKA}</dt>
      <dd className="text-right tabular-nums text-fg">
        {gelombang.tanggal_buka ?? DASH}
      </dd>
      <dt className="text-muted-fg">{LABEL_TUTUP}</dt>
      <dd className="text-right tabular-nums text-fg">
        {gelombang.tanggal_tutup ?? DASH}
      </dd>
      <dt className="text-muted-fg">{LABEL_BIAYA}</dt>
      <dd className="text-right tabular-nums text-fg">
        {formatRupiah(gelombang.biaya_pendaftaran ?? 0)}
      </dd>
    </dl>
  );
}

/** Tombol aksi ubah status: Aktifkan saat non-aktif, Tutup saat aktif. */
function CardAction({ gelombang, busy, onToggleStatus }: Props): ReactNode {
  if (gelombang.status === STATUS_AKTIF) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onToggleStatus("Tutup")}
      >
        {ACTION_TUTUP}
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={() => onToggleStatus("Aktif")}
      className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
    >
      {ACTION_AKTIFKAN}
    </Button>
  );
}

/**
 * Kartu batch gelombang lengkap: gauge kuota, mini funnel status, timeline.
 * FunnelChart dilewati ketika tidak ada baris status (degradasi anggun).
 */
export function GelombangBatchCard(props: Props): ReactNode {
  const { gelombang, terisi, statusRows } = props;
  const kuota = gelombang.kuota ?? 0;
  const quota = quotaInfo(terisi, kuota);
  const stages = funnelData(statusRows);
  const hasStatusData = statusRows.length > 0;
  // Tampilkan total tak terbatas saat kuota 0 (gelombang tanpa pembatasan).
  const kuotaLabel = kuota > 0 ? String(kuota) : KUOTA_TANPA_BATAS;

  return (
    <SectionCard className="flex flex-col gap-4">
      <CardHeader gelombang={gelombang} />

      <div className="flex flex-col items-center gap-1">
        <GaugeArc
          value={quota.filled}
          max={kuota}
          tone="brand"
          size={150}
          label={`${LABEL_KUOTA} (${terisi}/${kuotaLabel})`}
        />
      </div>

      {hasStatusData ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-fg">
            {LABEL_KOMPOSISI}
          </p>
          <FunnelChart stages={stages} />
        </div>
      ) : null}

      <CardTimeline gelombang={gelombang} />

      <div className="flex justify-end">
        <CardAction {...props} />
      </div>
    </SectionCard>
  );
}
