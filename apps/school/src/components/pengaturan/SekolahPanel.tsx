/**
 * SekolahPanel — the "Sekolah" configuration tab of the Pengaturan page.
 *
 * Pure view extracted verbatim from the old god-file route (SekolahTab plus its
 * IdentitasModal/AlamatModal/DomainModal). Renders three read-only SectionCards
 * (Identitas, Alamat & Kontak, Domain & Tenant) with per-section edit modals.
 *
 * The SaaS-only identitas edit gate is preserved, but the caller now passes the
 * `canEditIdentitas` flag as a prop instead of this component calling a hook.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { useState } from "react";
import {
  Badge,
  Button,
  FormField,
  FormGrid,
  InfoField,
  InfoGrid,
  Input,
  Modal,
  SearchableSelect,
  SectionCard,
  Textarea,
} from "@sekolahpro/ui";
import type { Alamat, Domain, Identitas } from "../../data/pengaturan";
import { EditButton, ModalFooter, SavedFlash } from "./pengaturanShared";

/** Selectable jenjang options for the Identitas modal. */
const JENJANG_OPTIONS = ["PAUD", "TK", "SD", "SMP", "SMA", "SMK", "MA"] as const;
/** Selectable status options for the Identitas modal. */
const STATUS_OPTIONS = ["Negeri", "Swasta"] as const;
/** Selectable akreditasi options for the Identitas modal. */
const AKREDITASI_OPTIONS = ["A", "B", "C", "Belum"] as const;
/** Selectable naungan options for the Identitas modal. */
const NAUNGAN_OPTIONS = ["Kemendikbud", "Kemenag", "Yayasan"] as const;
/** Selectable server-region options for the Domain modal. */
const WILAYAH_OPTIONS = ["ID-JKT-1", "ID-JKT-2", "ID-SBY-1", "SG-1"] as const;

/** Build SearchableSelect option objects from a list of plain string values. */
function toOptions(values: readonly string[]): { value: string; label: string }[] {
  return values.map((o) => ({ value: o, label: o }));
}

/**
 * Modal for editing the school identity fields.
 *
 * @param open whether the modal is visible.
 * @param onClose handler to dismiss the modal.
 * @param value the current identitas to seed the draft.
 * @param onSave handler receiving the edited identitas draft.
 * @returns the identitas edit modal.
 */
function IdentitasModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Identitas; onSave: (v: Identitas) => void }) {
  const [draft, setDraft] = useState<Identitas>(value);
  const set = (k: keyof Identitas, v: string) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Identitas Sekolah" size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Nama Sekolah" required><Input value={draft.nama} onChange={(e) => set("nama", e.target.value)} /></FormField>
        <FormField label="NPSN"><Input value={draft.npsn} onChange={(e) => set("npsn", e.target.value)} /></FormField>
        <FormField label="NSS"><Input value={draft.nss} onChange={(e) => set("nss", e.target.value)} /></FormField>
        <FormField label="Jenjang">
          <SearchableSelect value={draft.jenjang} onChange={(v) => set("jenjang", v)} options={toOptions(JENJANG_OPTIONS)} />
        </FormField>
        <FormField label="Status">
          <SearchableSelect value={draft.status} onChange={(v) => set("status", v)} options={toOptions(STATUS_OPTIONS)} />
        </FormField>
        <FormField label="Akreditasi">
          <SearchableSelect value={draft.akreditasi} onChange={(v) => set("akreditasi", v)} options={toOptions(AKREDITASI_OPTIONS)} />
        </FormField>
        <FormField label="Akreditasi Berlaku" className="sm:col-span-2"><Input value={draft.akreditasiBerlaku} onChange={(e) => set("akreditasiBerlaku", e.target.value)} /></FormField>
        <FormField label="Kepala Sekolah" className="sm:col-span-2"><Input value={draft.kepsek} onChange={(e) => set("kepsek", e.target.value)} /></FormField>
        <FormField label="Tahun Berdiri"><Input value={draft.tahunBerdiri} onChange={(e) => set("tahunBerdiri", e.target.value)} /></FormField>
        <FormField label="Naungan">
          <SearchableSelect value={draft.naungan} onChange={(v) => set("naungan", v)} options={toOptions(NAUNGAN_OPTIONS)} />
        </FormField>
      </FormGrid>
    </Modal>
  );
}

