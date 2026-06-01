/**
 * BrandingPanel — the "Branding" configuration tab of the Pengaturan page.
 *
 * Pure view extracted verbatim from the old god-file route (BrandingTab plus its
 * BrandingModal and the inline asset-upload modal). Renders the logo/visual
 * identity card and the colour-palette card, with edit + upload modals.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { useState } from "react";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SectionCard,
} from "@sekolahpro/ui";
import type { Branding } from "../../data/pengaturan";
import { EditButton, ModalFooter, SavedFlash } from "./pengaturanShared";

/** Ordered palette keys rendered as colour swatches / inputs. */
const PALETTE_KEYS = ["brand", "accent", "success", "danger"] as const;

/**
 * Modal for editing the brand colour palette.
 *
 * @param open whether the modal is visible.
 * @param onClose handler to dismiss the modal.
 * @param value the current branding palette to seed the draft.
 * @param onSave handler receiving the edited palette draft.
 * @returns the palette edit modal.
 */
function BrandingModal({ open, onClose, value, onSave }: { open: boolean; onClose: () => void; value: Branding; onSave: (v: Branding) => void }) {
  const [draft, setDraft] = useState<Branding>(value);
  return (
    <Modal open={open} onClose={onClose} title="Edit Palet Warna" footer={<ModalFooter onCancel={onClose} onSave={() => onSave(draft)} />}>
      <FormGrid cols={2}>
        {PALETTE_KEYS.map((k) => (
          <FormField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
            <div className="flex gap-2 items-center">
              <input type="color" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="h-10 w-14 rounded border border-border cursor-pointer" />
              <Input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
            </div>
          </FormField>
        ))}
      </FormGrid>
    </Modal>
  );
}

/** Props for {@link BrandingPanel}. */
export interface BrandingPanelProps {
  /** Current brand colour palette. */
  value: Branding;
  /** Setter for the brand colour palette. */
  setValue: (v: Branding) => void;
  /** Trigger a save-flash for the given section key. */
  flash: (k: string) => void;
  /** The section key currently showing its save-flash, if any. */
  flashKey: string | null;
}

/**
 * The "Branding" tab: logo/visual identity card and colour-palette card.
 *
 * @param props see {@link BrandingPanelProps}.
 * @returns the Branding configuration panel.
 */
export function BrandingPanel({ value, setValue, flash, flashKey }: BrandingPanelProps) {
  const [open, setOpen] = useState<"logo" | "palet" | null>(null);
  return (
    <div className="space-y-6">
      <SectionCard
        title={<span>Logo & Identitas Visual<SavedFlash show={flashKey === "branding-logo"} /></span>}
        action={<Button variant="outline" size="sm" onClick={() => { setOpen("logo"); flash("branding-logo"); }}>Unggah Aset</Button>}
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted-fg mb-2">Logo Utama</div>
            <div className="h-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center text-3xl font-bold text-brand">SMA1</div>
          </div>
          <div>
            <div className="text-xs text-muted-fg mb-2">Logo Mono</div>
            <div className="h-32 rounded-lg border border-border bg-fg flex items-center justify-center text-3xl font-bold text-bg">SMA1</div>
          </div>
          <div>
            <div className="text-xs text-muted-fg mb-2">Favicon</div>
            <div className="h-32 rounded-lg border border-border bg-muted/30 flex items-center justify-center text-xl font-bold text-brand">S</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={<span>Palet Warna<SavedFlash show={flashKey === "branding-palet"} /></span>}
        action={<EditButton onClick={() => setOpen("palet")} />}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          {PALETTE_KEYS.map((k) => (
            <div key={k} className="rounded-lg border border-border p-3 flex items-center gap-3">
              <span className="h-10 w-10 rounded-md" style={{ background: value[k] }} />
              <div>
                <div className="text-sm font-medium capitalize">{k}</div>
                <div className="text-xs text-muted-fg tabular-nums">{value[k]}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <BrandingModal open={open === "palet"} onClose={() => setOpen(null)} value={value} onSave={(v) => { setValue(v); setOpen(null); flash("branding-palet"); }} />

      {open === "logo" && (
        <Modal open onClose={() => setOpen(null)} title="Unggah Aset" footer={<Button onClick={() => setOpen(null)}>Tutup</Button>}>
          <FormGrid cols={1}>
            <FormField label="Logo Utama (PNG/SVG, maks 1MB)"><Input type="file" accept=".png,.svg" /></FormField>
            <FormField label="Logo Mono"><Input type="file" accept=".png,.svg" /></FormField>
            <FormField label="Favicon (ICO/PNG 32x32)"><Input type="file" accept=".ico,.png" /></FormField>
          </FormGrid>
        </Modal>
      )}
    </div>
  );
}
