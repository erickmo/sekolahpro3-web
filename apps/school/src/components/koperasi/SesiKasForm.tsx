import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
} from "@sekolahpro/ui";
import {
  humanizeFrappeError,
  runDocMethod,
  updateResource,
  useResourceCreate,
  useResourceList,
} from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import {
  computeTotalDenominasi,
  computeSaldoSeharusnya,
  computeSelisih,
  sumTransaksiSigned,
  validateBukaSesi,
  validateTutupSesi,
  type DenominasiItem,
  type Shift,
} from "../../lib/koperasi/sesiKas";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

/**
 * Form Buka/Tutup Sesi Kas Teller.
 *
 * Backend contract (sesi_kas_teller.json — submittable doctype):
 *   Buka  = create { teller*, tanggal*, shift*, supervisor_buka*, modal_kas*,
 *           denominasi_buka*: [{ denominasi (Link Denominasi Uang), jumlah_lembar }] }
 *           lalu SUBMIT (docstatus 1) → controller men-set status Aktif.
 *   Tutup = patch { denominasi_tutup, catatan_selisih } lalu panggil method
 *           whitelisted `tutup_kas` → status Pending Approval; supervisor
 *           approve via `approve_tutup` (lihat halaman Kas Teller).
 */

const SHIFTS: Shift[] = ["Pagi", "Siang", "Sore"];
const DOCTYPE = "Sesi Kas Teller";

// One editable row of the denomination breakdown — bound to a Denominasi Uang
// master row (Link) with its nilai used for client-side math.
interface DenominasiRow {
  denominasi: string;
  nominal: number;
  jumlah: number;
}

interface MasterDenominasi {
  name: string;
  nama?: string;
  nilai?: number;
  urutan?: number;
  aktif?: 0 | 1;
}

/** Map editable rows → backend child rows ({denominasi, jumlah_lembar}). */
function toChildRows(rows: DenominasiRow[]): Array<Record<string, unknown>> {
  return rows
    .filter((r) => r.jumlah > 0)
    .map((r) => ({ denominasi: r.denominasi, jumlah_lembar: r.jumlah }));
}

/** Editable rows as lib DenominasiItem for the pure validators. */
function toItems(rows: DenominasiRow[]): DenominasiItem[] {
  return rows.filter((r) => r.jumlah > 0).map((r) => ({ nominal: r.nominal, jumlah: r.jumlah }));
}

interface BukaProps {
  mode: "buka";
  onClose: () => void;
  onSuccess?: () => void;
}

interface TutupProps {
  mode: "tutup";
  sesi: { name: string; modalKas: number; shift: Shift; tanggal?: string };
  onClose: () => void;
  onSuccess?: () => void;
}

interface TransaksiCashQueryRow {
  name: string;
  jenis: string;
  jumlah: number;
  tanggal: string;
}

export function SesiKasForm(props: BukaProps | TutupProps) {
  if (props.mode === "buka") return <BukaSesiForm {...props} />;
  return <TutupSesiForm {...props} />;
}

/** Load active Denominasi Uang rows as an editable breakdown table. */
function useDenominasiRows(): {
  rows: DenominasiRow[];
  setRows: (next: DenominasiRow[]) => void;
  loading: boolean;
} {
  const masterQ = useResourceList<MasterDenominasi>("Denominasi Uang", {
    fields: ["name", "nama", "nilai", "urutan", "aktif"],
    filters: [["aktif", "=", 1]],
    order_by: "urutan asc",
    limit_page_length: 50,
  });
  const [edits, setEdits] = useState<Record<string, number>>({});
  const rows = useMemo(
    () =>
      (masterQ.data ?? []).map((m) => ({
        denominasi: m.name,
        nominal: m.nilai ?? 0,
        jumlah: edits[m.name] ?? 0,
      })),
    [masterQ.data, edits],
  );
  const setRows = (next: DenominasiRow[]) =>
    setEdits(Object.fromEntries(next.map((r) => [r.denominasi, r.jumlah])));
  return { rows, setRows, loading: masterQ.isLoading };
}

