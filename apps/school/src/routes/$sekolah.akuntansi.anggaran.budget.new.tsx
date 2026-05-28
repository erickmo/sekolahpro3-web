import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Alert,
  Button,
  FormField,
  FormGrid,
  Input,
  PageHeader,
  SectionCard,
  Select,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  formatRupiah,
  MONTH12,
  submitDoc,
  type Budget,
  type BudgetAccount,
  type Month12,
  type OverspendAction,
} from "../data/akuntansi";
import { useActiveCompany } from "../lib/akuntansi-scope";

interface RowDraft {
  account: string;
  overspend_action: OverspendAction;
  amounts: Record<Month12, number>;
}

function emptyRow(): RowDraft {
  return {
    account: "",
    overspend_action: "Warn",
    amounts: MONTH12.reduce((acc, m) => { acc[m] = 0; return acc; }, {} as Record<Month12, number>),
  };
}

function BudgetNewPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const navigate = useNavigate();

  const [fiscalYear, setFiscalYear] = useState("");
  const company = useActiveCompany();
  const [costCenter, setCostCenter] = useState("");
  const [rows, setRows] = useState<RowDraft[]>([emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<Budget>(DOCTYPE.BUDGET);

  const totals = useMemo(() => {
    const t: Record<Month12, number> = MONTH12.reduce((acc, m) => { acc[m] = 0; return acc; }, {} as Record<Month12, number>);
    rows.forEach((r) => MONTH12.forEach((m) => { t[m] += r.amounts[m] || 0; }));
    const grand = MONTH12.reduce((acc, m) => acc + t[m], 0);
    return { perMonth: t, grand };
  }, [rows]);

  const canSave = fiscalYear && company && rows.length > 0 && rows.every((r) => r.account);

  const updateRow = (i: number, patch: Partial<RowDraft>) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const updateAmount = (i: number, m: Month12, v: number) => setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, amounts: { ...r.amounts, [m]: v } } : r));

  const handleSave = async (submit: boolean) => {
    setBusy(true); setErr(null);
    try {
      const accounts: Partial<BudgetAccount>[] = rows.map((r) => ({
        account: r.account,
        overspend_action: r.overspend_action,
        jan: r.amounts.Jan, feb: r.amounts.Feb, mar: r.amounts.Mar, apr: r.amounts.Apr,
        may: r.amounts.May, jun: r.amounts.Jun, jul: r.amounts.Jul, aug: r.amounts.Aug,
        sep: r.amounts.Sep, oct: r.amounts.Oct, nov: r.amounts.Nov, dec: r.amounts.Dec,
      }));
      const doc = await create.mutateAsync({
        fiscal_year: fiscalYear,
        company,
        cost_center: costCenter || undefined,
        accounts,
      } as Record<string, unknown>);
      if (submit) await submitDoc(DOCTYPE.BUDGET, doc.name);
      navigate({ to: "/$sekolah/akuntansi/anggaran/budget/$name", params: { sekolah, name: doc.name } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan budget.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Budget Baru" description="Buat alokasi anggaran per akun per bulan." />
      {err && <Alert tone="danger" title="Error">{err}</Alert>}

      <SectionCard title="Header">
        <FormGrid cols={3}>
          <FormField label="Fiscal Year" required>
            <Input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} placeholder="2026" />
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={company} disabled />
          </FormField>
          <FormField label="Cost Center">
            <Input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard
        title="Alokasi per Akun"
        action={<Button variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, emptyRow()])}>+ Akun</Button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-fg">
              <tr>
                <th className="text-left py-2 pr-2">Account</th>
                <th className="text-left py-2 pr-2">Overspend</th>
                {MONTH12.map((m) => <th key={m} className="text-right py-2 pr-2 w-[90px]">{m}</th>)}
                <th className="text-right py-2 pr-2">Total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rowTotal = MONTH12.reduce((acc, m) => acc + (r.amounts[m] || 0), 0);
                return (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1 pr-2"><Input value={r.account} onChange={(e) => updateRow(i, { account: e.target.value })} placeholder="Account" /></td>
                    <td className="py-1 pr-2">
                      <Select value={r.overspend_action} onChange={(e) => updateRow(i, { overspend_action: e.target.value as OverspendAction })}>
                        <option value="None">None</option>
                        <option value="Warn">Warn</option>
                        <option value="Stop">Stop</option>
                      </Select>
                    </td>
                    {MONTH12.map((m) => (
                      <td key={m} className="py-1 pr-2"><Input type="number" value={r.amounts[m] || ""} onChange={(e) => updateAmount(i, m, Number(e.target.value) || 0)} className="text-right" /></td>
                    ))}
                    <td className="py-1 pr-2 text-right font-medium">{formatRupiah(rowTotal)}</td>
                    <td className="py-1"><Button variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))} disabled={rows.length <= 1}>×</Button></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium">
                <td colSpan={2} className="py-2 pr-2 text-right">Total</td>
                {MONTH12.map((m) => <td key={m} className="py-2 pr-2 text-right">{formatRupiah(totals.perMonth[m])}</td>)}
                <td className="py-2 pr-2 text-right">{formatRupiah(totals.grand)}</td>
                <td></td>
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

export const Route = createFileRoute("/$sekolah/akuntansi/anggaran/budget/new")({
  component: BudgetNewPage,
});
