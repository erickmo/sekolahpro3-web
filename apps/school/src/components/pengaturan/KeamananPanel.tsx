/**
 * Keamanan (security policy) configuration panel.
 *
 * Pure presentational panel extracted from the Pengaturan god-file (KeamananTab
 * + KeamananModal), behavior preserved 1:1. Adds a "Skor Keamanan" header: a
 * GaugeChart of the computed posture score plus the per-factor checklist.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { useState } from "react";
import {
  Badge,
  FormField,
  FormGrid,
  InfoField,
  InfoGrid,
  Input,
  Modal,
  SearchableSelect,
  SectionCard,
  IconAlert,
  IconCheck,
} from "@sekolahpro/ui";
import type { Keamanan } from "../../data/pengaturan";
import { securityScore, type SecurityFactor } from "../../lib/pengaturanSummary";
import { GaugeChart } from "../viz/finance-charts";
import { EditButton, ModalFooter, SavedFlash } from "./pengaturanShared";

/** Which security sub-section a modal edits. */
type KeamananSection = "password" | "auth" | "audit";

/** Score threshold (inclusive) below which the gauge turns rose. */
const SCORE_WARN = 50;
/** Score threshold (inclusive) below which the gauge turns amber. */
const SCORE_OK = 75;

/** Props for {@link KeamananPanel} — identical to the original KeamananTab. */
export interface KeamananPanelProps {
  value: Keamanan;
  setValue: (v: Keamanan) => void;
  flash: (k: string) => void;
  flashKey: string | null;
}

const SECTION_TITLE: Record<KeamananSection, string> = {
  password: "Edit Kebijakan Password",
  auth: "Edit Autentikasi",
  audit: "Edit Audit & Retensi",
};

/**
 * Section-aware edit modal for the security policy (password / auth / audit).
 *
 * @param open whether the modal is shown.
 * @param onClose handler to dismiss the modal.
 * @param value the current security configuration.
 * @param onSave handler receiving the edited configuration.
 * @param section which sub-section's fields to render.
 * @returns the modal element.
 */
function KeamananModal({ open, onClose, value, onSave, section }: { open: boolean; onClose: () => void; value: Keamanan; onSave: (v: Keamanan) => void; section: KeamananSection }) {
  const [draft, setDraft] = useState<Keamanan>(value);
  const setNum = (k: keyof Keamanan, v: string) => setDraft({ ...draft, [k]: Number(v) });
  const setStr = (k: keyof Keamanan, v: string) => setDraft({ ...draft, [k]: v });
  return (
    <Modal open={open} onClose={onClose} title={SECTION_TITLE[section]} footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        {section === "password" && (
          <>
            <FormField label="Panjang Minimum"><Input type="number" value={draft.panjangMin} onChange={(e) => setNum("panjangMin", e.target.value)} /></FormField>
            <FormField label="Kompleksitas"><Input value={draft.kompleksitas} onChange={(e) => setStr("kompleksitas", e.target.value)} /></FormField>
            <FormField label="Masa Berlaku (hari)"><Input type="number" value={draft.masaBerlaku} onChange={(e) => setNum("masaBerlaku", e.target.value)} /></FormField>
            <FormField label="Riwayat Password"><Input type="number" value={draft.riwayatPassword} onChange={(e) => setNum("riwayatPassword", e.target.value)} /></FormField>
            <FormField label="Login Gagal Maks"><Input type="number" value={draft.loginGagalMaks} onChange={(e) => setNum("loginGagalMaks", e.target.value)} /></FormField>
            <FormField label="Lockout (menit)"><Input type="number" value={draft.lockoutMenit} onChange={(e) => setNum("lockoutMenit", e.target.value)} /></FormField>
          </>
        )}
        {section === "auth" && (
          <>
            <FormField label="2FA Wajib">
              <SearchableSelect
                value={draft.dua2faWajib}
                onChange={(v) => setStr("dua2faWajib", v)}
                options={["Tidak aktif", "Aktif untuk Admin", "Aktif untuk semua"].map((o) => ({ value: o, label: o }))}
              />
            </FormField>
            <FormField label="Metode 2FA"><Input value={draft.metode2fa} onChange={(e) => setStr("metode2fa", e.target.value)} /></FormField>
            <FormField label="Session Timeout (menit)"><Input type="number" value={draft.sessionTimeout} onChange={(e) => setNum("sessionTimeout", e.target.value)} /></FormField>
            <FormField label="Single Sign-On">
              <SearchableSelect
                value={draft.sso}
                onChange={(v) => setStr("sso", v)}
                options={["Tidak aktif", "Google Workspace", "Microsoft 365", "SAML Custom"].map((o) => ({ value: o, label: o }))}
              />
            </FormField>
            <FormField label="Remember Me (hari)"><Input type="number" value={draft.rememberMe} onChange={(e) => setNum("rememberMe", e.target.value)} /></FormField>
            <FormField label="Concurrent Sessions"><Input type="number" value={draft.concurrentSessions} onChange={(e) => setNum("concurrentSessions", e.target.value)} /></FormField>
          </>
        )}
        {section === "audit" && (
          <>
            <FormField label="Audit Log Retensi (hari)"><Input type="number" value={draft.auditRetensi} onChange={(e) => setNum("auditRetensi", e.target.value)} /></FormField>
            <FormField label="Backup Otomatis"><Input value={draft.backupOtomatis} onChange={(e) => setStr("backupOtomatis", e.target.value)} /></FormField>
            <FormField label="Backup Retensi (hari)"><Input type="number" value={draft.backupRetensi} onChange={(e) => setNum("backupRetensi", e.target.value)} /></FormField>
            <FormField label="Data Siswa Lulus"><Input value={draft.dataLulus} onChange={(e) => setStr("dataLulus", e.target.value)} /></FormField>
          </>
        )}
      </FormGrid>
    </Modal>
  );
}

