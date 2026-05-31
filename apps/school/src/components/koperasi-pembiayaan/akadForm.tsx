import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";

const AKAD_DOCTYPE = "Akad Pembiayaan";
const NUMERIC_FIELDS = new Set(["pokok_pembiayaan", "margin", "tenor_bulan"]);
const AKAD_TYPES = ["Murabahah", "Ijarah", "Qardh", "Musyarakah"] as const;

// Akad dates stay near the present — narrow year range for fast jumping.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

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

interface AkadCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill anggota field (e.g. when opened from a member detail page). */
  anggota?: string | undefined;
  onSuccess?: ((createdName: string) => void) | undefined;
}

/**
 * Modal to create a new Akad Pembiayaan (financing contract).
 * Fields: anggota, produk, akad, pokok_pembiayaan, margin, tenor_bulan, jaminan, tanggal_akad.
 */
export function AkadCreateModal(props: AkadCreateModalProps) {
  const { open, onClose, anggota, onSuccess } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(AKAD_DOCTYPE);
  const [error, setError] = useState<string | null>(null);
  const [akad, setAkad] = useState<string>("Murabahah");
  const [tanggalAkad, setTanggalAkad] = useState<string>("");
  const [anggotaVal, setAnggotaVal] = useState<string>(anggota ?? "");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const doc: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (typeof v !== "string" || v.trim() === "") return;
      if (NUMERIC_FIELDS.has(k)) {
        const n = Number(v);
        if (!Number.isNaN(n)) doc[k] = n;
      } else {
        doc[k] = v;
      }
    });
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", AKAD_DOCTYPE] });
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan pembiayaan");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajukan Pembiayaan"
      description="Buat akad pembiayaan baru untuk anggota koperasi. Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormSection
          title="Akad Pembiayaan"
          description="Anggota, produk, dan jenis akad."
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
            <Input name="produk" required placeholder="Misal: Pembiayaan Modal Usaha" />
          </FormField>
          <FormField label="Akad" required>
            <SearchableSelect
              value={akad}
              onChange={(v) => setAkad(v)}
              options={AKAD_TYPES.map((t) => ({ value: t, label: t }))}
              placeholder="— pilih —"
            />
            <input type="hidden" name="akad" value={akad} />
          </FormField>
          <FormField label="Tanggal Akad" required>
            <DatePicker
              name="tanggal_akad"
              value={tanggalAkad}
              onChange={(v) => setTanggalAkad(v)}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
        </FormSection>
        <FormSection
          title="Nilai & Tenor"
          description="Pokok, margin, tenor, dan jaminan pembiayaan."
        >
          <FormField label="Pokok Pembiayaan (Rp)" required>
            <Input name="pokok_pembiayaan" type="number" min={0} step="1" required placeholder="0" />
          </FormField>
          <FormField label="Margin (Rp)">
            <Input name="margin" type="number" min={0} step="1" placeholder="0" />
          </FormField>
          <FormField label="Tenor (bulan)" required>
            <Input name="tenor_bulan" type="number" min={1} step="1" required placeholder="12" />
          </FormField>
          <FormField label="Jaminan">
            <Input name="jaminan" placeholder="Deskripsi jaminan (opsional)" />
          </FormField>
          <FormField label="Catatan" className="col-span-2">
            <Textarea name="catatan" placeholder="Catatan tambahan (opsional)" />
          </FormField>
        </FormSection>
        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Memproses..." : "Ajukan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
