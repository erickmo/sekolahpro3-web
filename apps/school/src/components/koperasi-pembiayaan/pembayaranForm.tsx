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

const PEMBAYARAN_DOCTYPE = "Pembayaran Angsuran";
const JADWAL_DOCTYPE = "Jadwal Angsuran";
const AKAD_DOCTYPE = "Akad Pembiayaan";
const NUMERIC_FIELDS = new Set(["nominal", "denda"]);
const METODE_OPTIONS = ["Tunai", "Transfer", "Auto Debit", "Potong Gaji"] as const;

// Payment dates stay near the present — narrow year range for fast jumping.
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

interface PembayaranModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill jadwal (Jadwal Angsuran name). */
  jadwal?: string | undefined;
  /** Pre-fill akad (Akad Pembiayaan name). */
  akad?: string | undefined;
  /** Pre-fill default nominal from the jadwal row. */
  defaultNominal?: number | undefined;
  onSuccess?: ((createdName: string) => void) | undefined;
}

/**
 * Modal to record a Pembayaran Angsuran (installment payment).
 * Links the payment to the corresponding Jadwal Angsuran and Akad Pembiayaan.
 */
export function PembayaranAngsuranModal(props: PembayaranModalProps) {
  const { open, onClose, jadwal, akad, defaultNominal, onSuccess } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(PEMBAYARAN_DOCTYPE);
  const [error, setError] = useState<string | null>(null);
  const [tanggalBayar, setTanggalBayar] = useState<string>(new Date().toISOString().slice(0, 10));
  const [metode, setMetode] = useState<string>("Tunai");
  const [jadwalVal, setJadwalVal] = useState<string>(jadwal ?? "");
  const [akadVal, setAkadVal] = useState<string>(akad ?? "");

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
      await qc.invalidateQueries({ queryKey: ["resource:list", PEMBAYARAN_DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", JADWAL_DOCTYPE] });
      if (jadwal) {
        await qc.invalidateQueries({ queryKey: ["resource:doc", JADWAL_DOCTYPE, jadwal] });
      }
      if (akad) {
        await qc.invalidateQueries({ queryKey: ["resource:doc", AKAD_DOCTYPE, akad] });
      }
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat pembayaran");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bayar Angsuran"
      description="Catat pembayaran angsuran untuk jadwal yang dipilih. Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormSection
          title="Referensi Angsuran"
          description="Jadwal dan akad yang dibayar."
        >
          <FormField label="Jadwal Angsuran" required>
            <SearchableSelect
              value={jadwalVal}
              onChange={(v) => setJadwalVal(v)}
              loadOptions={(q) => searchLink(JADWAL_DOCTYPE, "name", q)}
              placeholder="Cari jadwal…"
              disabled={!!jadwal}
            />
            <input type="hidden" name="jadwal" value={jadwalVal} />
          </FormField>
          <FormField label="Akad" required>
            <SearchableSelect
              value={akadVal}
              onChange={(v) => setAkadVal(v)}
              loadOptions={(q) => searchLink(AKAD_DOCTYPE, "name", q)}
              placeholder="Cari akad…"
              disabled={!!akad}
            />
            <input type="hidden" name="akad" value={akadVal} />
          </FormField>
        </FormSection>
        <FormSection
          title="Detail Pembayaran"
          description="Tanggal, metode, nominal, dan denda."
        >
          <FormField label="Tanggal Bayar" required>
            <DatePicker
              name="tanggal_bayar"
              value={tanggalBayar}
              onChange={(v) => setTanggalBayar(v)}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Metode" required>
            <SearchableSelect
              value={metode}
              onChange={(v) => setMetode(v)}
              options={METODE_OPTIONS.map((m) => ({ value: m, label: m }))}
              placeholder="— pilih —"
            />
            <input type="hidden" name="metode" value={metode} />
          </FormField>
          <FormField label="Nominal (Rp)" required>
            <Input
              name="nominal"
              type="number"
              min={0}
              step="1"
              required
              defaultValue={defaultNominal !== undefined ? String(defaultNominal) : ""}
              placeholder="0"
            />
          </FormField>
          <FormField label="Denda (Rp)">
            <Input name="denda" type="number" min={0} step="1" placeholder="0" />
          </FormField>
          <FormField label="Catatan" className="col-span-2">
            <Textarea name="catatan" placeholder="Catatan pembayaran (opsional)" />
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
            {create.isPending ? "Memproses..." : "Catat Pembayaran"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
