/**
 * Operasional › Pembayaran (payment receipts).
 *
 * Kasir record incoming payments. Adds a role guide and a payment-method
 * composition donut over the existing table. Wired to the live
 * `School Fee Payment` doctype via usePembayaranLive (company-scoped), with a
 * "Catat Pembayaran" create modal that submits each receipt to the GL.
 */
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Alert,
  Badge,
  Button,
  type Column,
  DataTable,
  FilterBar,
  FormField,
  Input,
  Modal,
  PageHeader,
  SectionCard,
  Select,
  StatCard,
  type SelectFilter,
  IconPlus,
} from "@sekolahpro/ui";
import { DonutChart, type ChartDatum, type Tone } from "../components/viz";
import { KeuanganPageGuide } from "../components/keuangan";
import {
  FILTER_OPTIONS,
  formatRupiah,
  formatTanggal,
  type PembayaranRow,
  type MetodeBayar,
} from "../data/keuangan";
import { usePembayaranLive } from "../data/keuangan-live";
import { useResourceCreate } from "@sekolahpro/api-client";
import { useActiveCompany } from "../lib/akuntansi-scope";
import { submitDoc } from "../data/akuntansi";

const PAYMENT_DOCTYPE = "School Fee Payment";

const METODE_OPTIONS: readonly MetodeBayar[] = ["Tunai", "Transfer", "QRIS", "Virtual Account", "EDC"];

const METODE_TONE: Record<MetodeBayar, Tone> = {
  Tunai: "emerald",
  Transfer: "brand",
  QRIS: "violet",
  "Virtual Account": "amber",
  EDC: "sky",
};

const GUIDE_STEPS = [
  { title: "Catat pembayaran masuk", detail: "Pilih metode (Tunai/Transfer/QRIS/VA/EDC) dan masukkan jumlah serta referensi.", roles: ["kasir"] },
  { title: "Cocokkan dengan tagihan", detail: "Setiap pembayaran terhubung ke tagihan siswa agar sisa otomatis berkurang.", roles: ["kasir", "bendahara"] },
  { title: "Rekonsiliasi akhir hari", detail: "Total pembayaran tunai harus cocok dengan kas fisik di Buku Kas.", roles: ["bendahara"] },
];

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

