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

const PEMBAYARAN_DOCTYPE = "Pembayaran Angsuran";
const JADWAL_DOCTYPE = "Jadwal Angsuran";
const AKAD_DOCTYPE = "Akad Pembiayaan";
const NUMERIC_FIELDS = new Set(["nominal", "denda"]);
const METODE_OPTIONS = ["Tunai", "Transfer", "Auto Debit", "Potong Gaji"] as const;

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
      description="Catat pembayaran angsuran untuk jadwal yang dipilih."
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Jadwal Angsuran" required>
            <Input name="jadwal" defaultValue={jadwal ?? ""} required placeholder="ID Jadwal" readOnly={!!jadwal} />
          </FormField>
          <FormField label="Akad" required>
            <Input name="akad" defaultValue={akad ?? ""} required placeholder="No. Akad" readOnly={!!akad} />
          </FormField>
          <FormField label="Tanggal Bayar" required>
            <Input name="tanggal_bayar" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </FormField>
          <FormField label="Metode" required>
            <Select name="metode" required defaultValue="Tunai">
              {METODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
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
          <FormField label="Catatan" className="sm:col-span-2">
            <Textarea name="catatan" placeholder="Catatan pembayaran (opsional)" />
          </FormField>
        </FormGrid>
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
