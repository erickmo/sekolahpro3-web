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
import { AKAD_POKOK_FIELD, buildAkadPayload } from "../../lib/koperasi/akadContract";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

const AKAD_DOCTYPE = "Akad Pembiayaan";

// Akad dates stay near the present — narrow year range for fast jumping.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

interface AkadCreateModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill nasabah field (e.g. when opened from a member detail page). */
  nasabah?: string | undefined;
  onSuccess?: ((createdName: string) => void) | undefined;
}

/**
 * Modal to create a new Akad Pembiayaan (financing contract).
 *
 * Backend contract: { nasabah*, produk_pembiayaan*, jumlah_pokok*, tenor*,
 * tanggal_akad* }. Jenis akad/margin mengikuti Produk Pembiayaan — bukan
 * input form (margin_total dihitung controller).
 */
export function AkadCreateModal(props: AkadCreateModalProps) {
  const { open, onClose, nasabah, onSuccess } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(AKAD_DOCTYPE);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [tanggalAkad, setTanggalAkad] = useState<string>(today);
  const [nasabahVal, setNasabahVal] = useState<string>(nasabah ?? "");
  const [produkVal, setProdukVal] = useState<string>("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      const n = Number(v);
      return typeof v === "string" && v.trim() !== "" && !Number.isNaN(n) ? n : undefined;
    };

    const pokok = num(AKAD_POKOK_FIELD);
    const tenor = num("tenor");
    if (!nasabahVal || !produkVal || pokok === undefined || tenor === undefined) {
      setError("Lengkapi nasabah, produk, pokok pembiayaan, dan tenor.");
      return;
    }

    const doc = buildAkadPayload({
      nasabah: nasabahVal,
      produk_pembiayaan: produkVal,
      tanggal_akad: tanggalAkad,
      jumlah_pokok: pokok,
      tenor,
    });
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", AKAD_DOCTYPE] });
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(
        humanizeFrappeError(err) ??
          (err instanceof Error ? err.message : "Gagal mengajukan pembiayaan"),
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajukan Pembiayaan"
      description="Buat akad pembiayaan baru untuk nasabah koperasi. Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormSection
          title="Akad Pembiayaan"
          description="Nasabah dan produk pembiayaan. Jenis akad mengikuti produk."
        >
          <FormField label="Nasabah" required>
            <SearchableSelect
              value={nasabahVal}
              onChange={(v) => setNasabahVal(v)}
              loadOptions={(q) => searchLink("Nasabah", "pihak", q)}
              placeholder="Cari nasabah…"
            />
          </FormField>
          <FormField label="Produk Pembiayaan" required>
            <SearchableSelect
              value={produkVal}
              onChange={(v) => setProdukVal(v)}
              loadOptions={(q) => searchLink("Produk Pembiayaan", "name", q)}
              placeholder="Cari produk pembiayaan…"
            />
          </FormField>
          <FormField label="Tanggal Akad" required>
            <DatePicker
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
          description="Pokok dan tenor pembiayaan. Margin dihitung dari produk."
        >
          <FormField label="Pokok Pembiayaan (Rp)" required>
            <Input name={AKAD_POKOK_FIELD} type="number" min={1} step="1" required placeholder="0" />
          </FormField>
          <FormField label="Tenor (bulan)" required>
            <Input name="tenor" type="number" min={1} step="1" required placeholder="12" />
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