function DenominasiTable({
  rows,
  onChange,
}: {
  rows: DenominasiRow[];
  onChange: (next: DenominasiRow[]) => void;
}) {
  return (
    <div className="rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-fg">
          <tr>
            <th className="px-3 py-2 text-left">Pecahan</th>
            <th className="px-3 py-2 text-right">Jumlah</th>
            <th className="px-3 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.denominasi}>
              <td className="px-3 py-1.5 tabular-nums">
                Rp {r.nominal.toLocaleString("id-ID")}
              </td>
              <td className="px-3 py-1.5">
                <Input
                  type="number"
                  min={0}
                  value={r.jumlah || ""}
                  onChange={(e) => {
                    const next = rows.slice();
                    next[i] = { ...r, jumlah: Number(e.target.value) || 0 };
                    onChange(next);
                  }}
                  className="ml-auto h-8 w-24 text-right"
                />
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums text-muted-fg">
                Rp {(r.nominal * r.jumlah).toLocaleString("id-ID")}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-3 py-4 text-center text-xs text-muted-fg">
                Master Denominasi Uang kosong — isi dulu di Pengaturan.
              </td>
            </tr>
          ) : null}
        </tbody>
        <tfoot className="border-t border-border bg-muted/40">
          <tr>
            <td colSpan={2} className="px-3 py-2 text-right font-medium">
              Total
            </td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">
              Rp {computeTotalDenominasi(toItems(rows)).toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function failMessage(e: unknown, fallback: string): string {
  return humanizeFrappeError(e) ?? (e instanceof Error ? e.message : fallback);
}

function BukaSesiForm({ onClose, onSuccess }: BukaProps) {
  const session = useSession();
  const today = new Date().toISOString().slice(0, 10);
  const [shift, setShift] = useState<Shift>("Pagi");
  const [modalKas, setModalKas] = useState<number>(0);
  const [supervisor, setSupervisor] = useState("");
  const { rows, setRows, loading } = useDenominasiRows();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const createMut = useResourceCreate<{ name: string }>(DOCTYPE);

  const handleSubmit = async () => {
    const err = validateBukaSesi({ shift, modalKas, denominasiBuka: toItems(rows) });
    if (err) {
      setError(err);
      return;
    }
    if (!supervisor) {
      setError("Pilih supervisor pembuka sesi.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await createMut.mutateAsync({
        teller: session.user,
        tanggal: today,
        shift,
        supervisor_buka: supervisor,
        modal_kas: modalKas,
        denominasi_buka: toChildRows(rows),
      });
      // Submittable doctype: submit mengaktifkan sesi (on_submit → Aktif).
      await updateResource(DOCTYPE, created.name, { docstatus: 1 });
      onSuccess?.();
    } catch (e) {
      setError(failMessage(e, "Gagal membuka sesi kas"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Buka Sesi Kas"
      description="Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <div className="space-y-5">
        <FormSection
          title="Detail Sesi"
          description="Shift, modal kas awal, dan supervisor pembuka."
        >
          <FormField label="Shift" required>
            <SearchableSelect
              value={shift}
              onChange={(v) => setShift(v as Shift)}
              options={SHIFTS.map((s) => ({ value: s, label: s }))}
              placeholder="— pilih —"
            />
          </FormField>

          <FormField
            label="Modal Kas"
            required
            hint="Harus sama dengan total denominasi di bawah."
          >
            <Input
              type="number"
              min={0}
              value={modalKas || ""}
              onChange={(e) => setModalKas(Number(e.target.value) || 0)}
            />
          </FormField>

          <FormField label="Supervisor Pembuka" required className="col-span-2">
            <SearchableSelect
              value={supervisor}
              onChange={(v) => setSupervisor(v)}
              placeholder="Cari supervisor…"
              loadOptions={(q) => searchLink("User", "full_name", q, [["enabled", "=", 1]])}
            />
          </FormField>
        </FormSection>

        <div className="space-y-1.5">
          <div className="text-sm font-medium">Rincian Denominasi Awal</div>
          {loading ? (
            <div className="py-6 text-center text-xs text-muted-fg">Memuat denominasi…</div>
          ) : (
            <DenominasiTable rows={rows} onChange={setRows} />
          )}
        </div>

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || loading}>
            {submitting ? "Menyimpan..." : "Buka Sesi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TutupSesiForm({ sesi, onClose, onSuccess }: TutupProps) {
  const { rows, setRows, loading } = useDenominasiRows();
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Saldo seharusnya = modal awal + setoran − penarikan hari ini. Setoran &
  // penarikan diturunkan dari Transaksi Simpanan tanggal sesi (client-side)
  // sehingga selisih merefleksikan aktivitas nyata, bukan modal saja. Bila
  // agregat tak bisa dihitung, UI menyatakan eksplisit "belum dapat dihitung"
  // dan tidak menampilkan angka selisih yang menyesatkan.
  const txQ = useResourceList<TransaksiCashQueryRow>(
    "Transaksi Simpanan",
    {
      fields: ["name", "jenis", "jumlah", "tanggal"],
      filters: [["tanggal", "=", sesi.tanggal ?? ""]],
      limit_page_length: 0,
    },
    { enabled: Boolean(sesi.tanggal) },
  );

  const filled = useMemo(() => toItems(rows), [rows]);
  const totalTutup = computeTotalDenominasi(filled);

  const canCompute = Boolean(sesi.tanggal) && !txQ.isError && txQ.data !== undefined;
  const { totalSetoran, totalPenarikan } = canCompute
    ? sumTransaksiSigned(txQ.data ?? [])
    : { totalSetoran: 0, totalPenarikan: 0 };
  const saldoSeharusnya = computeSaldoSeharusnya({
    modalKas: sesi.modalKas,
    totalSetoran,
    totalPenarikan,
  });
  const selisih = computeSelisih({
    totalDenominasiTutup: totalTutup,
    saldoSeharusnya,
  });

  const handleSubmit = async () => {
    if (filled.length === 0) {
      setError("Rincian denominasi tutup wajib diisi.");
      return;
    }
    if (canCompute) {
      const err = validateTutupSesi({
        denominasiTutup: filled,
        saldoSeharusnya,
        catatanSelisih: catatan,
      });
      if (err) {
        setError(err);
        return;
      }
    } else if (!catatan.trim()) {
      // Selisih tak terhitung otomatis → wajib catatan kondisi kas.
      setError("Selisih belum dapat dihitung otomatis — isi catatan kondisi kas terlebih dahulu.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // Patch isian, lalu jalankan aksi controller (recompute + status).
      await updateResource(DOCTYPE, sesi.name, {
        denominasi_tutup: toChildRows(rows),
        catatan_selisih: catatan,
      });
      await runDocMethod({ dt: DOCTYPE, dn: sesi.name, method: "tutup_kas" });
      onSuccess?.();
    } catch (e) {
      setError(failMessage(e, "Gagal menutup sesi kas"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Tutup Sesi Kas — ${sesi.name}`}
      description="Tanda * wajib diisi."
      size="mega"
      tone="brand"
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
          <div>
            <div className="text-xs text-muted-fg">Modal Kas</div>
            <div className="font-medium tabular-nums">
              Rp {sesi.modalKas.toLocaleString("id-ID")}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-fg">Saldo Seharusnya</div>
            <div className="font-medium tabular-nums">
              {txQ.isLoading ? "menghitung…" : canCompute ? `Rp ${saldoSeharusnya.toLocaleString("id-ID")}` : "belum dapat dihitung"}
            </div>
            <div className="text-[10px] text-muted-fg">
              {canCompute
                ? `modal + setoran Rp ${totalSetoran.toLocaleString("id-ID")} − penarikan Rp ${totalPenarikan.toLocaleString("id-ID")}`
                : "transaksi hari ini tak dapat diakses"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-fg">Selisih</div>
            {canCompute ? (
              <div
                className={`font-semibold tabular-nums ${
                  selisih === 0
                    ? "text-success"
                    : selisih > 0
                      ? "text-info"
                      : "text-danger"
                }`}
              >
                {selisih > 0 ? "+" : ""}
                Rp {selisih.toLocaleString("id-ID")}
              </div>
            ) : (
              <div className="font-medium text-muted-fg">—</div>
            )}
          </div>
        </div>

        {!txQ.isLoading && !canCompute ? (
          <Alert tone="warning" statusRole>
            Selisih belum dapat dihitung otomatis (agregat transaksi hari ini tak tersedia). Hitung
            manual, isi catatan kondisi kas, dan minta supervisor verifikasi fisik.
          </Alert>
        ) : null}

        <div className="space-y-1.5">
          <div className="text-sm font-medium">Rincian Denominasi Akhir</div>
          {loading ? (
            <div className="py-6 text-center text-xs text-muted-fg">Memuat denominasi…</div>
          ) : (
            <DenominasiTable rows={rows} onChange={setRows} />
          )}
        </div>

        <FormSection
          title="Catatan"
          description="Keterangan selisih kas. Approval dilakukan supervisor dari halaman Kas Teller."
        >
          <FormField
            label="Catatan Selisih"
            className="col-span-2"
            {...(selisih !== 0 ? { required: true } : {})}
            hint={selisih === 0 ? "Opsional." : "Wajib diisi karena selisih ≠ 0."}
          >
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={3}
              placeholder="Misal: kelebihan setoran teller, kekurangan uang receh, dll."
            />
          </FormField>
        </FormSection>

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || loading}>
            {submitting ? "Menyimpan..." : "Ajukan Tutup Kas"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
