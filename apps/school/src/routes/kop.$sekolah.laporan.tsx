import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  PageHeader,
  SectionCard,
  StatCard,
  IconWallet,
  IconCheck,
  IconAlert,
  IconUsers,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";
import { RekapSection } from "../components/koperasi-laporan/RekapSection";
import {
  ARUS_COLUMNS,
  ArusFooter,
  csvArus,
  csvKomposisi,
  csvKualitas,
  csvMutasi,
  KOMPOSISI_COLUMNS,
  KomposisiFooter,
  KUALITAS_COLUMNS,
  KualitasFooter,
  MUTASI_COLUMNS,
  MutasiFooter,
} from "../components/koperasi-laporan/reports";
import {
  rekapArusKasTeller,
  rekapKomposisiSimpanan,
  rekapKualitasPembiayaan,
  rekapMutasiSimpanan,
  type AkadRow,
  type RekeningRow,
  type SesiKasRow,
  type TransaksiRow,
} from "../lib/koperasi/laporan";
import { downloadCsv } from "../lib/stub";
import { formatRupiah } from "../lib/koperasi/format";

const STATUS_PEMBIAYAAN_AKTIF = "Aktif";
const STATUS_PEMBIAYAAN_MACET = "Macet";
const STATUS_ANGGOTA_AKTIF = "Aktif";

/** Local yyyy-mm-dd (no UTC shift) for Frappe date filters + filenames. */
function localIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Default report window: from the 1st of the current month through today. */
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  return { from: localIso(new Date(now.getFullYear(), now.getMonth(), 1)), to: localIso(now) };
}

function LaporanKoperasiPage() {
  const [range, setRange] = useState(defaultRange);
  const dateFilter: [string, string, string][] = [
    ["tanggal", ">=", range.from],
    ["tanggal", "<=", range.to],
  ];

  // Period-bound movement (Transaksi Simpanan, Sesi Kas Teller); point-in-time
  // snapshots (Rekening, Akad, Anggota) intentionally carry no date filter.
  const transaksi = useResourceList<TransaksiRow>("Transaksi Simpanan", {
    fields: ["jenis", "jumlah"],
    filters: dateFilter,
    limit_page_length: 0,
  });
  const sesi = useResourceList<SesiKasRow>("Sesi Kas Teller", {
    fields: ["teller", "status", "total_setoran", "total_penarikan", "selisih"],
    filters: dateFilter,
    limit_page_length: 0,
  });
  const rekening = useResourceList<RekeningRow & { name: string }>("Rekening Simpanan", {
    fields: ["name", "saldo", "status"],
    limit_page_length: 0,
  });
  const pembiayaan = useResourceList<AkadRow & { name: string }>("Akad Pembiayaan", {
    fields: ["name", "jumlah_pokok", "status"],
    limit_page_length: 0,
  });
  const anggota = useResourceList<{ status?: string }>("Anggota Koperasi", {
    fields: ["name", "status"],
    limit_page_length: 0,
  });

  const mutasi = useMemo(() => rekapMutasiSimpanan(transaksi.data ?? []), [transaksi.data]);
  const arus = useMemo(() => rekapArusKasTeller(sesi.data ?? []), [sesi.data]);
  const komposisi = useMemo(() => rekapKomposisiSimpanan(rekening.data ?? []), [rekening.data]);
  const kualitas = useMemo(() => rekapKualitasPembiayaan(pembiayaan.data ?? []), [pembiayaan.data]);

  const aktif = kualitas.perStatus.find((p) => p.status === STATUS_PEMBIAYAAN_AKTIF);
  const macet = kualitas.perStatus.find((p) => p.status === STATUS_PEMBIAYAAN_MACET);
  const anggotaAktif = (anggota.data ?? []).filter((a) => a.status === STATUS_ANGGOTA_AKTIF).length;

  const suffix = `${range.from}-sd-${range.to}`;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Koperasi" title="Laporan" description="Ringkasan simpanan, pembiayaan, & anggota." />
      <KoperasiPageGuide id="laporan" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Simpanan" value={formatRupiah(komposisi.totalSaldo)} icon={<IconWallet />} accent="emerald" />
        <StatCard label="Pembiayaan Berjalan" value={formatRupiah(aktif?.pokok ?? 0)} hint={`${aktif?.count ?? 0} akad aktif`} icon={<IconCheck />} accent="brand" />
        <StatCard label="Pembiayaan Macet" value={(macet?.count ?? 0).toLocaleString("id-ID")} hint="akad" icon={<IconAlert />} accent="rose" />
        <StatCard label="Anggota Aktif" value={anggotaAktif.toLocaleString("id-ID")} icon={<IconUsers />} accent="violet" />
      </div>

      <SectionCard title="Periode laporan" description="Batasi mutasi simpanan & kas teller pada rentang tanggal ini.">
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-fg">Dari</span>
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-fg">Sampai</span>
            <input
              type="date"
              value={range.to}
              min={range.from}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm"
            />
          </label>
        </div>
      </SectionCard>

      <RekapSection
        title="Mutasi Simpanan"
        description="Pergerakan saldo simpanan anggota per jenis transaksi (kredit menambah, debit mengurangi)."
        columns={MUTASI_COLUMNS}
        rows={mutasi.perJenis}
        rowKey={(r) => r.jenis}
        footer={<MutasiFooter rekap={mutasi} />}
        empty="Tidak ada transaksi pada periode ini."
        onUnduh={() => downloadCsv(`laporan-mutasi-simpanan-${suffix}.csv`, csvMutasi(mutasi))}
      />

      <RekapSection
        title="Arus Kas Teller"
        description="Total setoran & penarikan tunai dari sesi kas yang sudah ditutup, per teller."
        columns={ARUS_COLUMNS}
        rows={arus.perTeller}
        rowKey={(r) => r.teller}
        footer={<ArusFooter rekap={arus} />}
        empty="Belum ada sesi kas ditutup pada periode ini."
        onUnduh={() => downloadCsv(`laporan-arus-kas-teller-${suffix}.csv`, csvArus(arus))}
      />

      <RekapSection
        title="Komposisi Simpanan"
        description="Sebaran rekening simpanan menurut status (posisi terkini)."
        columns={KOMPOSISI_COLUMNS}
        rows={komposisi.perStatus}
        rowKey={(r) => r.status}
        footer={<KomposisiFooter rekap={komposisi} />}
        empty="Belum ada rekening simpanan."
        onUnduh={() => downloadCsv(`laporan-komposisi-simpanan-${range.to}.csv`, csvKomposisi(komposisi))}
      />

      <RekapSection
        title="Kualitas Pembiayaan"
        description="Sebaran akad menurut status + rasio NPF (basis pokok awal, penyebut Aktif + Macet)."
        columns={KUALITAS_COLUMNS}
        rows={kualitas.perStatus}
        rowKey={(r) => r.status}
        footer={<KualitasFooter rekap={kualitas} />}
        empty="Belum ada akad pembiayaan."
        onUnduh={() => downloadCsv(`laporan-kualitas-pembiayaan-${range.to}.csv`, csvKualitas(kualitas))}
      />

      <SectionCard title="Neraca & laporan PSAK">
        <p className="text-sm text-muted-fg">
          Neraca syariah (PSAK 101-110), laba rugi, &amp; arus kas akuntansi bersumber dari modul
          Akuntansi (buku besar) — bukan disusun ulang di sini agar angka tetap satu sumber.
          Buka modul Akuntansi untuk laporan keuangan formal.
        </p>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/kop/$sekolah/laporan")({ component: LaporanKoperasiPage });
