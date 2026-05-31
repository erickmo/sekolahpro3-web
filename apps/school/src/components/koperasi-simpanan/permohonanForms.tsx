import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";

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

const AKAD_OPTIONS = ["Wadiah", "Mudharabah", "Wadiah Yad Dhamanah"];

/** Convert plain string values into SearchableSelect options. */
function toOptions(values: string[]): SearchableOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

/** Async option loader for a Frappe link field. */
async function searchLink(
  doctype: string,
  labelField: string,
  q: string,
): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>(doctype, {
    fields: ["name", labelField],
    ...(q
      ? {
          or_filters: [
            ["name", "like", `%${q}%`],
            [labelField, "like", `%${q}%`],
          ] as [string, string, unknown][],
        }
      : {}),
    limit_page_length: 20,
    order_by: "modified desc",
  });
  return rows.map((r) => ({
    value: r.name ?? "",
    label: r[labelField] ? `${r[labelField]} (${r.name})` : (r.name ?? ""),
  }));
}

/** Section heading + grid wrapper for one logical group of fields. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-fg mt-0.5">{description}</p>
        ) : null}
      </div>
      <FormGrid>{children}</FormGrid>
    </section>
  );
}

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
      description={`${meta.description} Tanda * wajib diisi.`}
      size="mega"
      tone="brand"
    >
      <form id={`permohonan-${kind}`} onSubmit={onSubmit} className="space-y-5">
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

/** Render the per-kind field set inside a labeled section. */
function PermohonanFields({ kind, rekening, anggota }: FieldsProps) {
  const [akad, setAkad] = useState("Wadiah");
  const [anggotaVal, setAnggotaVal] = useState(anggota ?? "");
  const [rekeningVal, setRekeningVal] = useState(rekening ?? "");

  if (kind === "buka") {
    return (
      <FormSection
        title="Detail Pembukaan Rekening"
        description="Pilih anggota dan tentukan produk simpanan."
      >
        <FormField label="Anggota" required>
          <SearchableSelect
            value={anggotaVal}
            onChange={(v) => setAnggotaVal(v)}
            loadOptions={(q) => searchLink("Anggota Koperasi", "nasabah", q)}
            placeholder="Cari anggota…"
          />
          <input type="hidden" name="anggota" value={anggotaVal} />
        </FormField>
        <FormField label="Produk" required>
          <Input name="produk" required placeholder="Misal: Simpanan Wajib" />
        </FormField>
        <FormField label="Akad" required>
          <SearchableSelect
            value={akad}
            onChange={(v) => setAkad(v)}
            options={toOptions(AKAD_OPTIONS)}
            placeholder="— pilih —"
          />
          <input type="hidden" name="akad" value={akad} />
        </FormField>
        <FormField label="Setoran Awal (Rp)">
          <Input name="setoran_awal" type="number" min={0} placeholder="0" />
        </FormField>
        <FormField label="Catatan" className="col-span-2">
          <Textarea name="catatan" placeholder="Catatan permohonan (opsional)" />
        </FormField>
      </FormSection>
    );
  }
  // tutup / blokir share alasan + catatan; unblokir/dormant only catatan
  const needsAlasan = kind === "tutup" || kind === "blokir";
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
        <input type="hidden" name="rekening" value={rekeningVal} />
      </FormField>
      {needsAlasan ? (
        <FormField label="Alasan" required className="col-span-2">
          <Input name="alasan" required placeholder="Alasan permohonan" />
        </FormField>
      ) : null}
      <FormField label="Catatan" className="col-span-2">
        <Textarea name="catatan" placeholder="Catatan tambahan (opsional)" />
      </FormField>
    </FormSection>
  );
}