/** Map a 0-100 security score to a gauge tone. */
function scoreTone(score: number): "emerald" | "amber" | "rose" {
  if (score >= SCORE_OK) return "emerald";
  if (score > SCORE_WARN) return "amber";
  return "rose";
}

/**
 * One security factor row: a check or alert icon plus its label.
 *
 * @param factor the scored factor.
 * @returns the list-item element.
 */
function FactorRow({ factor }: { factor: SecurityFactor }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {factor.ok
        ? <span className="h-4 w-4 shrink-0 text-emerald-600"><IconCheck /></span>
        : <span className="h-4 w-4 shrink-0 text-amber-600"><IconAlert /></span>}
      <span className={factor.ok ? "text-fg" : "text-muted-fg"}>{factor.label}</span>
    </li>
  );
}

/**
 * Visualization header: a "Skor Keamanan" card with a GaugeChart of the posture
 * score and the per-factor pass/fail checklist beside it.
 *
 * @param value the security configuration.
 * @returns the SectionCard header element.
 */
function SkorKeamananHeader({ value }: { value: Keamanan }) {
  const result = securityScore(value);
  return (
    <SectionCard title="Skor Keamanan" description={`Grade ${result.grade} · ${result.score}/100`}>
      <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <GaugeChart
          value={result.score}
          label={`Grade ${result.grade}`}
          tone={scoreTone(result.score)}
          ariaLabel={`Skor keamanan ${result.score} dari 100, grade ${result.grade}`}
        />
        <ul className="space-y-2">
          {result.factors.map((f) => <FactorRow key={f.label} factor={f} />)}
        </ul>
      </div>
    </SectionCard>
  );
}

/**
 * Security panel: posture-score header plus three read-only policy sections
 * (password, authentication, audit/retention), each editable via its modal.
 *
 * @param value the security configuration.
 * @param setValue commit an updated configuration.
 * @param flash trigger a save-flash by key.
 * @param flashKey the currently flashing key.
 * @returns the panel element.
 */
export function KeamananPanel({ value, setValue, flash, flashKey }: KeamananPanelProps) {
  const [open, setOpen] = useState<KeamananSection | null>(null);
  return (
    <div className="space-y-6">
      <SkorKeamananHeader value={value} />

      <SectionCard
        title={<span>Kebijakan Password<SavedFlash show={flashKey === "keamanan-password"} /></span>}
        action={<EditButton onClick={() => setOpen("password")} />}
      >
        <InfoGrid cols={2}>
          <InfoField label="Panjang Minimum" value={`${value.panjangMin} karakter`} />
          <InfoField label="Kompleksitas" value={value.kompleksitas} />
          <InfoField label="Masa Berlaku" value={`${value.masaBerlaku} hari`} />
          <InfoField label="Riwayat Password" value={`${value.riwayatPassword} terakhir tidak boleh diulang`} />
          <InfoField label="Login Gagal Maks" value={`${value.loginGagalMaks} kali`} hint="Sebelum akun terkunci" />
          <InfoField label="Lockout Duration" value={`${value.lockoutMenit} menit`} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Autentikasi<SavedFlash show={flashKey === "keamanan-auth"} /></span>}
        action={<EditButton onClick={() => setOpen("auth")} />}
      >
        <InfoGrid cols={3}>
          <InfoField label="2FA Wajib" value={<Badge tone="success">{value.dua2faWajib}</Badge>} />
          <InfoField label="Metode 2FA" value={value.metode2fa} />
          <InfoField label="Session Timeout" value={`${value.sessionTimeout} menit idle`} />
          <InfoField label="Single Sign-On" value={<Badge tone="brand">{value.sso}</Badge>} />
          <InfoField label="Remember Me" value={`${value.rememberMe} hari`} />
          <InfoField label="Concurrent Sessions" value={`${value.concurrentSessions} device`} />
        </InfoGrid>
      </SectionCard>

      <SectionCard
        title={<span>Audit & Retensi<SavedFlash show={flashKey === "keamanan-audit"} /></span>}
        action={<EditButton onClick={() => setOpen("audit")} />}
      >
        <InfoGrid cols={2}>
          <InfoField label="Audit Log Retensi" value={`${value.auditRetensi} hari`} />
          <InfoField label="Backup Otomatis" value={<Badge tone="success">{value.backupOtomatis}</Badge>} />
          <InfoField label="Backup Retensi" value={`${value.backupRetensi} hari`} />
          <InfoField label="Data Siswa Lulus" value={value.dataLulus} />
        </InfoGrid>
      </SectionCard>

      {open && (
        <KeamananModal
          open
          onClose={() => setOpen(null)}
          value={value}
          section={open}
          onSave={(v) => { setValue(v); const s = open; setOpen(null); flash(`keamanan-${s}`); }}
        />
      )}
    </div>
  );
}
