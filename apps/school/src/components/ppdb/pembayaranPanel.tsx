/**
 * PembayaranPanel — panel analitik pembayaran PPDB (khusus halaman pembayaran).
 *
 * Mengangkat tiga visual ringkas ke atas tabel pembayaran agar staff/manajer
 * langsung melihat kesehatan keuangan PPDB:
 *  - GaugeArc: dana terkumpul terhadap total tagihan (paymentSummary).
 *  - DonutChart: komposisi status pembayaran (paymentStatusDistribution).
 *  - Daftar aging: tagihan tertunda yang sudah melewati ambang hari, dengan
 *    tombol "Catat Pembayaran" yang membuka modal pencatatan manual.
 *
 * Komponen presentational: semua agregasi dihitung di lib/ppdbAnalytics. Modal
 * pencatatan bersifat lokal (belum ada endpoint) — menerima callback onSubmit.
 */
import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  SectionCard,
} from "@sekolahpro/ui";
import { DonutChart } from "../viz/charts";
import { GaugeArc } from "../viz/advanced";
import {
  paymentSummary,
  paymentStatusDistribution,
  paymentAging,
  type AgingRow,
} from "../../lib/ppdbAnalytics";
import { formatRupiah, type Pendaftar } from "../../data/ppdb";

// Ambang umur tunggakan (hari) sebelum dianggap perlu ditindaklanjuti.
const AGING_THRESHOLD_DAYS = 3;
// Maksimal baris aging yang ditampilkan; sisanya cukup diwakili ringkasan.
const AGING_PREVIEW_LIMIT = 8;
// Aksesibilitas: nama region aging dipakai test + screen reader.
const AGING_REGION_LABEL = "Tunggakan pembayaran (aging)";

interface PembayaranPanelProps {
  /** Daftar pendaftar tersaring per sekolah (sumber agregasi pembayaran). */
  list: Pendaftar[];
  /** Tanggal hari ini (ISO) untuk perhitungan umur tunggakan. */
  todayIso: string;
}

/** Satu kartu metrik kecil di header panel (label + nilai rupiah). */
function MetricChip({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-[11px] text-muted-fg">{label}</div>
      <div className="text-sm font-semibold tabular-nums text-fg">{value}</div>
    </div>
  );
}

/** Baris aging tunggakan dengan tombol catat-pembayaran. */
function AgingRowItem({
  row,
  onRecord,
}: {
  row: AgingRow;
  onRecord: (row: AgingRow) => void;
}): ReactNode {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">{row.namaLengkap}</div>
        <div className="font-mono text-[11px] text-muted-fg">{row.noPendaftaran}</div>
      </div>
      <div className="text-right">
        <div className="text-sm tabular-nums text-fg">{formatRupiah(row.jumlah)}</div>
        {/* Tone danger menandai tunggakan yang melewati ambang hari. */}
        <Badge tone="danger" dot>
          {row.hari} hari
        </Badge>
      </div>
      <Button size="sm" variant="outline" onClick={() => onRecord(row)}>
        Catat Pembayaran
      </Button>
    </li>
  );
}

/** Bagian aging: daftar tunggakan melewati ambang, atau kosong. */
function AgingSection({
  rows,
  onRecord,
}: {
  rows: AgingRow[];
  onRecord: (row: AgingRow) => void;
}): ReactNode {
  return (
    <section aria-label={AGING_REGION_LABEL}>
      <SectionCard
        title="Tunggakan Perlu Ditindaklanjuti"
        description={`Tagihan tertunda lebih dari ${AGING_THRESHOLD_DAYS} hari.`}
        padded={false}
      >
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-fg">
            Tidak ada tunggakan melewati ambang. Bagus!
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.slice(0, AGING_PREVIEW_LIMIT).map((row) => (
              <AgingRowItem key={row.noPendaftaran} row={row} onRecord={onRecord} />
            ))}
          </ul>
        )}
      </SectionCard>
    </section>
  );
}

