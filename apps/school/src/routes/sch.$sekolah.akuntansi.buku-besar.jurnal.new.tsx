/**
 * Jurnal Baru — form pembuatan Journal Entry vernon_accounting.
 *
 * Tambahan presentasi: panduan singkat pengisian dan glossary Cost Center.
 * Logika form, validasi keseimbangan, dan submit handler tidak diubah.
 */
import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Alert,
  Button,
  DatePicker,
  FormField,
  FormGrid,
  GlossaryTooltip,
  Input,
  PageHeader,
  SectionCard,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  isBalanced,
  submitDoc,
  sumCredit,
  sumDebit,
  type JournalEntry,
} from "../data/akuntansi";
import { useActiveCompany } from "../lib/akuntansi-scope";
import { KeuanganPageGuide } from "../components/keuangan";
import { defOf } from "../lib/glossary";

const GUIDE_STEPS = [
  { title: "Isi informasi jurnal", detail: "Tetapkan tanggal posting. Company terisi otomatis dari sekolah aktif." },
  { title: "Tambah baris debit & kredit", detail: "Minimal dua baris. Total debit harus sama dengan total kredit (status 'Seimbang')." },
  { title: "Simpan draft atau submit", detail: "'Simpan Draft' menyimpan tanpa posting; 'Simpan & Submit' langsung mengalir ke buku besar." },
];

const GUIDE_TIPS = ["Jurnal tidak bisa di-submit selama belum seimbang atau ada akun kosong."];

interface RowDraft {
  account: string;
  party_type?: string;
  party?: string;
  cost_center?: string;
  debit: number;
  credit: number;
  user_remark?: string;
}

function emptyRow(): RowDraft {
  return { account: "", debit: 0, credit: 0 };
}

function JurnalNewPage() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [postingDate, setPostingDate] = useState(today);
  const company = useActiveCompany();
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState<RowDraft[]>([emptyRow(), emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<JournalEntry>(DOCTYPE.JOURNAL_ENTRY);

  const totalD = useMemo(() => sumDebit(rows.map((r) => ({ debit: r.debit }))), [rows]);
  const totalC = useMemo(() => sumCredit(rows.map((r) => ({ credit: r.credit }))), [rows]);
  const balanced = isBalanced(rows.map((r) => ({ debit: r.debit, credit: r.credit })));
  const canSave = postingDate && company && rows.length >= 2 && rows.every((r) => r.account) && balanced && totalD > 0;

  const updateRow = (idx: number, patch: Partial<RowDraft>) => {
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (idx: number) => setRows((rs) => rs.filter((_, i) => i !== idx));

  const handleSave = async (submit: boolean) => {
    setBusy(true);
    setErr(null);
    try {
      const accounts: Record<string, unknown>[] = rows.map((r) => {
        const acc: Record<string, unknown> = {
          account: r.account,
          debit: r.debit || 0,
          credit: r.credit || 0,
          debit_in_account_currency: r.debit || 0,
          credit_in_account_currency: r.credit || 0,
        };
        if (r.party_type) acc.party_type = r.party_type;
        if (r.party) acc.party = r.party;
        if (r.cost_center) acc.cost_center = r.cost_center;
        if (r.user_remark) acc.user_remark = r.user_remark;
        return acc;
      });
      const doc = await create.mutateAsync({
        posting_date: postingDate,
        company,
        remarks: remarks || undefined,
        accounts,
      } as Record<string, unknown>);
      if (submit) {
        await submitDoc(DOCTYPE.JOURNAL_ENTRY, doc.name);
      }
      navigate({ to: "/sch/$sekolah/akuntansi/buku-besar/jurnal/$name", params: { sekolah, name: doc.name } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan jurnal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Jurnal Baru"
        description="Buat entri jurnal umum. Debit harus sama dengan kredit sebelum submit."
      />

      {err && <Alert tone="danger" title="Error">{err}</Alert>}

      <KeuanganPageGuide
        storageId="jurnal-new"
        intro="Buat entri jurnal manual dalam tiga langkah. Pastikan debit = kredit sebelum submit."
        steps={GUIDE_STEPS}
        tips={GUIDE_TIPS}
      />

      <SectionCard title="Informasi Jurnal">
        <FormGrid cols={3}>
          <FormField label="Posting Date" required>
            <DatePicker value={postingDate} onChange={setPostingDate} />
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={company} disabled />
          </FormField>
          <FormField label="Tax Template (opsional)">
            <Input placeholder="—" disabled />
          </FormField>
        </FormGrid>
        <FormField label="Remarks" className="mt-3">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
        </FormField>
      </SectionCard>

      <SectionCard
        title="Baris Jurnal"
        description="Minimum 2 baris. Total debit = total kredit."
        action={<Button variant="outline" size="sm" onClick={addRow}>+ Baris</Button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-fg">
              <tr>
                <th className="text-left py-2 pr-2">Account</th>
                <th className="text-left py-2 pr-2">
                  <GlossaryTooltip term="Cost Center" definition={defOf("Cost Center") ?? "Pusat biaya — dimensi untuk mengelompokkan biaya/pendapatan per unit."} />
                </th>
                <th className="text-right py-2 pr-2 w-[140px]">Debit</th>
                <th className="text-right py-2 pr-2 w-[140px]">Kredit</th>
                <th className="text-left py-2 pr-2">Keterangan</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border align-top">
                  <td className="py-2 pr-2"><Input value={r.account} onChange={(e) => updateRow(i, { account: e.target.value })} placeholder="Account name" /></td>
                  <td className="py-2 pr-2"><Input value={r.cost_center ?? ""} onChange={(e) => updateRow(i, { cost_center: e.target.value })} placeholder="—" /></td>
                  <td className="py-2 pr-2"><Input type="number" value={r.debit || ""} onChange={(e) => updateRow(i, { debit: Number(e.target.value) || 0 })} className="text-right" /></td>
                  <td className="py-2 pr-2"><Input type="number" value={r.credit || ""} onChange={(e) => updateRow(i, { credit: Number(e.target.value) || 0 })} className="text-right" /></td>
                  <td className="py-2 pr-2"><Input value={r.user_remark ?? ""} onChange={(e) => updateRow(i, { user_remark: e.target.value })} placeholder="—" /></td>
                  <td className="py-2"><Button variant="ghost" size="sm" onClick={() => removeRow(i)} disabled={rows.length <= 2}>×</Button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td colSpan={2} className="py-2 text-right pr-2">Total</td>
                <td className="py-2 pr-2 text-right">{formatRupiah(totalD)}</td>
                <td className="py-2 pr-2 text-right">{formatRupiah(totalC)}</td>
                <td colSpan={2} className={`py-2 pr-2 text-right text-xs ${balanced ? "text-emerald-600" : "text-rose-600"}`}>
                  {balanced ? "Seimbang" : `Selisih ${formatRupiah(totalD - totalC)}`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => history.back()} disabled={busy}>Batal</Button>
        <Button variant="outline" onClick={() => handleSave(false)} disabled={!canSave || busy}>Simpan Draft</Button>
        <Button onClick={() => handleSave(true)} disabled={!canSave || busy}>{busy ? "Memproses…" : "Simpan & Submit"}</Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/buku-besar/jurnal/new")({
  component: JurnalNewPage,
});
