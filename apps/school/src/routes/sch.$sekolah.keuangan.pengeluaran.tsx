/**
 * Operasional › Pengeluaran (school expenses).
 *
 * Bendahara record operational spending with an approval status. Adds a role
 * guide, expense-by-category donut, and approval KPIs.
 * Wired to the live `School Expense` doctype via usePengeluaranLive (company-scoped).
 * Includes an "Ajukan Pengeluaran" create modal; the doc is only submitted to
 * the GL when the chosen status is `Disetujui` or `Dibayar`.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Button,
  type Column,
  DataTable,
  FilterBar,
  FormField,
  FormGrid,
  InfoField,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  StatCard,
  type SelectFilter,
  IconCheck,
  IconClock,
  IconAlert,
  IconWallet,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceDoc } from "@sekolahpro/api-client";
import { DonutChart, type ChartDatum, type Tone } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import {
  FILTER_OPTIONS,
  formatRupiah,
  formatTanggal,
  type PengeluaranRow,
  type StatusPengeluaran,
  type KategoriPengeluaran,
} from "../data/keuangan";
import { usePengeluaranLive } from "../data/keuangan-live";
import { useActiveCompany } from "../lib/akuntansi-scope";
import { submitDoc, cancelDoc, docstatusBadge } from "../data/akuntansi";

const DOCTYPE_EXPENSE = "School Expense";

// Statuses for which the backend allows submit (posts to the GL).
const SUBMITTABLE_STATUS: ReadonlySet<string> = new Set(["Disetujui", "Dibayar"]);

const KATEGORI_OPTIONS = [
  "Operasional",
  "Gaji",
  "Sarana Prasarana",
  "Kegiatan",
  "ATK",
  "Utilitas",
  "Lainnya",
] as const;

const METODE_OPTIONS = ["Tunai", "Transfer", "QRIS", "Virtual Account", "EDC"] as const;

const STATUS_OPTIONS = ["Draft", "Approval", "Disetujui", "Ditolak", "Dibayar"] as const;

const TONE_PENGELUARAN: Record<StatusPengeluaran, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  Disetujui: "success",
  Approval: "warning",
  Ditolak: "danger",
  Dibayar: "brand",
  Draft: "neutral",
};

const KATEGORI_TONE: Record<KategoriPengeluaran, Tone> = {
  Operasional: "brand",
  Gaji: "violet",
  "Sarana Prasarana": "sky",
  Kegiatan: "amber",
  ATK: "emerald",
  Utilitas: "rose",
  Lainnya: "neutral",
};

const GUIDE_STEPS = [
  { title: "Ajukan pengeluaran", detail: "Isi kategori, deskripsi, jumlah, dan penerima. Status awal 'Draft' lalu 'Menunggu Approval'.", roles: ["bendahara"] },
  { title: "Persetujuan", detail: "Pengeluaran besar menunggu persetujuan Kepala Sekolah sebelum dibayar.", roles: ["kepala", "bendahara"] },
  { title: "Pembayaran & posting", detail: "Setelah 'Dibayar', transaksi mengalir ke jurnal di Akuntansi › Buku Besar.", roles: ["akuntan", "bendahara"] },
];

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

// Today as an ISO yyyy-mm-dd string for the posting_date default.
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function PengeluaranPage() {
  const [kategori, setKategori] = useState("Semua");
  const [status, setStatus] = useState("Semua");
  const [metode, setMetode] = useState("Semua");
  const [search, setSearch] = useState("");

  const { rows: scoped, isLoading, refetch } = usePengeluaranLive();
  const company = useActiveCompany();
  const create = useResourceCreate<{ name: string }>(DOCTYPE_EXPENSE);

  // Create-modal state.
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fPostingDate, setFPostingDate] = useState(todayIso());
  const [fKategori, setFKategori] = useState<string>(KATEGORI_OPTIONS[0]);
  const [fDeskripsi, setFDeskripsi] = useState("");
  const [fJumlah, setFJumlah] = useState(0);
  const [fPenerima, setFPenerima] = useState("");
  const [fMetode, setFMetode] = useState<string>(METODE_OPTIONS[0]);
  const [fExpenseAccount, setFExpenseAccount] = useState("");
  const [fPaidFrom, setFPaidFrom] = useState("");
  const [fStatus, setFStatus] = useState<string>("Draft");

  // Detail/cancel-modal state: open a row's doc, then Submit (Draft) or Batalkan (Submitted).
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const [busy2, setBusy2] = useState(false);
  const detail = useResourceDoc<Record<string, unknown>>(DOCTYPE_EXPENSE, detailId);
  const doc = detail.data;
  const docstatus = typeof doc?.docstatus === "number" ? doc.docstatus : 0;
  const docstatusTag = docstatusBadge(docstatus === 1 ? 1 : docstatus === 2 ? 2 : 0);

  // Runs a submit/cancel action against the open doc, then refreshes and closes.
  const act = async (fn: (dt: string, name: string) => Promise<unknown>) => {
    if (!detailId) return;
    setBusy2(true);
    try {
      await fn(DOCTYPE_EXPENSE, detailId);
      refetch();
      setDetailId(undefined);
    } finally {
      setBusy2(false);
    }
  };

  // Renders a doc field as a readable string for the detail rows.
  const fieldText = (key: string): string => {
    const v = doc?.[key];
    if (v === null || v === undefined || v === "") return "—";
    return String(v);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((p) => {
      if (q && !`${p.deskripsi} ${p.penerima} ${p.id}`.toLowerCase().includes(q)) return false;
      if (kategori !== "Semua" && p.kategori !== kategori) return false;
      if (status !== "Semua" && p.status !== status) return false;
      if (metode !== "Semua" && p.metode !== metode) return false;
      return true;
    });
  }, [scoped, search, kategori, status, metode]);

  const counts = useMemo(() => {
    const c = { Disetujui: 0, Approval: 0, Ditolak: 0, Dibayar: 0 } as Record<string, number>;
    filtered.forEach((p) => {
      if (p.status in c) c[p.status] = (c[p.status] ?? 0) + 1;
    });
    return c;
  }, [filtered]);

  const donut = useMemo<ChartDatum[]>(() => {
    const totals = new Map<KategoriPengeluaran, number>();
    for (const p of filtered) totals.set(p.kategori, (totals.get(p.kategori) ?? 0) + p.jumlah);
    return [...totals.entries()]
      .map(([k, value]) => ({ label: k, value, tone: KATEGORI_TONE[k] }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const totalBelanja = useMemo(() => filtered.reduce((s, p) => s + p.jumlah, 0), [filtered]);

  const canSave = !!fDeskripsi.trim() && fJumlah > 0 && !!fExpenseAccount.trim() && !!fPaidFrom.trim();

  const resetForm = () => {
    setFPostingDate(todayIso());
    setFKategori(KATEGORI_OPTIONS[0]);
    setFDeskripsi("");
    setFJumlah(0);
    setFPenerima("");
    setFMetode(METODE_OPTIONS[0]);
    setFExpenseAccount("");
    setFPaidFrom("");
    setFStatus("Draft");
    setErr(null);
  };

  const handleSave = async () => {
    setBusy(true);
    setErr(null);
    try {
      const doc = await create.mutateAsync({
        posting_date: fPostingDate,
        company,
        kategori: fKategori,
        deskripsi: fDeskripsi,
        jumlah: fJumlah,
        metode: fMetode,
        expense_account: fExpenseAccount,
        paid_from: fPaidFrom,
        status: fStatus,
        ...(fPenerima.trim() ? { penerima: fPenerima } : {}),
      } as Record<string, unknown>);
      // Backend only allows submit when status is Disetujui or Dibayar.
      if (SUBMITTABLE_STATUS.has(fStatus)) await submitDoc(DOCTYPE_EXPENSE, doc.name);
      setOpen(false);
      resetForm();
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  const filters: SelectFilter[] = [
    { key: "kategori", label: "Kategori", value: kategori, options: buildOptions(FILTER_OPTIONS.kategoriPengeluaran), onChange: setKategori },
    { key: "status", label: "Status", value: status, options: buildOptions(FILTER_OPTIONS.statusPengeluaran), onChange: setStatus },
    { key: "metode", label: "Metode", value: metode, options: buildOptions(FILTER_OPTIONS.metode), onChange: setMetode },
  ];

  const cols: Column<PengeluaranRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
    { key: "kategori", header: "Kategori", cell: (r) => <Badge tone="brand">{r.kategori}</Badge> },
    { key: "deskripsi", header: "Deskripsi", cell: (r) => <span className="text-sm">{r.deskripsi}</span> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
    { key: "penerima", header: "Penerima", cell: (r) => <span className="text-sm">{r.penerima}</span> },
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TONE_PENGELUARAN[r.status]} dot>{r.status}</Badge> },
    { key: "approver", header: "Approver", cell: (r) => <span className="text-sm text-muted-fg">{r.approver ?? "—"}</span> },
    { key: "aksi", header: "", align: "right", cell: (r) => <Button variant="ghost" onClick={() => setDetailId(r.id)}>Detail</Button> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Pengeluaran"
        description="Catat belanja operasional sekolah dan alur persetujuannya."
        actions={<Button onClick={() => { resetForm(); setOpen(true); }}>Ajukan Pengeluaran</Button>}
      />

      <KeuanganPageGuide storageId="pengeluaran" steps={GUIDE_STEPS} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Disetujui" value={counts.Disetujui ?? 0} accent="emerald" icon={<IconCheck />} />
          <StatCard label="Menunggu Approval" value={counts.Approval ?? 0} accent="amber" icon={<IconClock />} />
          <StatCard label="Ditolak" value={counts.Ditolak ?? 0} accent="rose" icon={<IconAlert />} />
          <StatCard label="Dibayar" value={counts.Dibayar ?? 0} accent="brand" icon={<IconWallet />} />
        </div>
        <SectionCard title="Belanja per Kategori" description={formatRupiah(totalBelanja)}>
          <div className="flex justify-center">
            <DonutChart data={donut} centerTop={<span className="text-sm font-semibold">{donut.length}</span>} centerBottom={<span className="text-[11px] text-muted-fg">kategori</span>} />
          </div>
        </SectionCard>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari deskripsi, penerima, atau ID..." }}
        filters={filters}
      />

      <SectionCard title={isLoading ? "Memuat pengeluaran…" : `${filtered.length} pengeluaran`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajukan Pengeluaran">
        {err && <div className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{err}</div>}
        <FormGrid cols={2}>
          <FormField label="Tanggal" required>
            <Input type="date" value={fPostingDate} onChange={(e) => setFPostingDate(e.target.value)} />
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={company} disabled />
          </FormField>
          <FormField label="Kategori" required>
            <Select value={fKategori} onChange={(e) => setFKategori(e.target.value)}>
              {KATEGORI_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
          <FormField label="Jumlah (IDR)" required>
            <Input type="number" value={fJumlah || ""} onChange={(e) => setFJumlah(Number(e.target.value) || 0)} />
          </FormField>
          <FormField label="Penerima">
            <Input value={fPenerima} onChange={(e) => setFPenerima(e.target.value)} />
          </FormField>
          <FormField label="Metode">
            <Select value={fMetode} onChange={(e) => setFMetode(e.target.value)}>
              {METODE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
          <FormField label="Expense Account" required>
            <Input value={fExpenseAccount} onChange={(e) => setFExpenseAccount(e.target.value)} placeholder="Nama akun beban" />
          </FormField>
          <FormField label="Paid From (Account)" required>
            <Input value={fPaidFrom} onChange={(e) => setFPaidFrom(e.target.value)} placeholder="Kas / Bank account name" />
          </FormField>
          <FormField label="Status">
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
        </FormGrid>
        <FormField label="Deskripsi" required className="mt-3">
          <Input value={fDeskripsi} onChange={(e) => setFDeskripsi(e.target.value)} placeholder="Keterangan pengeluaran" />
        </FormField>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button onClick={handleSave} disabled={busy || !canSave}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>

      <Modal open={!!detailId} onClose={() => setDetailId(undefined)} title="Detail Pengeluaran">
        {detail.isLoading ? (
          <p className="text-sm text-muted-fg">Memuat…</p>
        ) : doc ? (
          <div className="space-y-3">
            <Badge tone={docstatusTag.tone} dot>{docstatusTag.label}</Badge>
            <FormGrid cols={2}>
              <InfoField label="Kategori" value={fieldText("kategori")} />
              <InfoField label="Jumlah" value={formatRupiah(typeof doc.jumlah === "number" ? doc.jumlah : 0)} />
              <InfoField label="Penerima" value={fieldText("penerima")} />
              <InfoField label="Metode" value={fieldText("metode")} />
              <InfoField label="Status" value={fieldText("status")} />
              <InfoField label="Approver" value={fieldText("approver")} />
              <InfoField label="Posting Date" value={fieldText("posting_date")} />
            </FormGrid>
            <InfoField label="Deskripsi" value={fieldText("deskripsi")} />
            <div className="flex gap-2 pt-2">
              {docstatus === 0 ? (
                <Button onClick={() => act(submitDoc)} disabled={busy2}>{busy2 ? "Memproses…" : "Submit"}</Button>
              ) : null}
              {docstatus === 1 ? (
                <Button variant="destructive" onClick={() => act(cancelDoc)} disabled={busy2}>{busy2 ? "Memproses…" : "Batalkan"}</Button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-fg">Tidak ditemukan.</p>
        )}
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/pengeluaran")({ component: PengeluaranPage });
