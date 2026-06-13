import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import {
  humanizeFrappeError,
  useResourceCreate,
  useResourceDoc,
} from "@sekolahpro/api-client";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

const PEMBAYARAN_DOCTYPE = "Pembayaran Angsuran";
const AKAD_DOCTYPE = "Akad Pembiayaan";

// Payment dates stay near the present — narrow year range for fast jumping.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

// Jadwal Angsuran child rows as embedded in the Akad Pembiayaan doc.
interface JadwalRow {
  ke?: number;
  tanggal_jatuh_tempo?: string;
  total?: number;
  status?: string;
}

interface AkadDoc {
  name: string;
  jadwal_angsuran?: JadwalRow[];
}

interface PembayaranModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill akad (Akad Pembiayaan name). */
  akad?: string | undefined;
  /** Pre-select installment number (Jadwal Angsuran `ke`). */
  angsuranKe?: number | undefined;
  onSuccess?: ((createdName: string) => void) | undefined;
}

/**
 * Modal to record a Pembayaran Angsuran (installment payment).
 *
 * Backend contract: { akad_pembiayaan*, angsuran_ke*, jumlah_bayar*,
 * tanggal_bayar*, denda? }. The installment picker reads the akad doc's
 * embedded jadwal_angsuran child rows (no standalone child-table query).
 */
export function PembayaranAngsuranModal(props: PembayaranModalProps) {
  const { open, onClose, akad, angsuranKe, onSuccess } = props;
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(PEMBAYARAN_DOCTYPE);
  const [error, setError] = useState<string | null>(null);
  const [tanggalBayar, setTanggalBayar] = useState<string>(new Date().toISOString().slice(0, 10));
  const [akadVal, setAkadVal] = useState<string>(akad ?? "");
  const [keVal, setKeVal] = useState<string>(angsuranKe !== undefined ? String(angsuranKe) : "");

  // The akad doc carries its installment schedule as child rows.
  const akadQ = useResourceDoc<AkadDoc>(AKAD_DOCTYPE, akadVal || undefined, {
    enabled: open && Boolean(akadVal),
  });

  const angsuranOptions = useMemo(() => {
    const rows = akadQ.data?.jadwal_angsuran ?? [];
    return rows
      .filter((r) => r.ke !== undefined)
      .map((r) => ({
        value: String(r.ke),
        label: `Ke-${r.ke} · jatuh tempo ${r.tanggal_jatuh_tempo ?? "—"} · Rp ${(r.total ?? 0).toLocaleString("id-ID")}${r.status && r.status !== "Belum" ? ` (${r.status})` : ""}`,
      }));
  }, [akadQ.data]);

  const pickedRow = useMemo(
    () => (akadQ.data?.jadwal_angsuran ?? []).find((r) => String(r.ke) === keVal),
    [akadQ.data, keVal],
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const jumlahBayar = Number(fd.get("jumlah_bayar"));
    const denda = Number(fd.get("denda") || 0);
    if (!akadVal) {
      setError("Akad wajib dipilih.");
      return;
    }
    if (!keVal) {
      setError("Angsuran wajib dipilih.");
      return;
    }
    if (!Number.isFinite(jumlahBayar) || jumlahBayar <= 0) {
      setError("Nominal harus lebih dari nol.");
      return;
    }
    const doc: Record<string, unknown> = {
      akad_pembiayaan: akadVal,
      angsuran_ke: Number(keVal),
      jumlah_bayar: jumlahBayar,
      tanggal_bayar: tanggalBayar,
    };
    if (denda > 0) doc["denda"] = denda;
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", PEMBAYARAN_DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", AKAD_DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:doc", AKAD_DOCTYPE] });
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(
        humanizeFrappeError(err) ??
          (err instanceof Error ? err.message : "Gagal mencatat pembayaran"),
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bayar Angsuran"
      description="Catat pembayaran angsuran untuk akad yang dipilih. Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormSection
          title="Referensi Angsuran"
          description="Pilih akad, lalu nomor angsuran dari jadwalnya."
        >
          <FormField label="Akad" required>
            <SearchableSelect
              value={akadVal}
              onChange={(v) => {
                setAkadVal(v);
                setKeVal("");
              }}
              loadOptions={(q) => searchLink(AKAD_DOCTYPE, "nasabah", q)}
              placeholder="Cari akad…"
              disabled={!!akad}
            />
          </FormField>
          <FormField
            label="Angsuran"
            required
            {...(akadVal && !akadQ.isLoading && angsuranOptions.length === 0
              ? { hint: "Akad ini belum memiliki jadwal angsuran." }
              : {})}
          >
            <SearchableSelect
              value={keVal}
              onChange={(v) => setKeVal(v)}
              options={angsuranOptions}
              placeholder={akadVal ? "— pilih angsuran —" : "Pilih akad dulu"}
              disabled={!akadVal || akadQ.isLoading}
            />
          </FormField>
        </FormSection>
        <FormSection
          title="Detail Pembayaran"
          description="Tanggal, nominal, dan denda (bila ada)."
        >
          <FormField label="Tanggal Bayar" required>
            <DatePicker
              value={tanggalBayar}
              onChange={(v) => setTanggalBayar(v)}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField
            label="Nominal (Rp)"
            required
            {...(pickedRow?.total !== undefined
              ? { hint: `Tagihan angsuran: Rp ${pickedRow.total.toLocaleString("id-ID")}` }
              : {})}
          >
            <Input
              key={keVal}
              name="jumlah_bayar"
              type="number"
              min={1}
              step="1"
              required
              defaultValue={pickedRow?.total !== undefined ? String(pickedRow.total) : ""}
              placeholder="0"
            />
          </FormField>
          <FormField label="Denda (Rp)">
            <Input name="denda" type="number" min={0} step="1" placeholder="0" />
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
