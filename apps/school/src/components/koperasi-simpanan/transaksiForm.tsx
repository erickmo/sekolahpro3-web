import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  DatePicker,
  FormField,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
  type SearchableOption,
} from "@sekolahpro/ui";
import { humanizeFrappeError, useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import {
  validateTransaksi,
  hasActiveSession,
  type TransaksiJenis,
} from "../../lib/koperasi/transaksiGuard";
import { SesiKasForm } from "../koperasi/SesiKasForm";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

/** Jenis transaksi yang menggerakkan kas fisik → wajib ada sesi kas aktif. */
const CASH_JENIS: ReadonlySet<string> = new Set(["Setoran", "Penarikan"]);

// Exact backend Select values (Transaksi Simpanan.jenis) a teller may create.
const JENIS_OPTIONS: TransaksiJenis[] = ["Setoran", "Penarikan", "Bagi Hasil"];

const DOCTYPE = "Transaksi Simpanan";

// Transaction dates stay near the present — narrow year range for fast jumping.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

/** Convert plain string values into SearchableSelect options. */
function toOptions(values: string[]): SearchableOption[] {
  return values.map((v) => ({ value: v, label: v }));
}

interface TransaksiModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-fill rekening (when launched from detail page). */
  rekening?: string;
  /** Default jenis (Setoran by default). */
  defaultJenis?: TransaksiJenis;
  onSuccess?: (createdName: string) => void;
}

/**
 * Transaksi Simpanan create modal — Setoran / Penarikan / Bagi Hasil.
 *
 * Field contract (backend doctype Transaksi Simpanan):
 *   - rekening_simpanan (required, Link Rekening Simpanan)
 *   - jenis (required, exact Select value)
 *   - jumlah (required, Currency > 0)
 *   - tanggal (required, Date)
 *   - keterangan (optional)
 * approval_status / sesi_kas / saldo dihitung backend — tidak dikirim.
 */
export function TransaksiModal(props: TransaksiModalProps) {
  const { open, onClose, rekening, defaultJenis = "Setoran", onSuccess } = props;
  const qc = useQueryClient();
  const session = useSession();
  const create = useResourceCreate<{ name: string }>(DOCTYPE);
  const [jenis, setJenis] = useState<TransaksiJenis>(defaultJenis);
  const today = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal] = useState<string>(today);
  const [rekeningVal, setRekeningVal] = useState<string>(rekening ?? "");
  const [error, setError] = useState<string | null>(null);
  const [bukaSesiOpen, setBukaSesiOpen] = useState(false);

  // Sesi kas aktif milik teller saat ini — gate untuk transaksi tunai.
  const sesiQ = useResourceList<{ name: string; teller: string; status: string }>(
    "Sesi Kas Teller",
    {
      fields: ["name", "teller", "status"],
      filters: [
        ["teller", "=", session.user ?? ""],
        ["status", "=", "Aktif"],
      ],
      limit_page_length: 5,
    },
    { enabled: open && Boolean(session.user) },
  );
  const sessionActive = hasActiveSession(sesiQ.data ?? [], session.user ?? "");
  const isCash = CASH_JENIS.has(jenis);
  const cashBlocked = isCash && !sesiQ.isLoading && !sessionActive;

  // Saldo rekening sumber — untuk memblok penarikan melebihi saldo.
  const saldoQ = useResourceList<{ name: string; saldo?: number }>(
    "Rekening Simpanan",
    {
      fields: ["name", "saldo"],
      filters: [["name", "=", rekeningVal]],
      limit_page_length: 1,
    },
    { enabled: open && jenis === "Penarikan" && Boolean(rekeningVal) },
  );
  const saldoSumber = saldoQ.data?.[0]?.saldo;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const jumlah = Number(fd.get("jumlah"));

    // Guard sisi-klien sebelum POST: cegah salah ketik & selisih kas.
    const guardError = validateTransaksi({
      jenis,
      nominal: jumlah,
      rekening: rekeningVal,
      ...(jenis === "Penarikan" && saldoSumber !== undefined ? { saldo: saldoSumber } : {}),
    });
    if (guardError) {
      setError(guardError);
      return;
    }
    // Block a cash transaction until the sesi-kas check has resolved — otherwise
    // a submit during the loading window slips past the gate.
    if (isCash && sesiQ.isLoading) {
      setError("Memeriksa sesi kas aktif — tunggu sebentar lalu coba lagi.");
      return;
    }
    if (cashBlocked) {
      setError("Belum ada sesi kas aktif — buka sesi kas dulu sebelum transaksi tunai.");
      return;
    }

    const doc: Record<string, unknown> = {
      rekening_simpanan: rekeningVal,
      jenis,
      jumlah,
      tanggal,
    };
    const keterangan = String(fd.get("keterangan") ?? "").trim();
    if (keterangan) doc["keterangan"] = keterangan;
    try {
      const created = await create.mutateAsync(doc);
      await qc.invalidateQueries({ queryKey: ["resource:list", DOCTYPE] });
      await qc.invalidateQueries({ queryKey: ["resource:list", "Rekening Simpanan"] });
      onSuccess?.(created.name);
      onClose();
    } catch (err) {
      setError(
        humanizeFrappeError(err) ??
          (err instanceof Error ? err.message : "Gagal mencatat transaksi"),
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaksi Simpanan"
      description="Setoran, penarikan, atau bagi hasil. Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {cashBlocked ? (
          <Alert tone="warning" title="Belum ada sesi kas aktif">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>Transaksi tunai butuh sesi kas yang terbuka atas nama Anda.</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setBukaSesiOpen(true)}>
                Buka Sesi Kas
              </Button>
            </div>
          </Alert>
        ) : null}
        <FormSection
          title="Detail Transaksi"
          description="Tentukan jenis, rekening, dan nominal transaksi."
        >
          <FormField label="Jenis Transaksi" required>
            <SearchableSelect
              value={jenis}
              onChange={(v) => setJenis(v as TransaksiJenis)}
              options={toOptions(JENIS_OPTIONS)}
              placeholder="— pilih —"
            />
          </FormField>
          <FormField label="Tanggal" required>
            <DatePicker
              name="tanggal"
              value={tanggal}
              onChange={(v) => setTanggal(v)}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Rekening" required>
            <SearchableSelect
              value={rekeningVal}
              onChange={(v) => setRekeningVal(v)}
              loadOptions={(q) => searchLink("Rekening Simpanan", "name", q)}
              placeholder="Cari rekening…"
            />
          </FormField>
          <FormField
            label="Nominal (Rp)"
            required
            {...(jenis === "Penarikan" && saldoSumber !== undefined
              ? { hint: `Saldo tersedia: Rp ${saldoSumber.toLocaleString("id-ID")}` }
              : {})}
          >
            <Input name="jumlah" type="number" min={1} step={1} required placeholder="0" />
          </FormField>
          <FormField label="Keterangan" className="col-span-2">
            <Textarea name="keterangan" placeholder="Catatan tambahan (opsional)" />
          </FormField>
        </FormSection>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={create.isPending || cashBlocked}>
            {create.isPending ? "Memproses..." : "Catat Transaksi"}
          </Button>
        </div>
      </form>

      {bukaSesiOpen ? (
        <SesiKasForm
          mode="buka"
          onClose={() => setBukaSesiOpen(false)}
          onSuccess={() => {
            setBukaSesiOpen(false);
            void sesiQ.refetch();
          }}
        />
      ) : null}
    </Modal>
  );
}

export type { TransaksiJenis };
