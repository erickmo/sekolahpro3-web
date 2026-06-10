/**
 * PesanWaliComposer — the Guru roster-inline composer (Guru tournament winner: a
 * message to a wali is born on the teaching surface, not in an inbox). Hosted by
 * the StudentSheet slide-over on /kelas/saya.
 *
 * Inserts ONE `Pesan Wali` doc with the authoring fields only — the BE controller
 * (pesan_wali.py) defaults guru/thread_key/wali_phone/status and fans out the
 * Mobile Outbox row itself, so this component never writes the Outbox. Channel is
 * derived from the primary wali phone (WA when present, InApp otherwise) and the
 * post-send label keeps the honest-delivery vocabulary from lib/pesan/compose.ts.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResourceCreate } from "@sekolahpro/api-client";
import { Button } from "@sekolahpro/ui";
import {
  PESAN_WALI_KATEGORI,
  buildPesanWaliDoc,
  canSendPesanWali,
  pesanWaliChannel,
  pesanWaliSentLabel,
  type PesanWaliKategori,
} from "../../lib/pesan/compose";

const PESAN_WALI_DOCTYPE = "Pesan Wali";
const KATEGORI_DEFAULT: PesanWaliKategori = "Umum";

export interface PesanWaliComposerProps {
  /** Siswa doc name the message is about (the thread anchor). */
  siswa: string;
  /** Active Rombongan Belajar doc name (the roster the message was born on). */
  rombel: string;
  /** Primary wali phone — decides the WA vs InApp channel; never sent to the BE
   * (the controller snapshots the phone itself). */
  waliPhone?: string | null | undefined;
}

export function PesanWaliComposer({ siswa, rombel, waliPhone }: PesanWaliComposerProps) {
  const qc = useQueryClient();
  const create = useResourceCreate<{ name: string }>(PESAN_WALI_DOCTYPE);

  const [kategori, setKategori] = useState<PesanWaliKategori>(KATEGORI_DEFAULT);
  const [isi, setIsi] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const channel = pesanWaliChannel(waliPhone);
  const canSend = canSendPesanWali(siswa, isi) && !create.isPending;

  /** Insert the doc, then refresh every Pesan Wali list (prefix-matches the
   * ["resource:list", doctype, tenantKey, params] query key, so TindakLanjutSaya
   * picks the new thread up regardless of its params/tenant segments). */
  async function send() {
    setErr(null);
    setSent(null);
    try {
      await create.mutateAsync(buildPesanWaliDoc({ siswa, rombel, kategori, isi, channel }));
      setIsi("");
      setSent(pesanWaliSentLabel(channel));
      qc.invalidateQueries({ queryKey: ["resource:list", PESAN_WALI_DOCTYPE] });
    } catch (e) {
      setErr((e as Error)?.message ?? "Gagal mengirim pesan.");
    }
  }

  const inputCls = "rounded-md border border-border bg-bg px-2 py-1.5 text-sm";

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-fg">
        Kirim Pesan ke Wali
      </div>

      <select
        value={kategori}
        onChange={(e) => setKategori(e.target.value as PesanWaliKategori)}
        className={inputCls}
        aria-label="Kategori pesan"
      >
        {PESAN_WALI_KATEGORI.map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>

      <textarea
        value={isi}
        onChange={(e) => setIsi(e.target.value)}
        placeholder="Tulis pesan untuk wali…"
        rows={3}
        className={`${inputCls} w-full`}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-fg">
          {waliPhone
            ? `Via WhatsApp ke ${waliPhone}`
            : "Wali belum punya nomor — pesan tampil di aplikasi wali."}
        </span>
        <Button size="sm" disabled={!canSend} onClick={send}>
          {create.isPending ? "Mengirim…" : "Kirim"}
        </Button>
      </div>

      {sent ? <div className="text-xs font-medium text-emerald-600">{sent}</div> : null}
      {err ? (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </div>
      ) : null}
    </div>
  );
}
