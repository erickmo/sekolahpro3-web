import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import {
  Alert,
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  PageHeader,
  SectionCard,
  Select,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";
import {
  DOCTYPE,
  PAYMENT_TYPES,
  submitDoc,
  type PaymentEntry,
  type PaymentType,
} from "../data/akuntansi";
import { useActiveCompany } from "../lib/akuntansi-scope";

function PembayaranNewPage() {
  const { sekolah } = useParams({ from: "/$sekolah" });
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  const [postingDate, setPostingDate] = useState(today);
  const [paymentType, setPaymentType] = useState<PaymentType>("Receive");
  const company = useActiveCompany();
  const [partyType, setPartyType] = useState("");
  const [party, setParty] = useState("");
  const [partyName, setPartyName] = useState("");
  const [paidFrom, setPaidFrom] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = useResourceCreate<PaymentEntry>(DOCTYPE.PAYMENT_ENTRY);

  const canSave = postingDate && company && paidAmount > 0 && paidFrom && paidTo;

  const handleSave = async (submit: boolean) => {
    setBusy(true); setErr(null);
    try {
      const doc = await create.mutateAsync({
        posting_date: postingDate,
        payment_type: paymentType,
        company,
        party_type: partyType || undefined,
        party: party || undefined,
        party_name: partyName || undefined,
        paid_from: paidFrom,
        paid_to: paidTo,
        paid_amount: paidAmount,
        received_amount: paidAmount,
        remarks: remarks || undefined,
      } as Record<string, unknown>);
      if (submit) await submitDoc(DOCTYPE.PAYMENT_ENTRY, doc.name);
      navigate({ to: "/$sekolah/akuntansi/buku-besar/pembayaran/$name", params: { sekolah, name: doc.name } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan pembayaran.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Pembayaran Baru" description="Buat entri Payment Entry (Receive / Pay / Internal Transfer)." />

      {err && <Alert tone="danger" title="Error">{err}</Alert>}

      <SectionCard title="Detail Pembayaran">
        <FormGrid cols={3}>
          <FormField label="Posting Date" required>
            <DatePicker value={postingDate} onChange={setPostingDate} />
          </FormField>
          <FormField label="Payment Type" required>
            <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
              {PAYMENT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </Select>
          </FormField>
          <FormField label="Company" hint="Auto: company sekolah aktif">
            <Input value={company} disabled />
          </FormField>
          <FormField label="Party Type">
            <Input value={partyType} onChange={(e) => setPartyType(e.target.value)} placeholder="Customer / Supplier / Employee" />
          </FormField>
          <FormField label="Party">
            <Input value={party} onChange={(e) => setParty(e.target.value)} />
          </FormField>
          <FormField label="Party Name">
            <Input value={partyName} onChange={(e) => setPartyName(e.target.value)} />
          </FormField>
          <FormField label="Paid From (Account)" required>
            <Input value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} placeholder="Kas / Bank account name" />
          </FormField>
          <FormField label="Paid To (Account)" required>
            <Input value={paidTo} onChange={(e) => setPaidTo(e.target.value)} placeholder="Receivable / Payable account" />
          </FormField>
          <FormField label="Amount (IDR)" required>
            <Input type="number" value={paidAmount || ""} onChange={(e) => setPaidAmount(Number(e.target.value) || 0)} />
          </FormField>
        </FormGrid>
        <FormField label="Remarks" className="mt-3">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
        </FormField>
      </SectionCard>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => history.back()} disabled={busy}>Batal</Button>
        <Button variant="outline" onClick={() => handleSave(false)} disabled={!canSave || busy}>Simpan Draft</Button>
        <Button onClick={() => handleSave(true)} disabled={!canSave || busy}>{busy ? "Memproses…" : "Simpan & Submit"}</Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/akuntansi/buku-besar/pembayaran/new")({
  component: PembayaranNewPage,
});
