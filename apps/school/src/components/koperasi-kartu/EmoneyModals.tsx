import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  FormField,
  Input,
  Modal,
  SearchableSelect,
} from "@sekolahpro/ui";
import {
  humanizeFrappeError,
  listResource,
  useResourceCreate,
} from "@sekolahpro/api-client";
import { FormSection } from "../shared/FormSection";
import { searchLink } from "../shared/searchLink";

// Backend Top Up limits (top_up.py _MIN_NOMINAL/_MAX_NOMINAL) — mirrored for
// instant feedback; the controller still enforces them server-side.
const TOPUP_MIN = 1_000;
const TOPUP_MAX = 10_000_000;

// Exact backend Select values.
const TOPUP_TIPE_MANUAL = "manual";
const TRX_STATUS_SUKSES = "sukses";

/** Async loader for the Kartu link field — label by NFC UID. */
function loadKartu(q: string, extraFilters?: Array<[string, string, unknown]>) {
  return searchLink("Kartu", "uid_nfc", q, extraFilters);
}

interface BaseProps {
  open: boolean;
  onClose: () => void;
  defaultKartu?: string;
  onCreated?: (name: string) => void;
}

interface WalletRow {
  name: string;
  kartu: string;
  saldo?: number;
  batas_saldo?: number;
  rekening_sumber?: string | null;
}

/**
 * Top-up e-money wallet. The operator picks a Kartu (emoney type); the modal
 * resolves its E-Money Wallet, then inserts a Top Up
 * { wallet, nominal, tipe: "manual", status: "sukses", sumber? }.
 * The Top Up controller applies the balance movement on insert.
 * Sumber dana eksplisit: Tunai (tanpa debit rekening) atau Rekening Simpanan.
 */
