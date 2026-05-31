import { useState, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  FormField,
  FormGrid,
  Input,
  Modal,
  SearchableSelect,
  type SearchableOption,
} from "@sekolahpro/ui";
import { listResource, useResourceCreate } from "@sekolahpro/api-client";

// E-money transactions stay near the present — narrow year range.
const MIN_YEAR = new Date().getFullYear() - 10;
const MAX_YEAR = new Date().getFullYear() + 1;

const METODE_OPTIONS = ["Tunai", "Transfer", "QRIS", "Voucher"];

interface BaseProps {
  open: boolean;
  onClose: () => void;
  defaultKartu?: string;
  onCreated?: (name: string) => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
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

/** Async loader for the Kartu link field — shared by both modals. */
function loadKartu(q: string): Promise<SearchableOption[]> {
  return searchLink("Kartu", "uid_rfid", q);
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
    <Modal open={open} onClose={onClose} title="Top-up Kartu" description="Catat top-up saldo e-money. Tanda * wajib diisi." size="mega" tone="brand"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={create.isPending} onClick={(e) => submit(e as unknown as FormEvent)}>
            {create.isPending ? "Menyimpan..." : "Top-up"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <FormSection
          title="Detail Top-up"
          description="Pilih kartu dan tentukan nominal pengisian saldo."
        >
          <FormField label="Kartu" required error={err.kartu}>
            <SearchableSelect
              value={kartu}
              onChange={(v) => setKartu(v)}
              loadOptions={loadKartu}
              placeholder="Cari kartu…"
            />
          </FormField>
          <FormField label="Nominal" required error={err.nominal}>
            <Input inputMode="numeric" value={nominal} onChange={(e) => setNominal(e.target.value.replace(/\D/g, ""))} />
          </FormField>
          <FormField label="Tanggal" required>
            <DatePicker
              value={tanggal}
              onChange={(v) => setTanggal(v)}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
          <FormField label="Metode" required>
            <SearchableSelect
              value={metode}
              onChange={(v) => setMetode(v)}
              options={METODE_OPTIONS.map((m) => ({ value: m, label: m }))}
              placeholder="— pilih —"
            />
          </FormField>
        </FormSection>
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
          description="Kartu, nominal, dan tanggal transaksi e-money."
        >
          <FormField label="Kartu" required error={err.kartu}>
            <SearchableSelect
              value={kartu}
              onChange={(v) => setKartu(v)}
              loadOptions={loadKartu}
              placeholder="Cari kartu…"
            />
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
            <DatePicker
              value={tanggal}
              onChange={(v) => setTanggal(v)}
              required
              captionLayout="dropdown-buttons"
              fromYear={MIN_YEAR}
              toYear={MAX_YEAR}
            />
          </FormField>
        </FormSection>
        {create.isError ? <p className="text-xs text-rose-600">{(create.error as Error).message}</p> : null}
      </form>
    </Modal>
  );
}
