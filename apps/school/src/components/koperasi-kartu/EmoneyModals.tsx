import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  FormField,
  FormGrid,
  Input,
  Modal,
  Select,
} from "@sekolahpro/ui";
import { useResourceCreate } from "@sekolahpro/api-client";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  defaultKartu?: string;
  onCreated?: (name: string) => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TopUpModal({ open, onClose, defaultKartu = "", onCreated }: BaseProps) {
  const [kartu, setKartu] = useState(defaultKartu);
  const [nominal, setNominal] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [metode, setMetode] = useState("Tunai");
  const [err, setErr] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Top Up");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!kartu.trim()) errs.kartu = "Wajib";
    const n = Number(nominal);
    if (!n || n <= 0) errs.nominal = "Harus > 0";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    create.mutate(
      { kartu: kartu.trim(), nominal: n, tanggal, metode },
      {
        onSuccess: (doc) => {
          void qc.invalidateQueries({ queryKey: ["resource:list", "Top Up"] });
          void qc.invalidateQueries({ queryKey: ["resource:list", "Transaksi Kartu"] });
          onCreated?.(doc.name);
          onClose();
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Top-up Kartu" description="Catat top-up saldo e-money." size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={create.isPending} onClick={(e) => submit(e as unknown as FormEvent)}>
            {create.isPending ? "Menyimpan..." : "Top-up"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Kartu" required error={err.kartu}>
            <Input value={kartu} onChange={(e) => setKartu(e.target.value)} />
          </FormField>
          <FormField label="Nominal" required error={err.nominal}>
            <Input inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Tanggal" required>
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </FormField>
          <FormField label="Metode" required>
            <Select value={metode} onChange={(e) => setMetode(e.target.value)}>
              {["Tunai", "Transfer", "QRIS", "Voucher"].map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </FormField>
        </FormGrid>
        {create.isError ? <p className="text-xs text-rose-600">{(create.error as Error).message}</p> : null}
      </form>
    </Modal>
  );
}

interface TrxProps extends BaseProps {
  jenis: "Bayar" | "Refund";
  title: string;
}

export function TransaksiKartuModal({ open, onClose, defaultKartu = "", jenis, title, onCreated }: TrxProps) {
  const [kartu, setKartu] = useState(defaultKartu);
  const [nominal, setNominal] = useState("");
  const [merchant, setMerchant] = useState("");
  const [terminal, setTerminal] = useState("");
  const [tanggal, setTanggal] = useState(todayStr());
  const [err, setErr] = useState<Record<string, string>>({});
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>("Transaksi Kartu");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!kartu.trim()) errs.kartu = "Wajib";
    const n = Number(nominal);
    if (!n || n <= 0) errs.nominal = "Harus > 0";
    if (Object.keys(errs).length) { setErr(errs); return; }
    setErr({});
    const payload: Record<string, unknown> = {
      kartu: kartu.trim(),
      jenis,
      nominal: n,
      tanggal,
    };
    if (merchant.trim()) payload["merchant"] = merchant.trim();
    if (terminal.trim()) payload["terminal"] = terminal.trim();
    create.mutate(payload, {
      onSuccess: (doc) => {
        void qc.invalidateQueries({ queryKey: ["resource:list", "Transaksi Kartu"] });
        onCreated?.(doc.name);
        onClose();
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={create.isPending} onClick={(e) => submit(e as unknown as FormEvent)}>
            {create.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FormGrid cols={2}>
          <FormField label="Kartu" required error={err.kartu}>
            <Input value={kartu} onChange={(e) => setKartu(e.target.value)} />
          </FormField>
          <FormField label="Nominal" required error={err.nominal}>
            <Input inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Merchant">
            <Input value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          </FormField>
          <FormField label="Terminal">
            <Input value={terminal} onChange={(e) => setTerminal(e.target.value)} />
          </FormField>
          <FormField label="Tanggal" required>
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
          </FormField>
        </FormGrid>
        {create.isError ? <p className="text-xs text-rose-600">{(create.error as Error).message}</p> : null}
      </form>
    </Modal>
  );
}