export function TopUpModal({ open, onClose, defaultKartu = "", onCreated }: BaseProps) {
  const [kartu, setKartu] = useState(defaultKartu);
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [walletMissing, setWalletMissing] = useState(false);
  const [nominal, setNominal] = useState("");
  const [sumberMode, setSumberMode] = useState<"tunai" | "rekening">("tunai");
  const [sumberRekening, setSumberRekening] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Top Up");

  // Resolve the wallet bound to the chosen kartu (1:1 — kartu is unique).
  useEffect(() => {
    let cancelled = false;
    setWallet(null);
    setWalletMissing(false);
    if (!kartu) return;
    void listResource<WalletRow>("E-Money Wallet", {
      fields: ["name", "kartu", "saldo", "batas_saldo", "rekening_sumber"],
      filters: [["kartu", "=", kartu]],
      limit_page_length: 1,
    }).then((rows) => {
      if (cancelled) return;
      const w = rows[0] ?? null;
      setWallet(w);
      setWalletMissing(!w);
      if (w?.rekening_sumber) {
        setSumberMode("rekening");
        setSumberRekening(w.rekening_sumber);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [kartu]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!kartu.trim()) errs.kartu = "Wajib";
    if (kartu && !wallet) errs.kartu = "Kartu ini belum memiliki wallet";
    const n = Number(nominal);
    if (!n || n < TOPUP_MIN) errs.nominal = `Minimal Rp ${TOPUP_MIN.toLocaleString("id-ID")}`;
    if (n > TOPUP_MAX) errs.nominal = `Maksimal Rp ${TOPUP_MAX.toLocaleString("id-ID")}`;
    if (sumberMode === "rekening" && !sumberRekening) errs.sumber = "Pilih rekening sumber";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    const payload: Record<string, unknown> = {
      wallet: wallet!.name,
      nominal: n,
      tipe: TOPUP_TIPE_MANUAL,
      status: TRX_STATUS_SUKSES,
    };
    if (sumberMode === "rekening") payload["sumber"] = sumberRekening;
    create.mutate(payload, {
      onSuccess: (doc) => {
        void qc.invalidateQueries({ queryKey: ["resource:list", "Top Up"] });
        void qc.invalidateQueries({ queryKey: ["resource:list", "E-Money Wallet"] });
        void qc.invalidateQueries({ queryKey: ["resource:list", "Rekening Simpanan"] });
        onCreated?.(doc.name);
        onClose();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Top-up Kartu" description="Isi saldo e-money wallet kartu. Tanda * wajib diisi." size="mega" tone="brand"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={create.isPending || !wallet} onClick={(e) => submit(e as unknown as FormEvent)}>
            {create.isPending ? "Menyimpan..." : "Top-up"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <FormSection
          title="Detail Top-up"
          description="Pilih kartu e-money dan tentukan nominal pengisian saldo."
        >
          <FormField label="Kartu" required error={err.kartu}>
            <SearchableSelect
              value={kartu}
              onChange={(v) => setKartu(v)}
              loadOptions={(q) => loadKartu(q, [["tipe_kartu", "=", "emoney"]])}
              placeholder="Cari kartu e-money…"
            />
          </FormField>
          <FormField
            label="Nominal"
            required
            error={err.nominal}
            hint={`Rp ${TOPUP_MIN.toLocaleString("id-ID")} – Rp ${TOPUP_MAX.toLocaleString("id-ID")}`}
          >
            <Input inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Sumber Dana" required>
            <SearchableSelect
              value={sumberMode}
              onChange={(v) => setSumberMode(v as "tunai" | "rekening")}
              options={[
                { value: "tunai", label: "Tunai (tanpa debit rekening)" },
                { value: "rekening", label: "Debit Rekening Simpanan" },
              ]}
              placeholder="— pilih —"
            />
          </FormField>
          {sumberMode === "rekening" ? (
            <FormField label="Rekening Sumber" required error={err.sumber}>
              <SearchableSelect
                value={sumberRekening}
                onChange={(v) => setSumberRekening(v)}
                loadOptions={(q) => searchLink("Rekening Simpanan", "name", q)}
                placeholder="Cari rekening…"
              />
            </FormField>
          ) : null}
        </FormSection>
        {walletMissing ? (
          <Alert tone="warning" statusRole>
            Kartu ini belum punya E-Money Wallet. Buat wallet dulu di halaman Wallet.
          </Alert>
        ) : null}
        {wallet ? (
          <p className="text-xs text-muted-fg">
            Wallet <span className="font-mono">{wallet.name}</span> · saldo Rp {(wallet.saldo ?? 0).toLocaleString("id-ID")} · batas Rp {(wallet.batas_saldo ?? 0).toLocaleString("id-ID")}
          </p>
        ) : null}
        {create.isError ? (
          <p className="text-xs text-rose-600">
            {humanizeFrappeError(create.error) ?? (create.error as Error).message}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

interface TrxProps extends BaseProps {
  /** Exact backend Transaksi Kartu tipe value. */
  tipe: "pembayaran" | "refund";
  title: string;
}

/**
 * Catat Transaksi Kartu (pembayaran/refund) — back-office manual entry.
 * Backend contract: { kartu*, tipe*, nominal*, status, terminal_id?, referensi }.
 * Refund WAJIB referensi (unik) per controller transaksi_kartu.py.
 */
export function TransaksiKartuModal({ open, onClose, defaultKartu = "", tipe, title, onCreated }: TrxProps) {
  const [kartu, setKartu] = useState(defaultKartu);
  const [nominal, setNominal] = useState("");
  const [terminalId, setTerminalId] = useState("");
  const [referensi, setReferensi] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Transaksi Kartu");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!kartu.trim()) errs.kartu = "Wajib";
    const n = Number(nominal);
    if (!n || n <= 0) errs.nominal = "Harus > 0";
    if (tipe === "refund" && !referensi.trim()) errs.referensi = "Wajib untuk refund (nilai unik)";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    const payload: Record<string, unknown> = {
      kartu: kartu.trim(),
      tipe,
      nominal: n,
      status: TRX_STATUS_SUKSES,
    };
    if (terminalId.trim()) payload["terminal_id"] = terminalId.trim();
    if (referensi.trim()) payload["referensi"] = referensi.trim();
    create.mutate(payload, {
      onSuccess: (doc) => {
        void qc.invalidateQueries({ queryKey: ["resource:list", "Transaksi Kartu"] });
        void qc.invalidateQueries({ queryKey: ["resource:list", "E-Money Wallet"] });
        onCreated?.(doc.name);
        onClose();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} description="Tanda * wajib diisi." size="mega" tone="brand"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={create.isPending} onClick={(e) => submit(e as unknown as FormEvent)}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <FormSection
          title="Detail Transaksi"
          description="Kartu, nominal, dan referensi transaksi e-money."
        >
          <FormField label="Kartu" required error={err.kartu}>
            <SearchableSelect
              value={kartu}
              onChange={(v) => setKartu(v)}
              loadOptions={(q) => loadKartu(q)}
              placeholder="Cari kartu…"
            />
          </FormField>
          <FormField label="Nominal" required error={err.nominal}>
            <Input inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Terminal ID">
            <Input value={terminalId} onChange={(e) => setTerminalId(e.target.value)} />
          </FormField>
          <FormField label="Referensi" {...(tipe === "refund" ? { required: true } : {})} error={err.referensi}
            hint={tipe === "refund" ? "Nomor referensi baru yang unik (bukan referensi transaksi asal)." : "Opsional — nomor referensi unik."}
          >
            <Input value={referensi} onChange={(e) => setReferensi(e.target.value)} />
          </FormField>
        </FormSection>
        {create.isError ? (
          <p className="text-xs text-rose-600">
            {humanizeFrappeError(create.error) ?? (create.error as Error).message}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
