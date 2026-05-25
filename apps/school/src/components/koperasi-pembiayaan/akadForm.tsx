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

const AKAD_DOCTYPE = "Akad Pembiayaan";
const NUMERIC_FIELDS = new Set(["pokok_pembiayaan", "margin", "tenor_bulan"]);
const AKAD_TYPES = ["Murabahah", "Ijarah", "Qardh", "Musyarakah"] as const;

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
      description="Buat akad pembiayaan baru untuk anggota koperasi."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Anggota" required>
            <Input name="anggota" defaultValue={anggota ?? ""} required placeholder="No. Anggota" />
          </FormField>
          <FormField label="Produk" required>
            <Input name="produk" required placeholder="Misal: Pembiayaan Modal Usaha" />
          </FormField>
          <FormField label="Akad" required>
            <Select name="akad" required defaultValue="Murabahah">
              {AKAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="Tanggal Akad" required>
            <Input name="tanggal_akad" type="date" required />
          </FormField>
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
          <FormField label="Catatan" className="sm:col-span-2">
            <Textarea name="catatan" placeholder="Catatan tambahan (opsional)" />
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
            {create.isPending ? "Memproses..." : "Ajukan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
