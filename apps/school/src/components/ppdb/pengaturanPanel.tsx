/**
 * Pengaturan PPDB — settings panel (colocated child of the pengaturan route).
 *
 * Reorganizes the global PPDB configuration into three clearly titled sections
 * (Formulir, Biaya, Alur) plus a first-run OnboardingChecklist whose done/undone
 * state is derived purely from the current draft. Kept out of the route file so
 * the route stays under the size budget; ONLY the pengaturan route imports this.
 */
import type { ReactNode } from "react";
import {
  SearchableSelect,
  SectionCard,
  OnboardingChecklist,
  type OnboardingStep,
} from "@sekolahpro/ui";

/** Shape of the singleton Pengaturan PPDB document this panel edits. */
export type PengaturanDoc = {
  name: string;
  min_bayar_persen?: number;
  full_bayar_untuk?: string;
  wajib_seleksi_default?: number;
  wajib_daftar_ulang?: number;
  payment_gateway_provider?: string;
  payment_gateway_is_sandbox?: number;
  payment_gateway_api_key?: string;
  payment_gateway_secret?: string;
  format_no_pendaftaran?: string;
};

/** Props for the settings panel; persistence stays in the route via callbacks. */
export interface PengaturanPanelProps {
  draft: Partial<PengaturanDoc>;
  set: <K extends keyof PengaturanDoc>(key: K, value: PengaturanDoc[K]) => void;
  renderLink: (href: string, children: ReactNode) => ReactNode;
}

/** Active flag value for a Frappe checkbox field. */
const CHECKBOX_ON = 1;
/** Inactive flag value for a Frappe checkbox field. */
const CHECKBOX_OFF = 0;
/** Minimum percent allowed for the "minimum bayar" field. */
const MIN_PERCENT = 0;
/** Maximum percent allowed for the "minimum bayar" field. */
const MAX_PERCENT = 100;
/** Route to the pembayaran page used by onboarding + helper notes. */
const PEMBAYARAN_HREF = "/sch/$sekolah/ppdb/pembayaran";

/** Supported payment gateway providers. */
const GATEWAY_OPTIONS = [
  { value: "Midtrans", label: "Midtrans" },
  { value: "Xendit", label: "Xendit" },
] as const;

/** Shared input styling (mirrors the prior settings form). */
const INPUT_CLS =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

/**
 * Derive the first-run setup checklist from the current draft. A step is "done"
 * once its backing setting has a meaningful value, so the checklist doubles as
 * a live completeness indicator (it auto-hides at 100% via OnboardingChecklist).
 */
export function buildSetupSteps(draft: Partial<PengaturanDoc>): OnboardingStep[] {
  return [
    {
      id: "format",
      label: "Tentukan format nomor pendaftaran",
      description: "Pola penomoran otomatis, mis. PPDB-.YYYY.-.####.",
      done: !!draft.format_no_pendaftaran,
    },
    {
      id: "min-bayar",
      label: "Atur minimum pembayaran",
      description: "Persen minimal yang wajib dibayar sebelum diajukan.",
      done: typeof draft.min_bayar_persen === "number",
    },
    {
      id: "gateway",
      label: "Hubungkan payment gateway",
      description: "Pilih Midtrans atau Xendit untuk pembayaran online.",
      href: PEMBAYARAN_HREF,
      done: !!draft.payment_gateway_provider,
    },
    {
      id: "alur",
      label: "Aktifkan alur seleksi & daftar ulang",
      description: "Pastikan tahapan workflow sesuai kebijakan sekolah.",
      done: !!draft.wajib_seleksi_default || !!draft.wajib_daftar_ulang,
    },
  ];
}

/** A labelled form field wrapper with optional hint text. */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-fg">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-fg">{hint}</span> : null}
    </label>
  );
}

