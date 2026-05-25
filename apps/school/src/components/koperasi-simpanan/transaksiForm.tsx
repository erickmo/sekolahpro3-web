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

export type TransaksiJenis = "Setor" | "Tarik" | "Transfer" | "Bagi Hasil" | "Koreksi";

const JENIS_OPTIONS: TransaksiJenis[] = ["Setor", "Tarik", "Transfer", "Bagi Hasil", "Koreksi"];

const DOCTYPE = "Transaksi Simpanan";

interface TransaksiModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill rekening (when launched from detail page). */
  rekening?: string;
  /** Default jenis (Setor by default). */
  defaultJenis?: TransaksiJenis;
  onSuccess?: (createdName: string) => void;
}

/**
 * Transaksi Simpanan create modal — covers all 5 jenis.
 *
 * Field assumptions:
 *   - rekening (required)
 *   - jenis (required, enum)
 *   - nominal (required, number)
 *   - tanggal (required, date)
 *   - rekening_tujuan (only when jenis = Transfer)
 *   - keterangan (optional textarea)
 *
 * Backend should derive saldo_akhir + teller from session/posting logic.
 */
export function TransaksiModal(props: TransaksiModalProps) {
  const { open, onClose, rekening, defaultJenis = "Setor", onSuccess } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(DOCTYPE);
  const [jenis, setJenis] = useState<TransaksiJenis>(defaultJenis);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const doc: Record<string, unknown> = {};
    fd.forEach((v, k) => {
      if (typeof v === "string" && v.trim() !== "") {
        if (k === "nominal") {
          const n = Number(v);
          if (!Number.isNaN(n)) doc[k] = n;
        } else {
          doc[k] = v;
        }
      }
    });
    doc.jenis = jenis;
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Rekening Simpanan"] });
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat transaksi");
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaksi Simpanan"
      description="Setor, tarik, transfer, bagi hasil, atau koreksi."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Jenis Transaksi" required>
            <Select
              name="jenis"
              value={jenis}
              onChange={(e) => setJenis(e.target.value as TransaksiJenis)}
              required
            >
              {JENIS_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Tanggal" required>
            <Input name="tanggal" type="date" defaultValue={today} required />
          </FormField>
          <FormField label="Rekening" required>
            <Input
              name="rekening"
              defaultValue={rekening ?? ""}
              required
              placeholder="No. Rekening"
            />
          </FormField>
          <FormField label="Nominal (Rp)" required>
            <Input name="nominal" type="number" min={0} step={1} required placeholder="0" />
          </FormField>
          {jenis === "Transfer" ? (
            <FormField label="Rekening Tujuan" required className="sm:col-span-2">
              <Input name="rekening_tujuan" required placeholder="No. Rekening tujuan" />
            </FormField>
          ) : null}
          <FormField label="Keterangan" className="sm:col-span-2">
            <Textarea name="keterangan" placeholder="Catatan tambahan (opsional)" />
          </FormField>
        </FormGrid>

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
            {create.isPending ? "Memproses..." : "Catat Transaksi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
