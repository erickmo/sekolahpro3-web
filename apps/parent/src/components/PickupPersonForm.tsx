import { useState } from "react";
import { Button, Input, IdScanField } from "@sekolahpro/ui";
import type { PickupHubungan, PickupPerson } from "../data/pickup-types";
import { scanIdentitas } from "../lib/ocrApi";
import { mapKtpToPickup } from "../lib/ocrMapping";

export interface PickupPersonFormValues {
  nama: string;
  hubungan: PickupHubungan;
  phone: string;
  pin: string;
  photoUrl: string | null;
}

interface Props {
  initial?: Partial<PickupPerson>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: PickupPersonFormValues) => void;
  onCancel?: () => void;
}

const HUBUNGAN_OPTIONS: PickupHubungan[] = [
  "Wali",
  "Orang Tua",
  "Kakek-Nenek",
  "Driver",
  "Lainnya",
];

const PIN_RE = /^\d{4,6}$/;
const PHONE_RE = /^\+?\d{8,15}$/;

interface Errors {
  nama?: string;
  hubungan?: string;
  phone?: string;
  pin?: string;
}

function validate(v: PickupPersonFormValues): Errors {
  const errs: Errors = {};
  if (!v.nama.trim()) errs.nama = "Nama wajib diisi";
  if (!v.hubungan) errs.hubungan = "Hubungan wajib dipilih";
  if (!v.phone.trim()) errs.phone = "Nomor HP wajib diisi";
  else if (!PHONE_RE.test(v.phone.trim())) errs.phone = "Format nomor HP tidak valid";
  if (!PIN_RE.test(v.pin)) errs.pin = "PIN harus 4-6 digit angka";
  return errs;
}

export function PickupPersonForm({
  initial,
  submitting = false,
  submitLabel = "Simpan",
  onSubmit,
  onCancel,
}: Props) {
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [hubungan, setHubungan] = useState<PickupHubungan>(
    (initial?.hubungan as PickupHubungan) ?? "Wali",
  );
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values: PickupPersonFormValues = {
      nama: nama.trim(),
      hubungan,
      phone: phone.trim(),
      pin,
      photoUrl: initial?.photoUrl ?? null,
    };
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSubmit(values);
  }

  /**
   * Apply OCR-parsed KTP fields to the form.
   *
   * Only `nama` is auto-filled; phone and PIN remain manual for security.
   * Calls the individual state setter directly because PickupPersonForm uses
   * discrete state (not a unified setValues object).
   *
   * @param fields - Parsed OCR field dict from the backend (snake_case keys).
   */
  function handleOcrApply(fields: Record<string, unknown>): void {
    const mapped = mapKtpToPickup(fields);
    // mapped.nama is the only key mapKtpToPickup produces for PickupPerson.
    if (mapped.nama) setNama(mapped.nama);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* OCR auto-fill: scan KTP to pre-populate the person's name. */}
      <IdScanField
        jenis="KTP"
        onScan={(blob, jenis) => scanIdentitas(blob, jenis).then((r) => r.fields)}
        onApply={handleOcrApply}
      />

      <div className="space-y-1.5">
        <label htmlFor="pp-nama" className="text-sm font-medium text-fg">Nama</label>
        <Input
          id="pp-nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          aria-invalid={!!errors.nama}
        />
        {errors.nama ? <p className="text-xs text-danger">{errors.nama}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pp-hubungan" className="text-sm font-medium text-fg">Hubungan</label>
        <select
          id="pp-hubungan"
          value={hubungan}
          onChange={(e) => setHubungan(e.target.value as PickupHubungan)}
          className="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
        >
          {HUBUNGAN_OPTIONS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        {errors.hubungan ? <p className="text-xs text-danger">{errors.hubungan}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pp-phone" className="text-sm font-medium text-fg">Nomor HP</label>
        <Input
          id="pp-phone"
          type="tel"
          inputMode="tel"
          placeholder="+628..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!errors.phone}
        />
        {errors.phone ? <p className="text-xs text-danger">{errors.phone}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pp-pin" className="text-sm font-medium text-fg">PIN (4-6 digit)</label>
        <Input
          id="pp-pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-invalid={!!errors.pin}
        />
        {errors.pin ? <p className="text-xs text-danger">{errors.pin}</p> : null}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Batal
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