/**
 * Modal for editing the school address and contact channels.
 *
 * @param open whether the modal is visible.
 * @param onClose handler to dismiss the modal.
 * @param value the current alamat to seed the draft.
 * @param onSave handler receiving the edited alamat draft.
 * @returns the alamat edit modal.
 */
function AlamatModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Alamat; onSave: (v: Alamat) => void }) {
  const [draft, setDraft] = useState<Alamat>(value);
  const set = (k: keyof Alamat, v: string) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Alamat & Kontak" size="lg" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={3}>
        <FormField label="Alamat" className="sm:col-span-3"><Textarea value={draft.jalan} onChange={(e) => set("jalan", e.target.value)} rows={2} /></FormField>
        <FormField label="Kelurahan"><Input value={draft.kelurahan} onChange={(e) => set("kelurahan", e.target.value)} /></FormField>
        <FormField label="Kecamatan"><Input value={draft.kecamatan} onChange={(e) => set("kecamatan", e.target.value)} /></FormField>
        <FormField label="Kota"><Input value={draft.kota} onChange={(e) => set("kota", e.target.value)} /></FormField>
        <FormField label="Provinsi"><Input value={draft.provinsi} onChange={(e) => set("provinsi", e.target.value)} /></FormField>
        <FormField label="Kode Pos"><Input value={draft.kodePos} onChange={(e) => set("kodePos", e.target.value)} /></FormField>
        <FormField label="Telepon"><Input value={draft.telepon} onChange={(e) => set("telepon", e.target.value)} /></FormField>
        <FormField label="Email"><Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} /></FormField>
        <FormField label="Website" className="sm:col-span-2"><Input value={draft.website} onChange={(e) => set("website", e.target.value)} /></FormField>
      </FormGrid>
    </Modal>
  );
}

/**
 * Modal for editing the tenant subdomain / custom domain.
 *
 * @param open whether the modal is visible.
 * @param onClose handler to dismiss the modal.
 * @param value the current domain to seed the draft.
 * @param onSave handler receiving the edited domain draft.
 * @returns the domain edit modal.
 */
function DomainModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Domain; onSave: (v: Domain) => void }) {
  const [draft, setDraft] = useState<Domain>(value);
  const set = (k: keyof Domain, v: string) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Domain & Tenant" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Subdomain" hint="Bagian sebelum sekolahpro.id"><Input value={draft.subdomain} onChange={(e) => set("subdomain", e.target.value)} /></FormField>
        <FormField label="Domain Custom"><Input value={draft.domainCustom} onChange={(e) => set("domainCustom", e.target.value)} /></FormField>
        <FormField label="Tenant ID" hint="Tidak dapat diubah"><Input value={draft.tenantId} disabled /></FormField>
        <FormField label="Wilayah Server">
          <SearchableSelect value={draft.wilayah} onChange={(v) => set("wilayah", v)} options={toOptions(WILAYAH_OPTIONS)} />
        </FormField>
      </FormGrid>
    </Modal>
  );
}

/** Props for {@link SekolahPanel}. */
export interface SekolahPanelProps {
  /** Current school identity. */
  identitas: Identitas;
  /** Setter for the school identity. */
  setIdentitas: (v: Identitas) => void;
  /** Current address / contact info. */
  alamat: Alamat;
  /** Setter for the address / contact info. */
  setAlamat: (v: Alamat) => void;
  /** Current tenant domain config. */
  domain: Domain;
  /** Setter for the tenant domain config. */
  setDomain: (v: Domain) => void;
  /** Trigger a save-flash for the given section key. */
  flash: (k: string) => void;
  /** The section key currently showing its save-flash, if any. */
  flashKey: string | null;
  /** Whether the current user may edit the identitas (SaaS roles only). */
  canEditIdentitas: boolean;
}

