/**
 * Small shared UI helpers for the Pengaturan redesign.
 *
 * Extracted verbatim from the old god-file route so every Pengaturan tab/view
 * can reuse the exact same save-flash, edit button, modal footer and toggle
 * cell. Behavior is identical to the original inline definitions.
 *
 * UI strings are Bahasa Indonesia; code comments are English (house rule).
 */
import { useState } from "react";
import { Button, IconCheck, IconEdit } from "@sekolahpro/ui";

/** How long (ms) a save-flash stays visible before auto-clearing. */
const FLASH_DURATION_MS = 1800;

/**
 * Inline "Tersimpan" confirmation shown next to a section title after a save.
 *
 * @param show whether the flash is currently visible.
 * @returns the flash element, or null when hidden.
 */
export function SavedFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
      <span className="h-3 w-3"><IconCheck /></span>Tersimpan
    </span>
  );
}

/**
 * Transient flash-key state for save confirmations.
 *
 * Stores the key of the most recently saved section and clears it after
 * {@link FLASH_DURATION_MS}; only clears if the key has not since changed.
 *
 * @returns a tuple [currentKey, trigger(key)] — call trigger to flash a key.
 */
export function useFlash() {
  const [key, setKey] = useState<string | null>(null);
  const trigger = (k: string) => {
    setKey(k);
    setTimeout(() => setKey((cur) => (cur === k ? null : cur)), FLASH_DURATION_MS);
  };
  return [key, trigger] as const;
}

interface EditButtonProps {
  onClick: () => void;
  label?: string;
}

/**
 * Outline "Edit" button with a leading pencil icon, used as a SectionCard action.
 *
 * @param onClick handler fired when the button is pressed.
 * @param label optional button text (defaults to "Edit").
 * @returns the button element.
 */
export function EditButton({ onClick, label = "Edit" }: EditButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <span className="h-3.5 w-3.5 mr-1"><IconEdit /></span>{label}
    </Button>
  );
}

/**
 * Standard modal footer: a ghost "Batal" and a primary "Simpan".
 *
 * @param onCancel handler for the cancel button.
 * @param onSave handler for the save button.
 * @returns the footer buttons.
 */
export function ModalFooter({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <>
      <Button variant="ghost" onClick={onCancel}>Batal</Button>
      <Button onClick={onSave}>Simpan</Button>
    </>
  );
}

/**
 * A clickable boolean cell: a check icon when true, an em-dash when false.
 *
 * @param value the current boolean value.
 * @param onToggle handler fired when the cell is clicked.
 * @returns the toggle button.
 */
export function CheckCell({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        value
          ? "inline-flex h-5 w-5 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50"
          : "inline-flex h-5 w-5 items-center justify-center rounded text-muted-fg hover:bg-muted"
      }
      aria-label="Toggle"
    >
      {value ? <IconCheck /> : <span>—</span>}
    </button>
  );
}
