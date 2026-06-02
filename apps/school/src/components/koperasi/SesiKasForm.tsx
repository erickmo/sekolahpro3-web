import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  Textarea,
  type SearchableOption,
} from "@sekolahpro/ui";
import {
  listResource,
  useResourceCreate,
  useResourceList,
  useResourceUpdate,
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

/**
 * Form Buka/Tutup Sesi Kas Teller.
 *
 * Source schema: docs/domains/koperasi/entities/sesi-kas-teller.html
 * Replaces `alert("Form buka sesi kas (P2)")` stub di koperasi.kas-teller.tsx.
 */

const DEFAULT_NOMINAL: number[] = [
  100_000, 50_000, 20_000, 10_000, 5_000, 2_000, 1_000, 500, 200, 100,
];

const SHIFTS: Shift[] = ["Pagi", "Siang", "Sore"];

function emptyDenominasi(): DenominasiItem[] {
  return DEFAULT_NOMINAL.map((nominal) => ({ nominal, jumlah: 0 }));
}

/** Async loader for the supervisor (User) link field. */
async function searchSupervisor(q: string): Promise<SearchableOption[]> {
  const rows = await listResource<Record<string, string>>("User", {
    fields: ["name", "full_name"],
    filters: [["enabled", "=", 1]],
    ...(q
      ? {
          or_filters: [
            ["name", "like", `%${q}%`],
            ["full_name", "like", `%${q}%`],
          ] as [string, string, unknown][],
        }
      : {}),
    limit_page_length: 20,
    order_by: "full_name asc",
  });
  return rows.map((u) => ({
    value: u.name ?? "",
    label: u.full_name ? `${u.full_name} (${u.name})` : (u.name ?? ""),
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

function DenominasiTable({
  rows,
  onChange,
}: {
  rows: DenominasiItem[];
  onChange: (next: DenominasiItem[]) => void;
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
            <tr key={r.nominal}>
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
        </tbody>
        <tfoot className="border-t border-border bg-muted/40">
          <tr>
            <td colSpan={2} className="px-3 py-2 text-right font-medium">
              Total
            </td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">
              Rp {computeTotalDenominasi(rows).toLocaleString("id-ID")}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function BukaSesiForm({ onClose, onSuccess }: BukaProps) {
  const session = useSession();
  const [shift, setShift] = useState<Shift>("Pagi");
  const [modalKas, setModalKas] = useState<number>(0);
  const [denominasi, setDenominasi] = useState<DenominasiItem[]>(emptyDenominasi);
  const [error, setError] = useState<string | null>(null);
  const createMut = useResourceCreate("Sesi Kas Teller");

  const filledDenominasi = useMemo(
    () => denominasi.filter((d) => d.jumlah > 0),
    [denominasi],
  );

  const handleSubmit = () => {
    const err = validateBukaSesi({ shift, modalKas, denominasiBuka: filledDenominasi });
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    createMut.mutate(
      {
        teller: session.user,
        shift,
        modal_kas: modalKas,
        denominasi_buka: filledDenominasi.map((d) => ({
          nominal: d.nominal,
          jumlah: d.jumlah,
        })),
        status: "Aktif",
      },
      {
        onSuccess: () => onSuccess?.(),
        onError: (e) => setError(e.message),
      },
    );
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
          description="Shift dan modal kas awal teller."
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
        </FormSection>

        <div className="space-y-1.5">
          <div className="text-sm font-medium">Rincian Denominasi Awal</div>
          <DenominasiTable rows={denominasi} onChange={setDenominasi} />
        </div>

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={createMut.isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={createMut.isPending}>
            {createMut.isPending ? "Menyimpan..." : "Buka Sesi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TutupSesiForm({ sesi, onClose, onSuccess }: TutupProps) {
  const [denominasi, setDenominasi] = useState<DenominasiItem[]>(emptyDenominasi);
  const [catatan, setCatatan] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateMut = useResourceUpdate("Sesi Kas Teller");

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

  const filled = useMemo(() => denominasi.filter((d) => d.jumlah > 0), [denominasi]);
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

  const handleSubmit = () => {
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
    if (!supervisor) {
      setError("Pilih supervisor untuk approval tutup kas.");
      return;
    }
    setError(null);
    updateMut.mutate(
      {
        name: sesi.name,
        patch: {
          denominasi_tutup: filled.map((d) => ({
            nominal: d.nominal,
            jumlah: d.jumlah,
          })),
          catatan_selisih: catatan,
          supervisor_tutup: supervisor,
          status: "Pending Approval",
        },
      },
      {
        onSuccess: () => onSuccess?.(),
        onError: (e) => setError(e.message),
      },
    );
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
          <DenominasiTable rows={denominasi} onChange={setDenominasi} />
        </div>

        <FormSection
          title="Persetujuan & Catatan"
          description="Supervisor approval dan keterangan selisih."
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

          <FormField label="Supervisor untuk Approval" required className="col-span-2">
            <SearchableSelect
              value={supervisor}
              onChange={(v) => setSupervisor(v)}
              placeholder="Cari supervisor…"
              loadOptions={searchSupervisor}
            />
          </FormField>
        </FormSection>

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={updateMut.isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={updateMut.isPending}>
            {updateMut.isPending ? "Menyimpan..." : "Ajukan Tutup Kas"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
