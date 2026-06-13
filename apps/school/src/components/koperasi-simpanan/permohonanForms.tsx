import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import { humanizeFrappeError, useResourceCreate } from "@sekolahpro/api-client";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type PermohonanKind =
  | "buka"
  | "tutup"
  | "blokir"
  | "unblokir"
  | "dormant";

const KIND_META: Record<
  PermohonanKind,
  { doctype: string; title: string; description: string; submitLabel: string }
> = {
  buka: {
    doctype: "Permohonan Buka Rekening",
    title: "Buka Rekening Simpanan",
    description: "Ajukan pembukaan rekening baru untuk nasabah koperasi.",
    submitLabel: "Ajukan Buka Rekening",
  },
  tutup: {
    doctype: "Permohonan Tutup Rekening",
    title: "Tutup Rekening",
    description: "Ajukan penutupan rekening simpanan.",
    submitLabel: "Ajukan Penutupan",
  },
  blokir: {
    doctype: "Permohonan Blokir Rekening",
    title: "Blokir Rekening",
    description: "Ajukan pemblokiran rekening (sementara).",
    submitLabel: "Ajukan Blokir",
  },
  unblokir: {
    doctype: "Permohonan Unblokir Rekening",
    title: "Buka Blokir Rekening",
    description: "Ajukan pencabutan blokir rekening.",
    submitLabel: "Ajukan Unblokir",
  },
  dormant: {
    doctype: "Permohonan Aktivasi Dormant",
    title: "Aktivasi Rekening Dormant",
    description: "Ajukan pengaktifan kembali rekening dormant.",
    submitLabel: "Ajukan Aktivasi",
  },
};

// Status awal saat operator mengajukan dari UI (Draft = belum diajukan).
const STATUS_DIAJUKAN = "Diajukan";

// Permohonan dates stay near the present — narrow year range.
const MIN_YEAR = new Date().getFullYear() - 1;
const MAX_YEAR = new Date().getFullYear() + 1;

interface PermohonanModalProps {
  kind: PermohonanKind;
  open: boolean;
  onClose: () => void;
  /** Pre-fill rekening field (detail page). When omitted, user picks it. */
  rekening?: string;
  /** Pre-fill nasabah field — kind "buka" only. */
  nasabah?: string;
  /** Called after successful create — useful for closing/refresh. */
  onSuccess?: (createdName: string) => void;
}

/**
 * Generic permohonan modal — backs all 5 approval-flow DocTypes.
 *
 * Backend field contract (verified against doctype JSONs):
 *   - buka:     nasabah*, produk_simpanan*, tanggal_buka*
 *   - blokir:   rekening_simpanan*, alasan_blokir*
 *   - tutup/unblokir/dormant: rekening_simpanan*
 * status_permohonan dikirim "Diajukan" agar langsung masuk antrean
 * persetujuan supervisor (default backend = Draft).
 */
export function PermohonanModal(props: PermohonanModalProps) {
  const { kind, open, onClose, rekening, nasabah, onSuccess } = props;
  const meta = KIND_META[kind];
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(meta.doctype);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const doc: Record<string, unknown> = { status_permohonan: STATUS_DIAJUKAN };
    formData.forEach((v, k) => {
      if (typeof v === "string" && v.trim() !== "") doc[k] = v;
    });
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", meta.doctype] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Rekening Simpanan"] });
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(
        humanizeFrappeError(err) ??
          (err instanceof Error ? err.message : "Gagal mengirim permohonan"),
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meta.title}
      description={`${meta.description} Tanda * wajib diisi.`}
      size="mega"
      tone="brand"
    >
      <form id={`permohonan-${kind}`} onSubmit={onSubmit} className="space-y-5">
        <PermohonanFields
          kind={kind}
          {...(rekening !== undefined ? { rekening } : {})}
          {...(nasabah !== undefined ? { nasabah } : {})}
        />
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Memproses..." : meta.submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Per-kind fields
// ---------------------------------------------------------------------------

interface FieldsProps {
  kind: PermohonanKind;
  rekening?: string;
  nasabah?: string;
}

/** Render the per-kind field set inside a labeled section. */
function PermohonanFields({ kind, rekening, nasabah }: FieldsProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [nasabahVal, setNasabahVal] = useState(nasabah ?? "");
  const [rekeningVal, setRekeningVal] = useState(rekening ?? "");
  const [produkVal, setProdukVal] = useState("");
  const [tanggalBuka, setTanggalBuka] = useState(today);

  if (kind === "buka") {
    return (
      <FormSection
        title="Detail Pembukaan Rekening"
        description="Pilih nasabah dan tentukan produk simpanan. Akad mengikuti produk."
      >
        <FormField label="Nasabah" required>
          <SearchableSelect
            value={nasabahVal}
            onChange={(v) => setNasabahVal(v)}
            loadOptions={(q) => searchLink("Nasabah", "pihak", q)}
            placeholder="Cari nasabah…"
          />
          <input type="hidden" name="nasabah" value={nasabahVal} />
        </FormField>
        <FormField label="Produk Simpanan" required>
          <SearchableSelect
            value={produkVal}
            onChange={(v) => setProdukVal(v)}
            loadOptions={(q) => searchLink("Produk Simpanan", "name", q)}
            placeholder="Cari produk simpanan…"
          />
          <input type="hidden" name="produk_simpanan" value={produkVal} />
        </FormField>
        <FormField label="Tanggal Buka" required>
          <DatePicker
            value={tanggalBuka}
            onChange={(v) => setTanggalBuka(v)}
            required
            captionLayout="dropdown-buttons"
            fromYear={MIN_YEAR}
            toYear={MAX_YEAR}
          />
          <input type="hidden" name="tanggal_buka" value={tanggalBuka} />
        </FormField>
      </FormSection>
    );
  }
  // blokir butuh alasan_blokir; tutup/unblokir/dormant hanya rekening.
  return (
    <FormSection
      title="Detail Permohonan"
      description="Pilih rekening yang akan diproses."
    >
      <FormField label="Rekening" required className="col-span-2">
        <SearchableSelect
          value={rekeningVal}
          onChange={(v) => setRekeningVal(v)}
          loadOptions={(q) => searchLink("Rekening Simpanan", "name", q)}
          placeholder="Cari rekening…"
        />
        <input type="hidden" name="rekening_simpanan" value={rekeningVal} />
      </FormField>
      {kind === "blokir" ? (
        <FormField label="Alasan Blokir" required className="col-span-2">
          <Input name="alasan_blokir" required placeholder="Alasan pemblokiran" />
        </FormField>
      ) : null}
    </FormSection>
  );
}
