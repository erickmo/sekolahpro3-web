/**
 * Pengaturan PPDB — Singleton form (no list).
 *
 * Edit Pengaturan PPDB (singleton doctype) langsung: kebijakan minimum
 * pembayaran + konfigurasi gateway. Untuk Item Pembayaran PPDB (child),
 * link ke desk Frappe karena child doctype tidak ditampilkan terpisah.
 */

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";
import { useResourceDoc, useResourceUpdate } from "@sekolahpro/api-client";

type PengaturanDoc = {
  name: string;
  min_bayar_persen?: number;
  full_bayar_untuk?: string;
  wajib_seleksi_default?: number;
  wajib_daftar_ulang?: number;
  payment_gateway_provider?: string;
  payment_gateway_is_sandbox?: number;
  payment_gateway_api_key?: string;
  payment_gateway_secret?: string;
  format_no_pendaftaran?: string;
};

const SINGLETON = "Pengaturan PPDB";

function PengaturanPpdbPage() {
  const docQ = useResourceDoc<PengaturanDoc>(SINGLETON, SINGLETON);
  const update = useResourceUpdate<PengaturanDoc>(SINGLETON);

  const [draft, setDraft] = useState<Partial<PengaturanDoc>>({});
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (docQ.data) setDraft(docQ.data);
  }, [docQ.data]);

  const set = <K extends keyof PengaturanDoc>(k: K, v: PengaturanDoc[K]) => {
    setDraft((cur) => ({ ...cur, [k]: v }));
  };

  const save = async () => {
    setFeedback(null);
    try {
      await update.mutateAsync({ name: SINGLETON, patch: draft as Record<string, unknown> });
      setFeedback({ tone: "ok", msg: "Pengaturan tersimpan." });
      docQ.refetch();
    } catch (e) {
      setFeedback({ tone: "err", msg: (e as Error)?.message ?? "Gagal menyimpan." });
    }
  };

  if (docQ.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="PPDB" title="Pengaturan PPDB" />
        <SectionCard><p className="text-sm text-muted-fg">Memuat...</p></SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="PPDB"
        title="Pengaturan PPDB"
        description="Konfigurasi global modul PPDB: kebijakan pembayaran, format nomor, gateway."
        actions={
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        }
      />

      {feedback && (
        <div
          className={
            "rounded-md border px-3 py-2 text-sm " +
            (feedback.tone === "ok"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800")
          }
        >
          {feedback.msg}
        </div>
      )}

      <SectionCard title="Kebijakan Pendaftaran" description="Aturan minimum bayar & default workflow.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum Bayar (%)" hint="Persen pembayaran wajib sebelum bisa diajukan.">
            <input
              type="number"
              min={0}
              max={100}
              value={draft.min_bayar_persen ?? ""}
              onChange={(e) => set("min_bayar_persen", e.target.value ? Number(e.target.value) : undefined)}
              className={inputCls}
            />
          </Field>
          <Field label="Wajib Lunas Saat" hint="Tahapan dimana lunas dipaksakan (mis. Diterima).">
            <input
              value={draft.full_bayar_untuk ?? ""}
              onChange={(e) => set("full_bayar_untuk", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Format No. Pendaftaran" hint="Pola naming Pendaftaran PPDB (mis. PPDB-.YYYY.-.####.)">
            <input
              value={draft.format_no_pendaftaran ?? ""}
              onChange={(e) => set("format_no_pendaftaran", e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="space-y-2">
            <Toggle
              label="Wajib Seleksi (default)"
              checked={!!draft.wajib_seleksi_default}
              onChange={(v) => set("wajib_seleksi_default", v ? 1 : 0)}
            />
            <Toggle
              label="Wajib Daftar Ulang"
              checked={!!draft.wajib_daftar_ulang}
              onChange={(v) => set("wajib_daftar_ulang", v ? 1 : 0)}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Payment Gateway" description="Midtrans atau Xendit. Sandbox aktifkan untuk testing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Provider">
            <select
              value={draft.payment_gateway_provider ?? ""}
              onChange={(e) => set("payment_gateway_provider", e.target.value)}
              className={inputCls}
            >
              <option value="">— pilih —</option>
              <option value="Midtrans">Midtrans</option>
              <option value="Xendit">Xendit</option>
            </select>
          </Field>
          <Toggle
            label="Mode Sandbox"
            checked={!!draft.payment_gateway_is_sandbox}
            onChange={(v) => set("payment_gateway_is_sandbox", v ? 1 : 0)}
          />
          <Field label="API Key">
            <input
              value={draft.payment_gateway_api_key ?? ""}
              onChange={(e) => set("payment_gateway_api_key", e.target.value)}
              className={inputCls}
              autoComplete="off"
            />
          </Field>
          <Field label="API Secret">
            <input
              type="password"
              value={draft.payment_gateway_secret ?? ""}
              onChange={(e) => set("payment_gateway_secret", e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </Field>
        </div>
      </SectionCard>

      <p className="text-xs text-muted-fg">
        Item Pembayaran PPDB adalah <em>child table</em> di Pembayaran PPDB —
        kelola dari halaman <a href="/ppdb/pembayaran" className="text-brand hover:underline">Pembayaran</a>.
      </p>
    </div>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-bg px-3 text-sm focus:border-brand focus:outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-fg">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-fg">{hint}</span> : null}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm cursor-pointer hover:border-brand">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export const Route = createFileRoute("/ppdb/pengaturan")({ component: PengaturanPpdbPage });