/**
 * The "Sekolah" tab: identitas, alamat & kontak, and domain & tenant cards.
 *
 * Identitas editing is gated on `canEditIdentitas`; when false the action shows
 * a "Hanya SaaS User" hint and the identitas modal can never open.
 *
 * @param props see {@link SekolahPanelProps}.
 * @returns the Sekolah configuration panel.
 */
export function SekolahPanel({
  identitas, setIdentitas, alamat, setAlamat, domain, setDomain, flash, flashKey, canEditIdentitas,
}: SekolahPanelProps) {
  const [open, setOpen] = useState<"identitas" | "alamat" | "domain" | null>(null);
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Identitas Sekolah<SavedFlash show={flashKey === "identitas"} /></span>}
        action={canEditIdentitas ? <EditButton onClick={() => setOpen("identitas")} /> : <span className="text-xs text-muted-fg">Hanya SaaS User</span>}
      >
        <InfoGrid cols={3}>
          <InfoField label="Nama Sekolah" value={identitas.nama} />
          <InfoField label="NPSN" value={<span className="tabular-nums">{identitas.npsn}</span>} />
          <InfoField label="NSS" value={<span className="tabular-nums">{identitas.nss}</span>} />
          <InfoField label="Jenjang" value={identitas.jenjang} />
          <InfoField label="Status" value={<Badge tone="success">{identitas.status}</Badge>} />
          <InfoField label="Akreditasi" value={<Badge tone="brand">{identitas.akreditasi}</Badge>} hint={identitas.akreditasiBerlaku} />
          <InfoField label="Kepala Sekolah" value={identitas.kepsek} />
          <InfoField label="Tahun Berdiri" value={identitas.tahunBerdiri} />
          <InfoField label="Naungan" value={identitas.naungan} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Alamat & Kontak<SavedFlash show={flashKey === "alamat"} /></span>}
        action={<EditButton onClick={() => setOpen("alamat")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="Alamat" value={alamat.jalan} className="sm:col-span-2 lg:col-span-2" />
          <InfoField label="Kelurahan" value={alamat.kelurahan} />
          <InfoField label="Kecamatan" value={alamat.kecamatan} />
          <InfoField label="Kota" value={alamat.kota} />
          <InfoField label="Provinsi" value={alamat.provinsi} />
          <InfoField label="Kode Pos" value={alamat.kodePos} />
          <InfoField label="Telepon" value={alamat.telepon} />
          <InfoField label="Email" value={alamat.email} />
          <InfoField label="Website" value={alamat.website} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Domain & Tenant<SavedFlash show={flashKey === "domain"} /></span>}
        action={<EditButton onClick={() => setOpen("domain")} />}
      >
        <InfoGrid cols={2}>
          <InfoField label="Subdomain" value={domain.subdomain} />
          <InfoField label="Domain Custom" value={domain.domainCustom} hint="Terverifikasi" />
          <InfoField label="Tenant ID" value={<span className="tabular-nums">{domain.tenantId}</span>} />
          <InfoField label="Wilayah Server" value={domain.wilayah} />
        </InfoGrid>
      </SectionCard>

      <IdentitasModal open={canEditIdentitas && open === "identitas"} onClose={() => setOpen(null)} value={identitas} onSave={(v) => { setIdentitas(v); setOpen(null); flash("identitas"); }} />
      <AlamatModal open={open === "alamat"} onClose={() => setOpen(null)} value={alamat} onSave={(v) => { setAlamat(v); setOpen(null); flash("alamat"); }} />
      <DomainModal open={open === "domain"} onClose={() => setOpen(null)} value={domain} onSave={(v) => { setDomain(v); setOpen(null); flash("domain"); }} />
    </div>
  );
}
