/**
 * AkademikPanel — the "Akademik" configuration tab of the Pengaturan page.
 *
 * Pure view extracted verbatim from the old god-file route (AkademikTab plus its
 * TahunModal/SkalaModal/JamModal). Renders three read-only SectionCards (Tahun
 * Ajaran Aktif, Skala Penilaian, Jam Operasional) with per-section edit modals.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { useState } from "react";
import {
  Badge,
  Button,
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
import type { JamOperasional, Skala, TahunAjaran } from "../../data/pengaturan";
import { EditButton, ModalFooter, SavedFlash } from "./pengaturanShared";

/** Selectable semester options for the Tahun modal. */
const SEMESTER_OPTIONS = ["Ganjil", "Genap"] as const;
/** Selectable report-card system options for the Skala modal. */
const SISTEM_RAPOR_OPTIONS = ["Kurikulum Merdeka", "Kurikulum 2013", "KTSP"] as const;

/** Build SearchableSelect option objects from a list of plain string values. */
function toOptions(values: readonly string[]): { value: string; label: string }[] {
  return values.map((o) => ({ value: o, label: o }));
}

/**
 * Modal for switching/editing the active academic year window.
 *
 * @param open whether the modal is visible.
 * @param onClose handler to dismiss the modal.
 * @param value the current academic year to seed the draft.
 * @param onSave handler receiving the edited academic year draft.
 * @returns the tahun-ajaran edit modal.
 */
function TahunModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: TahunAjaran; onSave: (v: TahunAjaran) => void }) {
  const [draft, setDraft] = useState<TahunAjaran>(value);
  return (
    <Modal open={open} onClose={onClose} title="Ganti Tahun Ajaran" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Tahun Ajaran" required><Input value={draft.tahun} onChange={(e) => setDraft({ ...draft, tahun: e.target.value })} placeholder="2026/2027" /></FormField>
        <FormField label="Semester">
          <SearchableSelect value={draft.semester} onChange={(v) => setDraft({ ...draft, semester: v })} options={toOptions(SEMESTER_OPTIONS)} />
        </FormField>
        <FormField label="Mulai"><DatePicker value={draft.mulai} onChange={(v) => setDraft({ ...draft, mulai: v })} /></FormField>
        <FormField label="Selesai"><DatePicker value={draft.selesai} onChange={(v) => setDraft({ ...draft, selesai: v })} /></FormField>
        <FormField label="Hari Aktif"><Input type="number" value={draft.hariAktif} onChange={(e) => setDraft({ ...draft, hariAktif: Number(e.target.value) })} /></FormField>
        <FormField label="Hari Libur"><Input type="number" value={draft.hariLibur} onChange={(e) => setDraft({ ...draft, hariLibur: Number(e.target.value) })} /></FormField>
      </FormGrid>
    </Modal>
  );
}

/**
 * Modal for editing the grading scale thresholds + report-card system.
 *
 * @param open whether the modal is visible.
 * @param onClose handler to dismiss the modal.
 * @param value the current skala to seed the draft.
 * @param onSave handler receiving the edited skala draft.
 * @returns the skala edit modal.
 */
function SkalaModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Skala; onSave: (v: Skala) => void }) {
  const [draft, setDraft] = useState<Skala>(value);
  const setNum = (k: keyof Skala, v: string) => setDraft({ ...draft, [k]: Number(v) });
  return (
    <Modal open={open} onClose={onClose} title="Edit Skala Penilaian" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="A (Sangat Baik) - Min" hint="≥ nilai ini"><Input type="number" value={draft.aMin} onChange={(e) => setNum("aMin", e.target.value)} /></FormField>
        <FormField label="B (Baik) - Min"><Input type="number" value={draft.bMin} onChange={(e) => setNum("bMin", e.target.value)} /></FormField>
        <FormField label="C (Cukup) - Min"><Input type="number" value={draft.cMin} onChange={(e) => setNum("cMin", e.target.value)} /></FormField>
        <FormField label="Sistem Rapor">
          <SearchableSelect value={draft.sistemRapor} onChange={(v) => setDraft({ ...draft, sistemRapor: v })} options={toOptions(SISTEM_RAPOR_OPTIONS)} />
        </FormField>
        <FormField label="KKM Pengetahuan"><Input type="number" value={draft.kkmPengetahuan} onChange={(e) => setNum("kkmPengetahuan", e.target.value)} /></FormField>
        <FormField label="KKM Keterampilan"><Input type="number" value={draft.kkmKeterampilan} onChange={(e) => setNum("kkmKeterampilan", e.target.value)} /></FormField>
      </FormGrid>
    </Modal>
  );
}

/**
 * Modal for editing the daily operating hours.
 *
 * @param open whether the modal is visible.
 * @param onClose handler to dismiss the modal.
 * @param value the current jam to seed the draft.
 * @param onSave handler receiving the edited jam draft.
 * @returns the jam-operasional edit modal.
 */
function JamModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: JamOperasional; onSave: (v: JamOperasional) => void }) {
  const [draft, setDraft] = useState<JamOperasional>(value);
  const set = (k: keyof JamOperasional, v: string | number) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title="Edit Jam Operasional" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        <FormField label="Durasi Jam Pelajaran (menit)"><Input type="number" value={draft.durasiJP} onChange={(e) => set("durasiJP", Number(e.target.value))} /></FormField>
        <FormField label="Istirahat"><Input value={draft.istirahat} onChange={(e) => set("istirahat", e.target.value)} /></FormField>
        <FormField label="Mulai (Senin-Kamis)"><Input type="time" value={draft.mulai} onChange={(e) => set("mulai", e.target.value)} /></FormField>
        <FormField label="Selesai (Senin-Kamis)"><Input type="time" value={draft.selesai} onChange={(e) => set("selesai", e.target.value)} /></FormField>
        <FormField label="Jumat"><Input value={draft.jumat} onChange={(e) => set("jumat", e.target.value)} /></FormField>
        <FormField label="Sabtu"><Input value={draft.sabtu} onChange={(e) => set("sabtu", e.target.value)} /></FormField>
      </FormGrid>
    </Modal>
  );
}

/** Props for {@link AkademikPanel}. */
export interface AkademikPanelProps {
  /** Current active academic year. */
  tahun: TahunAjaran;
  /** Setter for the active academic year. */
  setTahun: (v: TahunAjaran) => void;
  /** Current grading scale. */
  skala: Skala;
  /** Setter for the grading scale. */
  setSkala: (v: Skala) => void;
  /** Current daily operating hours. */
  jam: JamOperasional;
  /** Setter for the daily operating hours. */
  setJam: (v: JamOperasional) => void;
  /** Trigger a save-flash for the given section key. */
  flash: (k: string) => void;
  /** The section key currently showing its save-flash, if any. */
  flashKey: string | null;
}

/**
 * The "Akademik" tab: academic year, grading scale, and operating hours cards.
 *
 * @param props see {@link AkademikPanelProps}.
 * @returns the Akademik configuration panel.
 */
export function AkademikPanel({
  tahun, setTahun, skala, setSkala, jam, setJam, flash, flashKey,
}: AkademikPanelProps) {
  const [open, setOpen] = useState<"tahun" | "skala" | "jam" | null>(null);
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Tahun Ajaran Aktif<SavedFlash show={flashKey === "tahun"} /></span>}
        action={<Button variant="outline" size="sm" onClick={() => setOpen("tahun")}>Ganti Tahun Ajaran</Button>}
      >
        <InfoGrid cols={3}>
          <InfoField label="Tahun Ajaran" value={tahun.tahun} />
          <InfoField label="Semester" value={<Badge tone="brand">{tahun.semester}</Badge>} />
          <InfoField label="Mulai" value={tahun.mulai} />
          <InfoField label="Selesai" value={tahun.selesai} />
          <InfoField label="Hari Aktif" value={`${tahun.hariAktif} hari`} />
          <InfoField label="Hari Libur" value={`${tahun.hariLibur} hari`} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Skala Penilaian<SavedFlash show={flashKey === "skala"} /></span>}
        action={<EditButton onClick={() => setOpen("skala")} />}
      >
        <InfoGrid cols={4}>
          <InfoField label="A (Sangat Baik)" value={`≥ ${skala.aMin}`} />
          <InfoField label="B (Baik)" value={`${skala.bMin} - ${skala.aMin - 1}`} />
          <InfoField label="C (Cukup)" value={`${skala.cMin} - ${skala.bMin - 1}`} />
          <InfoField label="D (Kurang)" value={`< ${skala.cMin}`} />
          <InfoField label="KKM Pengetahuan" value={String(skala.kkmPengetahuan)} />
          <InfoField label="KKM Keterampilan" value={String(skala.kkmKeterampilan)} />
          <InfoField label="Skala Sikap" value="A-D Deskriptif" />
          <InfoField label="Sistem Rapor" value={skala.sistemRapor} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Jam Operasional<SavedFlash show={flashKey === "jam"} /></span>}
        action={<EditButton onClick={() => setOpen("jam")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="Jam Pelajaran" value={`${jam.durasiJP} menit`} />
          <InfoField label="Mulai" value={jam.mulai} />
          <InfoField label="Selesai" value={jam.selesai} />
          <InfoField label="Jumat" value={jam.jumat} />
          <InfoField label="Sabtu" value={jam.sabtu} hint="Ekstrakurikuler" />
          <InfoField label="Istirahat" value={jam.istirahat} />
        </InfoGrid>
      </SectionCard>

      <TahunModal open={open === "tahun"} onClose={() => setOpen(null)} value={tahun} onSave={(v) => { setTahun(v); setOpen(null); flash("tahun"); }} />
      <SkalaModal open={open === "skala"} onClose={() => setOpen(null)} value={skala} onSave={(v) => { setSkala(v); setOpen(null); flash("skala"); }} />
      <JamModal open={open === "jam"} onClose={() => setOpen(null)} value={jam} onSave={(v) => { setJam(v); setOpen(null); flash("jam"); }} />
    </div>
  );
}