/** A bordered checkbox toggle row. */
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}): ReactNode {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm hover:border-brand">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

/** Section: formulir pendaftaran (penomoran otomatis). */
function FormulirSection({ draft, set }: PengaturanPanelProps): ReactNode {
  return (
    <SectionCard
      title="Formulir Pendaftaran"
      description="Penomoran otomatis & identitas formulir pendaftaran."
    >
      <Field
        label="Format No. Pendaftaran"
        hint="Pola naming Pendaftaran PPDB (mis. PPDB-.YYYY.-.####.)"
      >
        <input
          value={draft.format_no_pendaftaran ?? ""}
          onChange={(e) => set("format_no_pendaftaran", e.target.value)}
          className={INPUT_CLS}
        />
      </Field>
    </SectionCard>
  );
}

/** Section: biaya & pembayaran (minimum bayar + gateway). */
function BiayaSection({ draft, set }: PengaturanPanelProps): ReactNode {
  return (
    <SectionCard
      title="Biaya & Pembayaran"
      description="Kebijakan minimum bayar dan konfigurasi payment gateway."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Minimum Bayar (%)" hint="Persen pembayaran wajib sebelum bisa diajukan.">
          <input
            type="number"
            min={MIN_PERCENT}
            max={MAX_PERCENT}
            value={draft.min_bayar_persen ?? ""}
            onChange={(e) =>
              set("min_bayar_persen", e.target.value ? Number(e.target.value) : undefined)
            }
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Wajib Lunas Saat" hint="Tahapan dimana lunas dipaksakan (mis. Diterima).">
          <input
            value={draft.full_bayar_untuk ?? ""}
            onChange={(e) => set("full_bayar_untuk", e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Provider">
          <SearchableSelect
            value={draft.payment_gateway_provider ?? ""}
            onChange={(v) => set("payment_gateway_provider", v)}
            options={[...GATEWAY_OPTIONS]}
            placeholder="— pilih —"
            className={INPUT_CLS}
          />
        </Field>
        <Toggle
          label="Mode Sandbox"
          checked={!!draft.payment_gateway_is_sandbox}
          onChange={(v) => set("payment_gateway_is_sandbox", v ? CHECKBOX_ON : CHECKBOX_OFF)}
        />
        <Field label="API Key">
          <input
            value={draft.payment_gateway_api_key ?? ""}
            onChange={(e) => set("payment_gateway_api_key", e.target.value)}
            className={INPUT_CLS}
            autoComplete="off"
          />
        </Field>
        <Field label="API Secret">
          <input
            type="password"
            value={draft.payment_gateway_secret ?? ""}
            onChange={(e) => set("payment_gateway_secret", e.target.value)}
            className={INPUT_CLS}
            autoComplete="new-password"
          />
        </Field>
      </div>
    </SectionCard>
  );
}

/** Section: alur & seleksi (workflow toggles). */
function AlurSection({ draft, set }: PengaturanPanelProps): ReactNode {
  return (
    <SectionCard
      title="Alur & Seleksi"
      description="Default tahapan workflow yang dijalankan tiap pendaftaran."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <Toggle
          label="Wajib Seleksi (default)"
          checked={!!draft.wajib_seleksi_default}
          onChange={(v) => set("wajib_seleksi_default", v ? CHECKBOX_ON : CHECKBOX_OFF)}
        />
        <Toggle
          label="Wajib Daftar Ulang"
          checked={!!draft.wajib_daftar_ulang}
          onChange={(v) => set("wajib_daftar_ulang", v ? CHECKBOX_ON : CHECKBOX_OFF)}
        />
      </div>
    </SectionCard>
  );
}

/**
 * The full pengaturan panel: onboarding checklist on top, then the three
 * settings sections. Receives draft + setter from the route so persistence
 * (load/save) stays a route concern.
 */
export function PengaturanPanel(props: PengaturanPanelProps): ReactNode {
  const steps = buildSetupSteps(props.draft);
  return (
    <div className="space-y-6">
      <OnboardingChecklist
        title="Langkah setup PPDB"
        steps={steps}
        renderLink={props.renderLink}
      />
      <FormulirSection {...props} />
      <BiayaSection {...props} />
      <AlurSection {...props} />
    </div>
  );
}
