import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";
import { DOCTYPE, type VernonAccountingSettings } from "../data/akuntansi";

// Single doctype — name field is the same as doctype.
const SINGLE_NAME = DOCTYPE.VERNON_ACCOUNTING_SETTINGS;

function SettingsPage() {
  const q = useResourceDoc<VernonAccountingSettings>(DOCTYPE.VERNON_ACCOUNTING_SETTINGS, SINGLE_NAME);
  const update = useResourceUpdate<VernonAccountingSettings>(DOCTYPE.VERNON_ACCOUNTING_SETTINGS);
  const [form, setForm] = useState<Partial<VernonAccountingSettings>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  const handleSave = async () => {
    setBusy(true); setMsg(null);
    try {
      await update.mutateAsync({ name: SINGLE_NAME, patch: form as Record<string, unknown> });
      await q.refetch();
      setMsg({ tone: "success", text: "Pengaturan tersimpan." });
    } catch (e) {
      setMsg({ tone: "danger", text: e instanceof Error ? e.message : "Gagal menyimpan." });
    } finally { setBusy(false); }
  };

  if (q.isLoading) return <div className="p-8 text-center text-sm text-muted-fg">Memuat…</div>;
  if (q.error) return <Alert tone="danger" title="Gagal memuat">{(q.error as Error).message}</Alert>;

  return (
    <div className="space-y-4">
      <PageHeader title="Pengaturan Modul Akuntansi" description="Vernon Accounting Settings — NPWP, NSFP, tarif default, akun output." />
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <SectionCard title="Identitas Perusahaan">
        <FormGrid cols={2}>
          <FormField label="Default Company">
            <Input value={form.default_company ?? ""} onChange={(e) => setForm({ ...form, default_company: e.target.value })} />
          </FormField>
          <FormField label="Default Currency">
            <Input value={form.default_currency ?? ""} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} placeholder="IDR" />
          </FormField>
          <FormField label="Company NPWP">
            <Input value={form.company_npwp ?? ""} onChange={(e) => setForm({ ...form, company_npwp: e.target.value })} placeholder="00.000.000.0-000.000" />
          </FormField>
          <FormField label="PPN Output Account">
            <Input value={form.ppn_output_account ?? ""} onChange={(e) => setForm({ ...form, ppn_output_account: e.target.value })} />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="Tarif Pajak Default (%)">
        <FormGrid cols={3}>
          <FormField label="PPN">
            <Input type="number" step="0.01" value={form.ppn_rate ?? ""} onChange={(e) => setForm({ ...form, ppn_rate: Number(e.target.value) || 0 })} />
          </FormField>
          <FormField label="PPh 22 Impor">
            <Input type="number" step="0.01" value={form.pph22_rate_impor ?? ""} onChange={(e) => setForm({ ...form, pph22_rate_impor: Number(e.target.value) || 0 })} />
          </FormField>
          <FormField label="PPh 22 Bendahara">
            <Input type="number" step="0.01" value={form.pph22_rate_bendahara ?? ""} onChange={(e) => setForm({ ...form, pph22_rate_bendahara: Number(e.target.value) || 0 })} />
          </FormField>
          <FormField label="PPh 23 Jasa">
            <Input type="number" step="0.01" value={form.pph23_rate_jasa ?? ""} onChange={(e) => setForm({ ...form, pph23_rate_jasa: Number(e.target.value) || 0 })} />
          </FormField>
          <FormField label="PPh 23 Dividen">
            <Input type="number" step="0.01" value={form.pph23_rate_dividen ?? ""} onChange={(e) => setForm({ ...form, pph23_rate_dividen: Number(e.target.value) || 0 })} />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="NSFP (Nomor Seri Faktur Pajak)">
        <FormGrid cols={3}>
          <FormField label="Prefix">
            <Input value={form.nsfp_prefix ?? ""} onChange={(e) => setForm({ ...form, nsfp_prefix: e.target.value })} />
          </FormField>
          <FormField label="Year">
            <Input value={form.nsfp_year ?? ""} onChange={(e) => setForm({ ...form, nsfp_year: e.target.value })} placeholder="2026" />
          </FormField>
          <FormField label="Counter">
            <Input type="number" value={form.nsfp_counter ?? 0} onChange={(e) => setForm({ ...form, nsfp_counter: Number(e.target.value) || 0 })} />
          </FormField>
        </FormGrid>
      </SectionCard>

      <SectionCard title="Budget">
        <FormField label="Default Overspend Action">
          <Select value={form.budget_overspend_action ?? "Warn"} onChange={(e) => setForm({ ...form, budget_overspend_action: e.target.value as "Warn" | "Stop" })}>
            <option value="Warn">Warn</option>
            <option value="Stop">Stop</option>
          </Select>
        </FormField>
      </SectionCard>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={busy}>{busy ? "Menyimpan…" : "Simpan Pengaturan"}</Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/akuntansi/referensi/settings")({ component: SettingsPage });
