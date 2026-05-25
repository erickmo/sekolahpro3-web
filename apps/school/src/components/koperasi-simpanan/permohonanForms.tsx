import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
  Textarea,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";

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
    description: "Ajukan pembukaan rekening baru untuk anggota koperasi.",
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

interface PermohonanModalProps {
  kind: PermohonanKind;
  open: boolean;
  onClose: () => void;
  /** Pre-fill rekening field (detail page). When omitted, user types it. */
  rekening?: string;
  /** Pre-fill anggota field (detail page). */
  anggota?: string;
  /** Called after successful create — useful for closing/refresh. */
  onSuccess?: (createdName: string) => void;
}

/**
 * Generic permohonan modal — backs all 5 approval-flow DocTypes.
 *
 * Field assumptions (documented for backend alignment):
 *   - buka:     anggota, produk, akad, setoran_awal, catatan
 *   - tutup:    rekening, alasan, catatan
 *   - blokir:   rekening, alasan, catatan
 *   - unblokir: rekening, catatan
 *   - dormant:  rekening, catatan
 *
 * If real DocType fields differ, only the inner <Fields/> per-kind component
 * needs to change — the submit pipeline stays identical.
 */
export function PermohonanModal(props: PermohonanModalProps) {
  const { kind, open, onClose, rekening, anggota, onSuccess } = props;
  const meta = KIND_META[kind];
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(meta.doctype);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const doc: Record<string, unknown> = {};
    formData.forEach((v, k) => {
      if (typeof v === "string" && v.trim() !== "") {
        // numeric fields: setoran_awal
        if (k === "setoran_awal") {
          const n = Number(v);
          if (!Number.isNaN(n)) doc[k] = n;
        } else {
          doc[k] = v;
        }
      }
    });
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", meta.doctype] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Rekening Simpanan"] });
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim permohonan");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meta.title}
      description={meta.description}
      size="md"
    >
      <form id={`permohonan-${kind}`} onSubmit={onSubmit} className="space-y-4">
        <PermohonanFields
          kind={kind}
          {...(rekening !== undefined ? { rekening } : {})}
          {...(anggota !== undefined ? { anggota } : {})}
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
  anggota?: string;
}

function PermohonanFields({ kind, rekening, anggota }: FieldsProps) {
  if (kind === "buka") {
    return (
      <FormGrid cols={2}>
        <FormField label="Anggota" required>
          <Input name="anggota" defaultValue={anggota ?? ""} required placeholder="No. Anggota" />
        </FormField>
        <FormField label="Produk" required>
          <Input name="produk" required placeholder="Misal: Simpanan Wajib" />
        </FormField>
        <FormField label="Akad" required>
          <Select name="akad" required defaultValue="Wadiah">
            <option value="Wadiah">Wadiah</option>
            <option value="Mudharabah">Mudharabah</option>
            <option value="Wadiah Yad Dhamanah">Wadiah Yad Dhamanah</option>
          </Select>
        </FormField>
        <FormField label="Setoran Awal (Rp)">
          <Input name="setoran_awal" type="number" min={0} placeholder="0" />
        </FormField>
        <FormField label="Catatan" className="sm:col-span-2">
          <Textarea name="catatan" placeholder="Catatan permohonan (opsional)" />
        </FormField>
      </FormGrid>
    );
  }
  // tutup / blokir share alasan + catatan; unblokir/dormant only catatan
  const needsAlasan = kind === "tutup" || kind === "blokir";
  return (
    <div className="space-y-4">
      <FormField label="Rekening" required>
        <Input name="rekening" defaultValue={rekening ?? ""} required placeholder="No. Rekening" />
      </FormField>
      {needsAlasan ? (
        <FormField label="Alasan" required>
          <Input name="alasan" required placeholder="Alasan permohonan" />
        </FormField>
      ) : null}
      <FormField label="Catatan">
        <Textarea name="catatan" placeholder="Catatan tambahan (opsional)" />
      </FormField>
    </div>
  );
}