function PembayaranPage() {
  const [metode, setMetode] = useState("Semua");
  const [kelas, setKelas] = useState("Semua");
  const [search, setSearch] = useState("");

  const { rows: scoped, isLoading, refetch } = usePembayaranLive();

  // Create modal state.
  const company = useActiveCompany();
  const create = useResourceCreate<{ name: string }>(PAYMENT_DOCTYPE);
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [postingDate, setPostingDate] = useState(today);
  const [student, setStudent] = useState("");
  const [studentName, setStudentName] = useState("");
  const [judul, setJudul] = useState("");
  const [invoice, setInvoice] = useState("");
  const [formMetode, setFormMetode] = useState<MetodeBayar>("Tunai");
  const [jumlah, setJumlah] = useState(0);
  const [ref, setRef] = useState("");
  const [penerima, setPenerima] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [receivableAccount, setReceivableAccount] = useState("");

  const canSave = Boolean(postingDate && company && student && jumlah > 0 && paidTo && receivableAccount);

  const handleSave = async () => {
    setBusy(true); setErr(null);
    try {
      const doc = await create.mutateAsync({
        posting_date: postingDate,
        company,
        student,
        ...(studentName ? { student_name: studentName } : {}),
        ...(judul ? { judul } : {}),
        ...(invoice ? { invoice } : {}),
        metode: formMetode,
        jumlah,
        ...(ref ? { ref } : {}),
        ...(penerima ? { penerima } : {}),
        paid_to: paidTo,
        receivable_account: receivableAccount,
      } as Record<string, unknown>);
      await submitDoc(PAYMENT_DOCTYPE, doc.name); // submit so it posts to the GL
      setOpen(false);
      refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((p) => {
      if (q && !`${p.siswa} ${p.judul} ${p.id} ${p.ref}`.toLowerCase().includes(q)) return false;
      if (metode !== "Semua" && p.metode !== metode) return false;
      if (kelas !== "Semua" && p.kelas !== kelas) return false;
      return true;
    });
  }, [scoped, search, metode, kelas]);

  const sumByMetode = useMemo(() => {
    const c: Record<MetodeBayar, number> = { Tunai: 0, Transfer: 0, QRIS: 0, "Virtual Account": 0, EDC: 0 };
    filtered.forEach((p) => { c[p.metode] += p.jumlah; });
    return c;
  }, [filtered]);

  const donut = useMemo<ChartDatum[]>(
    () =>
      (Object.keys(sumByMetode) as MetodeBayar[])
        .map((m) => ({ label: m, value: sumByMetode[m], tone: METODE_TONE[m] }))
        .filter((d) => d.value > 0),
    [sumByMetode],
  );

  const totalMasuk = useMemo(() => filtered.reduce((s, p) => s + p.jumlah, 0), [filtered]);

  const filters: SelectFilter[] = [
    { key: "metode", label: "Metode", value: metode, options: buildOptions(FILTER_OPTIONS.metode), onChange: setMetode },
    { key: "kelas", label: "Kelas", value: kelas, options: buildOptions(FILTER_OPTIONS.kelas), onChange: setKelas },
  ];

  const cols: Column<PembayaranRow>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="tabular-nums text-muted-fg text-xs">{r.id}</span> },
    { key: "tgl", header: "Tanggal", cell: (r) => <span className="text-sm tabular-nums">{formatTanggal(r.tanggal)}</span> },
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
    { key: "metode", header: "Metode", cell: (r) => <Badge tone="neutral">{r.metode}</Badge> },
    { key: "jml", header: "Jumlah", align: "right", cell: (r) => <span className="tabular-nums font-medium">{formatRupiah(r.jumlah)}</span> },
    { key: "ref", header: "Ref", cell: (r) => <span className="tabular-nums text-xs text-muted-fg">{r.ref}</span> },
    { key: "penerima", header: "Penerima", cell: (r) => <span className="text-sm">{r.penerima}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operasional"
        title="Pembayaran"
        description="Catat dan telusuri penerimaan pembayaran siswa."
        actions={
          <Button onClick={() => setOpen(true)}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Catat Pembayaran
          </Button>
        }
      />

      <KeuanganPageGuide storageId="pembayaran" steps={GUIDE_STEPS} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard label="Total Diterima" value={formatRupiah(totalMasuk)} accent="emerald" />
          <StatCard label="Jumlah Transaksi" value={filtered.length} accent="brand" />
          <StatCard label="Tunai" value={formatRupiah(sumByMetode.Tunai)} accent="emerald" />
          <StatCard label="Non-Tunai" value={formatRupiah(totalMasuk - sumByMetode.Tunai)} accent="violet" />
        </div>
        <SectionCard title="Komposisi Metode" description="Berdasarkan nilai">
          <div className="flex justify-center">
            <DonutChart data={donut} centerTop={<span className="text-sm font-semibold">{donut.length}</span>} centerBottom={<span className="text-[11px] text-muted-fg">metode</span>} />
          </div>
        </SectionCard>
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari siswa, judul, ref, atau ID..." }}
        filters={filters}
      />

      <SectionCard title={isLoading ? "Memuat…" : `${filtered.length} item`} padded={false}>
        <DataTable data={filtered} columns={cols} rowKey={(r) => r.id} />
      </SectionCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Catat Pembayaran" tone="emerald" icon={<IconPlus />}>
        <div className="space-y-3">
          {err && <Alert tone="danger" title="Error">{err}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Tanggal" required>
              <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
            </FormField>
            <FormField label="Company" hint="Auto: company sekolah aktif">
              <Input value={company} disabled />
            </FormField>
            <FormField label="Siswa (ID)" required>
              <Input value={student} onChange={(e) => setStudent(e.target.value)} placeholder="ID siswa" />
            </FormField>
            <FormField label="Nama Siswa">
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </FormField>
            <FormField label="Judul">
              <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="SPP, Daftar Ulang, dll" />
            </FormField>
            <FormField label="Tagihan (Invoice)">
              <Input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="ID tagihan" />
            </FormField>
            <FormField label="Metode" required>
              <Select value={formMetode} onChange={(e) => setFormMetode(e.target.value as MetodeBayar)}>
                {METODE_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </Select>
            </FormField>
            <FormField label="Jumlah (IDR)" required>
              <Input type="number" value={jumlah || ""} onChange={(e) => setJumlah(Number(e.target.value) || 0)} />
            </FormField>
            <FormField label="Referensi">
              <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="No. transaksi / bukti" />
            </FormField>
            <FormField label="Penerima">
              <Input value={penerima} onChange={(e) => setPenerima(e.target.value)} />
            </FormField>
            <FormField label="Akun Kas/Bank (Paid To)" required>
              <Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="Kas / Bank account name" />
            </FormField>
            <FormField label="Akun Piutang (Receivable)" required>
              <Input value={receivableAccount} onChange={(e) => setReceivableAccount(e.target.value)} placeholder="Receivable account" />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Batal</Button>
            <Button onClick={handleSave} disabled={!canSave || busy}>{busy ? "Menyimpan…" : "Simpan"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/pembayaran")({ component: PembayaranPage });
