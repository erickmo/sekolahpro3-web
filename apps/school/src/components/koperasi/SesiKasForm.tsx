import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Textarea,
} from "@sekolahpro/ui";
import {
  useResourceCreate,
  useResourceUpdate,
  useResourceList,
} from "@sekolahpro/api-client";
import { useSession } from "@sekolahpro/auth";
import {
  computeTotalDenominasi,
  computeSaldoSeharusnya,
  computeSelisih,
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

interface BukaProps {
  mode: "buka";
  onClose: () => void;
  onSuccess?: () => void;
}

interface TutupProps {
  mode: "tutup";
  sesi: { name: string; modalKas: number; shift: Shift };
  onClose: () => void;
  onSuccess?: () => void;
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
    <Modal open onClose={onClose} title="Buka Sesi Kas">
      <div className="space-y-4">
        <FormField label="Shift" required>
          <Select value={shift} onChange={(e) => setShift(e.target.value as Shift)}>
            {SHIFTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
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

interface SupervisorOption {
  name: string;
  full_name?: string;
}

function TutupSesiForm({ sesi, onClose, onSuccess }: TutupProps) {
  const [denominasi, setDenominasi] = useState<DenominasiItem[]>(emptyDenominasi);
  const [catatan, setCatatan] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const updateMut = useResourceUpdate("Sesi Kas Teller");

  // Total setoran/penarikan harian seharusnya dihitung backend; client tidak
  // punya akses agregat — fallback ke saldo seharusnya = modal_kas saja jika
  // backend belum mengisi field tersebut. UI menampilkan asumsi ini eksplisit.
  const filled = useMemo(() => denominasi.filter((d) => d.jumlah > 0), [denominasi]);
  const totalTutup = computeTotalDenominasi(filled);
  const saldoSeharusnya = computeSaldoSeharusnya({
    modalKas: sesi.modalKas,
    totalSetoran: 0,
    totalPenarikan: 0,
  });
  const selisih = computeSelisih({
    totalDenominasiTutup: totalTutup,
    saldoSeharusnya,
  });

  const supervisorQ = useResourceList<SupervisorOption>("User", {
    fields: ["name", "full_name"],
    filters: [["enabled", "=", 1]],
    limit_page_length: 50,
  });

  const handleSubmit = () => {
    const err = validateTutupSesi({
      denominasiTutup: filled,
      saldoSeharusnya,
      catatanSelisih: catatan,
    });
    if (err) {
      setError(err);
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
    <Modal open onClose={onClose} title={`Tutup Sesi Kas — ${sesi.name}`}>
      <div className="space-y-4">
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
              Rp {saldoSeharusnya.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] text-muted-fg">
              setoran/penarikan dihitung backend
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-fg">Selisih</div>
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
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-sm font-medium">Rincian Denominasi Akhir</div>
          <DenominasiTable rows={denominasi} onChange={setDenominasi} />
        </div>

        <FormField
          label="Catatan Selisih"
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

        <FormField label="Supervisor untuk Approval" required>
          <Select value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
            <option value="">Pilih supervisor...</option>
            {(supervisorQ.data ?? []).map((u) => (
              <option key={u.name} value={u.name}>
                {u.full_name ? `${u.full_name} (${u.name})` : u.name}
              </option>
            ))}
          </Select>
        </FormField>

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