/** Modal pencatatan pembayaran manual untuk satu tunggakan. */
function RecordPaymentModal({
  row,
  onClose,
  onSubmit,
}: {
  row: AgingRow | null;
  onClose: () => void;
  onSubmit: (row: AgingRow, jumlah: number) => void;
}): ReactNode {
  const [jumlah, setJumlah] = useState("");
  // Reset input saat target tunggakan berganti (modal dibuka ulang).
  const targetKey = row?.noPendaftaran ?? "";

  return (
    <Modal
      open={row !== null}
      onClose={onClose}
      title="Catat Pembayaran"
      description={row ? `${row.namaLengkap} • ${row.noPendaftaran}` : ""}
      tone="emerald"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!row) return;
              // Default ke jumlah tagihan bila pengguna tidak mengisi nominal.
              const parsed = Number(jumlah) || row.jumlah;
              onSubmit(row, parsed);
              setJumlah("");
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormField label="Jumlah dibayar (Rp)" hint={`Tagihan: ${row ? formatRupiah(row.jumlah) : "-"}`}>
          <Input
            key={targetKey}
            type="number"
            inputMode="numeric"
            placeholder={row ? String(row.jumlah) : "0"}
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
          />
        </FormField>
        <p className="text-xs text-muted-fg">
          Pencatatan manual ini untuk pembayaran tunai/transfer di luar gateway.
        </p>
      </div>
    </Modal>
  );
}

/**
 * Panel analitik pembayaran: gauge terkumpul-vs-tagihan, donut status, dan
 * daftar aging tunggakan dengan modal pencatatan manual.
 */
export function PembayaranPanel({ list, todayIso }: PembayaranPanelProps): ReactNode {
  const summary = useMemo(() => paymentSummary(list), [list]);
  const distribution = useMemo(() => paymentStatusDistribution(list), [list]);
  const aging = useMemo(
    () => paymentAging(list, todayIso, AGING_THRESHOLD_DAYS),
    [list, todayIso],
  );

  // State modal: tunggakan yang sedang dicatat pembayarannya (null = tertutup).
  const [recording, setRecording] = useState<AgingRow | null>(null);
  // Feedback lokal pencatatan (belum ada endpoint — sekadar konfirmasi UI).
  const [recorded, setRecorded] = useState<string | null>(null);

  /** Tutup modal pencatatan tanpa menyimpan. */
  function closeModal(): void {
    setRecording(null);
  }

  /** Simpan pencatatan manual lalu tampilkan konfirmasi ringkas. */
  function handleRecord(row: AgingRow): void {
    setRecorded(`Pembayaran ${row.namaLengkap} tercatat (manual).`);
    setRecording(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Penerimaan Dana"
          description="Dana terkumpul terhadap total tagihan PPDB."
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <GaugeArc
              value={summary.collected}
              max={summary.billed}
              tone="emerald"
              label="Terkumpul / Tagihan"
            />
            <div className="grid w-full max-w-[220px] gap-2">
              <MetricChip label="Total tagihan" value={formatRupiah(summary.billed)} />
              <MetricChip label="Terkumpul" value={formatRupiah(summary.collected)} />
              <MetricChip label="Belum terbayar" value={formatRupiah(summary.outstanding)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Status Pembayaran"
          description="Komposisi tagihan Lunas, Cicilan, dan Tertunda."
        >
          <div className="flex justify-center">
            <DonutChart
              data={distribution}
              centerTop={String(summary.pctCollected) + "%"}
              centerBottom="terkumpul"
            />
          </div>
        </SectionCard>
      </div>

      {recorded ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
          {recorded}
        </div>
      ) : null}

      <AgingSection rows={aging} onRecord={setRecording} />

      <RecordPaymentModal
        row={recording}
        onClose={closeModal}
        onSubmit={handleRecord}
      />
    </div>
  );
}
