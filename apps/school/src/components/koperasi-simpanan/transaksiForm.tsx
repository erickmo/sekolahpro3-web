import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
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
import { listResource, useResourceCreate, useResourceList } from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import { validateTransaksi, hasActiveSession } from "../../lib/koperasi/transaksiGuard";
import { SesiKasForm } from "../koperasi/SesiKasForm";

/** Jenis transaksi yang menggerakkan kas fisik → wajib ada sesi kas aktif. */
const CASH_JENIS: ReadonlySet<string> = new Set(["Setor", "Tarik"]);

export type TransaksiJenis = "Setor" | "Tarik" | "Transfer" | "Bagi Hasil" | "Koreksi";

const JENIS_OPTIONS: TransaksiJenis[] = ["Setor", "Tarik", "Transfer", "Bagi Hasil", "Koreksi"];

const DOCTYPE = "Transaksi Simpanan";

// Transaction dates stay near the present — narrow year range for fast jumping.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

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
  const session = useSession();
  const create = useResourceCreate<{ name: string }>(DOCTYPE);
  const [jenis, setJenis] = useState<TransaksiJenis>(defaultJenis);
  const today = new Date().toISOString().slice(0, 10);
  const [tanggal, setTanggal] = useState<string>(today);
  const [rekeningVal, setRekeningVal] = useState<string>(rekening ?? "");
  const [rekeningTujuan, setRekeningTujuan] = useState<string>("");
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
    { enabled: open && jenis === "Tarik" && Boolean(rekeningVal) },
  );
  const saldoSumber = saldoQ.data?.[0]?.saldo;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const nominal = Number(fd.get("nominal"));

    // Guard sisi-klien sebelum POST: cegah salah ketik & selisih kas.
    const guardError = validateTransaksi({
      jenis,
      nominal,
      rekening: rekeningVal,
      ...(jenis === "Transfer" ? { rekeningTujuan } : {}),
      ...(jenis === "Tarik" && saldoSumber !== undefined ? { saldo: saldoSumber } : {}),
    });
    if (guardError) {
      setError(guardError);
      return;
    }
    if (cashBlocked) {
      setError("Belum ada sesi kas aktif — buka sesi kas dulu sebelum transaksi tunai.");
      return;
    }

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaksi Simpanan"
      description="Setor, tarik, transfer, bagi hasil, atau koreksi. Tanda * wajib diisi."
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
            <input type="hidden" name="rekening" value={rekeningVal} />
          </FormField>
          <FormField
            label="Nominal (Rp)"
            required
            {...(jenis === "Tarik" && saldoSumber !== undefined
              ? { hint: `Saldo tersedia: Rp ${saldoSumber.toLocaleString("id-ID")}` }
              : {})}
          >
            <Input name="nominal" type="number" min={1} step={1} required placeholder="0" />
          </FormField>
          {jenis === "Transfer" ? (
            <FormField label="Rekening Tujuan" required className="col-span-2">
              <SearchableSelect
                value={rekeningTujuan}
                onChange={(v) => setRekeningTujuan(v)}
                loadOptions={(q) => searchLink("Rekening Simpanan", "name", q)}
                placeholder="Cari rekening tujuan…"
              />
              <input type="hidden" name="rekening_tujuan" value={rekeningTujuan} />
            </FormField>
          ) : null}
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
