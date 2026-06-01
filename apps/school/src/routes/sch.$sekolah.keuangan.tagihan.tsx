/**
 * Operasional › Tagihan (student billing).
 *
 * Bendahara/Kasir issue & track SPP and other student bills. Adds a role-aware
 * guide, a status distribution bar, and KPI counters over the table.
 * Wired to the live `School Fee Invoice` doctype (vernon_accounting) via
 * useTagihanLive, scoped to the active company. The "Buat Tagihan" header
 * action opens a create modal that posts a new invoice and submits it.
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
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  StatCard,
  type SelectFilter,
  InfoField,
  IconWallet,
  IconCheck,
  IconAlert,
  IconClock,
  IconPlus,
} from "@sekolahpro/ui";
import { useResourceCreate, useResourceDoc } from "@sekolahpro/api-client";
import { DistributionBar, type DistributionSegment } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import {
  FILTER_OPTIONS,
  formatRupiah,
  formatTanggal,
  type TagihanRow,
  type StatusTagihan,
} from "../data/keuangan";
import { useTagihanLive } from "../data/keuangan-live";
import { useActiveCompany } from "../lib/akuntansi-scope";
import { submitDoc, cancelDoc, docstatusBadge } from "../data/akuntansi";

const TONE_TAGIHAN: Record<StatusTagihan, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  Lunas: "success",
  Tertunda: "warning",
  "Jatuh Tempo": "danger",
  Cicilan: "brand",
  Draft: "neutral",
  Terkirim: "brand",
  Dibatalkan: "neutral",
};

const FEE_INVOICE_DOCTYPE = "School Fee Invoice";

const GUIDE_STEPS = [
  { title: "Terbitkan tagihan", detail: "Klik 'Buat Tagihan' untuk SPP atau biaya lain. Tagihan terkirim ke wali murid.", roles: ["bendahara"] },
  { title: "Pantau status", detail: "Gunakan filter status untuk melihat yang Jatuh Tempo atau Tertunda lebih dulu.", roles: ["bendahara", "kasir"] },
  { title: "Tindak lanjut tunggakan", detail: "Sisa terbesar perlu diprioritaskan. Hubungi wali murid untuk pelunasan.", roles: ["kepala", "bendahara"] },
];

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

/** Today's date as an ISO yyyy-mm-dd string. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function TagihanPage() {
  const [status, setStatus] = useState("Semua");
  const [kelas, setKelas] = useState("Semua");
  const [tahunAjaran, setTahunAjaran] = useState("Semua");
  const [search, setSearch] = useState("");

  const { rows: scoped, isLoading, refetch } = useTagihanLive();
  const company = useActiveCompany();
  const create = useResourceCreate<{ name: string }>(FEE_INVOICE_DOCTYPE);

  // Create-modal state (mirrors akuntansi create pattern).
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [postingDate, setPostingDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState("");
  const [student, setStudent] = useState("");
  const [studentName, setStudentName] = useState("");
  const [formKelas, setFormKelas] = useState("");
  const [judul, setJudul] = useState("");
  const [formTahunAjaran, setFormTahunAjaran] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [dibayar, setDibayar] = useState("0");
  const [receivableAccount, setReceivableAccount] = useState("");
  const [incomeAccount, setIncomeAccount] = useState("");

  // Detail/cancel-modal state: open a row's invoice, then Submit or Batalkan it.
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const [busy2, setBusy2] = useState(false);
  const detail = useResourceDoc<Record<string, unknown>>(FEE_INVOICE_DOCTYPE, detailId);
  const doc = detail.data;
  const docstatus = typeof doc?.docstatus === "number" ? doc.docstatus : 0;
  const docBadge = docstatusBadge(docstatus === 1 ? 1 : docstatus === 2 ? 2 : 0);

  // Run a submit/cancel action against the open invoice, then refresh & close.
  const act = async (fn: (dt: string, name: string) => Promise<unknown>) => {
    if (!detailId) return;
    setBusy2(true);
    try {
      await fn(FEE_INVOICE_DOCTYPE, detailId);
      refetch();
      setDetailId(undefined);
    } finally {
      setBusy2(false);
    }
  };

  // Coerce an unknown doc field to a display string for the InfoField rows.
  const fieldText = (key: string): string => {
    const v = doc?.[key];
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "number") return String(v);
    if (typeof v === "string") return v;
    return String(v);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((t) => {
      if (q && !`${t.siswa} ${t.judul} ${t.id}`.toLowerCase().includes(q)) return false;
      if (status !== "Semua" && t.status !== status) return false;
      if (kelas !== "Semua" && t.kelas !== kelas) return false;
      if (tahunAjaran !== "Semua" && t.tahunAjaran !== tahunAjaran) return false;
      return true;
    });
  }, [scoped, search, status, kelas, tahunAjaran]);

  const counts = useMemo(() => {
    const c = { Lunas: 0, Tertunda: 0, "Jatuh Tempo": 0, Cicilan: 0 } as Record<string, number>;
    filtered.forEach((t) => {
      if (t.status in c) c[t.status] = (c[t.status] ?? 0) + 1;
    });
    return c;
  }, [filtered]);

  const distribution = useMemo<DistributionSegment[]>(
    () => [
      { label: "Lunas", value: counts.Lunas ?? 0, tone: "emerald" },
      { label: "Tertunda", value: counts.Tertunda ?? 0, tone: "amber" },
      { label: "Jatuh Tempo", value: counts["Jatuh Tempo"] ?? 0, tone: "rose" },
      { label: "Cicilan", value: counts.Cicilan ?? 0, tone: "brand" },
    ],
    [counts],
  );

  const filters: SelectFilter[] = [
    { key: "status", label: "Status", value: status, options: buildOptions(FILTER_OPTIONS.statusTagihan), onChange: setStatus },
    { key: "kelas", label: "Kelas", value: kelas, options: buildOptions(FILTER_OPTIONS.kelas), onChange: setKelas },
    { key: "tahunAjaran", label: "Tahun Ajaran", value: tahunAjaran, options: buildOptions(FILTER_OPTIONS.tahunAjaran), onChange: setTahunAjaran },
  ];

  const cols: Column<TagihanRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    {
      key: "siswa",
      header: "Siswa",
      cell: (r) => (
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{r.siswa}</div>
          <div className="text-xs text-muted-fg">{r.kelas}</div>
        </div>
      ),
    },
    { key: "judul", header: "Judul", cell: (r) => <span className="text-sm">{r.judul}</span> },
    { key: "jt", header: "Jatuh Tempo", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.jatuhTempo)}</span> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums">{formatRupiah(r.jumlah)}</span> },
    { key: "dibayar", header: "Dibayar", align: "right", cell: (r) => <span className="tabular-nums text-muted-fg">{formatRupiah(r.dibayar)}</span> },
    {
      key: "sisa",
      header: "Sisa",
      align: "right",
      cell: (r) => {
        const sisa = r.jumlah - r.dibayar;
        return <span className={`tabular-nums font-medium ${sisa > 0 ? "text-amber-700" : "text-emerald-600"}`}>{formatRupiah(sisa)}</span>;
      },
    },
    { key: "status", header: "Status", cell: (r) => <Badge tone={TONE_TAGIHAN[r.status]} dot>{r.status}</Badge> },
    {
      key: "aksi",
      header: "",
      align: "right",
      cell: (r) => (
        <Button variant="ghost" onClick={() => setDetailId(r.id)}>Detail</Button>
      ),
    },
  ];

  // Persist a new invoice and submit it so it posts to the GL, then refresh.
  const handleSave = async () => {
    setBusy(true);
    setErr(null);
    try {
      const doc = await create.mutateAsync({
        posting_date: postingDate,
        ...(dueDate ? { due_date: dueDate } : {}),
        company,
        student,
        ...(studentName ? { student_name: studentName } : {}),
        ...(formKelas ? { kelas: formKelas } : {}),
        judul,
        ...(formTahunAjaran ? { tahun_ajaran: formTahunAjaran } : {}),
        jumlah: Number(jumlah) || 0,
        dibayar: Number(dibayar) || 0,
        receivable_account: receivableAccount,
        income_account: incomeAccount,
      } as Record<string, unknown>);
      await submitDoc(FEE_INVOICE_DOCTYPE, doc.name);
      setOpen(false);
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  const canSave = !busy && Boolean(student && judul && jumlah && receivableAccount && incomeAccount);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Tagihan Siswa"
        description="Terbitkan dan pantau SPP serta biaya siswa."
        actions={
          <Button onClick={() => setOpen(true)}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Buat Tagihan
          </Button>
        }
      />

      <KeuanganPageGuide storageId="tagihan" steps={GUIDE_STEPS} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lunas" value={counts.Lunas ?? 0} accent="emerald" icon={<IconCheck />} />
        <StatCard label="Tertunda" value={counts.Tertunda ?? 0} accent="amber" icon={<IconClock />} />
        <StatCard label="Jatuh Tempo" value={counts["Jatuh Tempo"] ?? 0} accent="rose" icon={<IconAlert />} />
        <StatCard label="Cicilan" value={counts.Cicilan ?? 0} accent="brand" icon={<IconWallet />} />
      </div>

      <SectionCard title="Distribusi Status" description="Komposisi tagihan terfilter">
        <DistributionBar segments={distribution} showLegend />
      </SectionCard>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari siswa, judul, atau ID tagihan..." }}
        filters={filters}
      />

      <SectionCard title={isLoading ? "Memuat tagihan…" : `${filtered.length} tagihan`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Buat Tagihan">
        <FormGrid cols={2}>
          <FormField label="Tanggal" required>
            <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
          </FormField>
          <FormField label="Jatuh Tempo">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FormField>
          <FormField label="Siswa" required>
            <Input value={student} onChange={(e) => setStudent(e.target.value)} placeholder="ID Siswa" />
          </FormField>
          <FormField label="Nama Siswa">
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </FormField>
          <FormField label="Kelas">
            <Select value={formKelas} onChange={(e) => setFormKelas(e.target.value)}>
              <option value="">—</option>
              {FILTER_OPTIONS.kelas.filter((k) => k !== "Semua").map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tahun Ajaran">
            <Select value={formTahunAjaran} onChange={(e) => setFormTahunAjaran(e.target.value)}>
              <option value="">—</option>
              {FILTER_OPTIONS.tahunAjaran.filter((t) => t !== "Semua").map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Judul" required className="sm:col-span-2">
            <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. SPP Bulanan" />
          </FormField>
          <FormField label="Jumlah" required>
            <Input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Dibayar">
            <Input type="number" value={dibayar} onChange={(e) => setDibayar(e.target.value)} placeholder="0" />
          </FormField>
          <FormField label="Receivable Account" required>
            <Input value={receivableAccount} onChange={(e) => setReceivableAccount(e.target.value)} placeholder="mis. Piutang Usaha" />
          </FormField>
          <FormField label="Income Account" required>
            <Input value={incomeAccount} onChange={(e) => setIncomeAccount(e.target.value)} placeholder="mis. Pendapatan SPP" />
          </FormField>
        </FormGrid>
        {err && <p className="pt-3 text-xs text-rose-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
          <Button onClick={handleSave} disabled={!canSave}>{busy ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </Modal>

      <Modal open={!!detailId} onClose={() => setDetailId(undefined)} title="Detail Tagihan">
        {detail.isLoading ? (
          <p className="text-sm text-muted-fg">Memuat…</p>
        ) : doc ? (
          <div className="space-y-4">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoField label="Nama Siswa" value={fieldText("student_name")} />
              <InfoField
                label="Status"
                value={<Badge tone={docBadge.tone} dot>{fieldText("status")}</Badge>}
              />
              <InfoField label="Judul" value={fieldText("judul")} className="sm:col-span-2" />
              <InfoField label="Jumlah" value={formatRupiah(Number(doc.jumlah) || 0)} />
              <InfoField label="Dibayar" value={formatRupiah(Number(doc.dibayar) || 0)} />
              <InfoField label="Tanggal" value={formatTanggal(fieldText("posting_date"))} />
              <InfoField label="Jatuh Tempo" value={formatTanggal(fieldText("due_date"))} />
            </div>
            <div className="flex gap-2 pt-2">
              {docstatus === 0 ? (
                <Button onClick={() => act(submitDoc)} disabled={busy2}>
                  {busy2 ? "Memproses…" : "Submit"}
                </Button>
              ) : null}
              {docstatus === 1 ? (
                <Button variant="destructive" onClick={() => act(cancelDoc)} disabled={busy2}>
                  {busy2 ? "Memproses…" : "Batalkan"}
                </Button>
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

export const Route = createFileRoute("/sch/$sekolah/keuangan/tagihan")({ component: TagihanPage });
