/**
 * Billing (subscription & invoicing) configuration panel.
 *
 * Pure presentational panel extracted from the Pengaturan god-file (BillingTab +
 * PaketModal + TagihanModal), behavior preserved 1:1. Adds a "Pemakaian Paket"
 * header with three ProgressRings (siswa / pegawai / penyimpanan) derived from
 * live usage versus the plan limits.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  DatePicker,
  FormField,
  FormGrid,
  InfoField,
  InfoGrid,
  Input,
  Modal,
  SearchableSelect,
  SectionCard,
} from "@sekolahpro/ui";
import type { Billing, CurrentUsage } from "../../data/pengaturan";
import { planUsage, type UsageGauge } from "../../lib/pengaturanSummary";
import { ProgressRing } from "../viz/charts";
import { EditButton, ModalFooter, SavedFlash } from "./pengaturanShared";

/** Props for {@link BillingPanel} — original BillingTab props plus live usage. */
export interface BillingPanelProps {
  value: Billing;
  setValue: (v: Billing) => void;
  flash: (k: string) => void;
  flashKey: string | null;
  usage: CurrentUsage;
}

/**
 * Change-subscription-plan modal.
 *
 * @param open whether the modal is shown.
 * @param onClose handler to dismiss the modal.
 * @param value the current billing record.
 * @param onSave handler receiving the edited billing record.
 * @returns the modal element.
 */
function PaketModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Billing; onSave: (v: Billing) => void }) {
  const [draft, setDraft] = useState<Billing>(value);
  return (
    <Modal open={open} onClose={onClose} title="Ubah Paket Berlangganan" size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Paket">
          <SearchableSelect
            value={draft.paket}
            onChange={(v) => setDraft({ ...draft, paket: v })}
            options={["SekolahPro Basic", "SekolahPro Plus", "SekolahPro Enterprise"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Siklus">
          <SearchableSelect
            value={draft.siklus}
            onChange={(v) => setDraft({ ...draft, siklus: v })}
            options={["Bulanan", "Tahunan"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="Harga"><Input value={draft.harga} onChange={(e) => setDraft({ ...draft, harga: e.target.value })} /></FormField>
        <FormField label="Penyimpanan"><Input value={draft.penyimpanan} onChange={(e) => setDraft({ ...draft, penyimpanan: e.target.value })} /></FormField>
        <FormField label="Maks Siswa"><Input type="number" value={draft.maksSiswa} onChange={(e) => setDraft({ ...draft, maksSiswa: Number(e.target.value) })} /></FormField>
        <FormField label="Maks Pegawai"><Input type="number" value={draft.maksPegawai} onChange={(e) => setDraft({ ...draft, maksPegawai: Number(e.target.value) })} /></FormField>
        <FormField label="Mulai"><DatePicker value={draft.mulai} onChange={(v) => setDraft({ ...draft, mulai: v })} /></FormField>
        <FormField label="Berakhir"><DatePicker value={draft.berakhir} onChange={(v) => setDraft({ ...draft, berakhir: v })} /></FormField>
        <FormField label="" className="sm:col-span-2">
          <Checkbox checked={draft.autoRenew} onChange={(e) => setDraft({ ...draft, autoRenew: e.target.checked })} label="Auto-renew aktif" />
        </FormField>
      </FormGrid>
    </Modal>
  );
}

/**
 * Edit-invoicing-details modal.
 *
 * @param open whether the modal is shown.
 * @param onClose handler to dismiss the modal.
 * @param value the current billing record.
 * @param onSave handler receiving the edited billing record.
 * @returns the modal element.
 */
function TagihanModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Billing; onSave: (v: Billing) => void }) {
  const [draft, setDraft] = useState<Billing>(value);
  return (
    <Modal open={open} onClose={onClose} title="Edit Tagihan & Pembayaran" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={1}>
        <FormField label="Metode Pembayaran">
          <SearchableSelect
            value={draft.metodePembayaran}
            onChange={(v) => setDraft({ ...draft, metodePembayaran: v })}
            options={["Virtual Account BCA", "Virtual Account Mandiri", "Virtual Account BNI", "Transfer Manual", "Kartu Kredit"].map((o) => ({ value: o, label: o }))}
          />
        </FormField>
        <FormField label="NPWP"><Input value={draft.npwp} onChange={(e) => setDraft({ ...draft, npwp: e.target.value })} /></FormField>
        <FormField label="Email Tagihan"><Input type="email" value={draft.emailTagihan} onChange={(e) => setDraft({ ...draft, emailTagihan: e.target.value })} /></FormField>
      </FormGrid>
    </Modal>
  );
}

/** Format a usage gauge's used/max pair as "used / max suffix". */
function gaugeLabel(g: UsageGauge, suffix: string): string {
  return `${g.used.toLocaleString("id-ID")} / ${g.max.toLocaleString("id-ID")} ${suffix}`.trim();
}

/**
 * Visualization header: a "Pemakaian Paket" card with three ProgressRings for
 * student, staff and storage usage against the plan limits.
 *
 * @param value the billing plan (limits).
 * @param usage the live usage counters.
 * @returns the SectionCard header element.
 */
function PemakaianHeader({ value, usage }: { value: Billing; usage: CurrentUsage }) {
  const u = planUsage(value, usage);
  return (
    <SectionCard title="Pemakaian Paket" description="Pemakaian saat ini terhadap batas paket">
      <div className="grid gap-6 sm:grid-cols-3">
        <ProgressRing value={u.siswa.pct} label={`Siswa · ${gaugeLabel(u.siswa, "")}`} />
        <ProgressRing value={u.pegawai.pct} label={`Pegawai · ${gaugeLabel(u.pegawai, "")}`} tone="violet" />
        <ProgressRing value={u.storage.pct} label={`Penyimpanan · ${gaugeLabel(u.storage, "GB")}`} tone="amber" />
      </div>
    </SectionCard>
  );
}

/**
 * Billing panel: usage-rings header plus read-only plan and invoicing sections,
 * each editable via its modal.
 *
 * @param value the billing record.
 * @param setValue commit an updated billing record.
 * @param flash trigger a save-flash by key.
 * @param flashKey the currently flashing key.
 * @param usage the live usage counters for the gauges.
 * @returns the panel element.
 */
export function BillingPanel({ value, setValue, flash, flashKey, usage }: BillingPanelProps) {
  const [open, setOpen] = useState<"paket" | "tagihan" | null>(null);
  return (
    <div className="space-y-6">
      <PemakaianHeader value={value} usage={usage} />

      <SectionCard
        title={<span>Paket Berlangganan<SavedFlash show={flashKey === "billing-paket"} /></span>}
        action={<Button variant="outline" size="sm" onClick={() => setOpen("paket")}>Ubah Paket</Button>}
      >
        <InfoGrid cols={3}>
          <InfoField label="Paket" value={<Badge tone="brand">{value.paket}</Badge>} />
          <InfoField label="Siklus" value={value.siklus} />
          <InfoField label="Harga" value={value.harga} />
          <InfoField label="Maks Siswa" value={value.maksSiswa.toLocaleString("id-ID")} hint={`Saat ini: ${usage.siswaAktif.toLocaleString("id-ID")}`} />
          <InfoField label="Maks Pegawai" value={String(value.maksPegawai)} hint={`Saat ini: ${usage.pegawaiAktif}`} />
          <InfoField label="Penyimpanan" value={value.penyimpanan} hint={`Saat ini: ${usage.storageGB} GB`} />
          <InfoField label="Mulai" value={value.mulai} />
          <InfoField label="Berakhir" value={value.berakhir} />
          <InfoField label="Auto-renew" value={<Badge tone={value.autoRenew ? "success" : "neutral"}>{value.autoRenew ? "Aktif" : "Nonaktif"}</Badge>} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Tagihan & Pembayaran<SavedFlash show={flashKey === "billing-tagihan"} /></span>}
        action={<EditButton onClick={() => setOpen("tagihan")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="Metode Pembayaran" value={value.metodePembayaran} />
          <InfoField label="NPWP" value={<span className="tabular-nums">{value.npwp}</span>} />
          <InfoField label="Email Tagihan" value={value.emailTagihan} />
        </InfoGrid>
      </SectionCard>

      <PaketModal open={open === "paket"} onClose={() => setOpen(null)} value={value} onSave={(v) => { setValue(v); setOpen(null); flash("billing-paket"); }} />
      <TagihanModal open={open === "tagihan"} onClose={() => setOpen(null)} value={value} onSave={(v) => { setValue(v); setOpen(null); flash("billing-tagihan"); }} />
    </div>
  );
}
