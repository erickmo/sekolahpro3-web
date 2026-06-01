/**
 * RFID Terminal — full-screen self-service terminal untuk pustakawan.
 *
 * Pola interaksi:
 *  1) Pustakawan scan kartu RFID anggota → resolve ke Anggota Perpustakaan
 *     via Koperasi Kartu (event listener `koperasi.kartu.diterbitkan` jaga sync).
 *  2) Display profile anggota + status (Aktif / Dibekukan / denda outstanding).
 *  3) Scan eksemplar → otomatis tentukan aksi:
 *     - Eksemplar Tersedia + anggota tidak punya pinjaman → Pinjam.
 *     - Eksemplar Dipinjam oleh anggota ini → Kembalikan.
 *  4) Audio feedback (Web Audio API): success beep, error buzz.
 *  5) Target latensi <500ms (NFR spec.html).
 *
 * Sirkulasi (pinjam & kembali) ditulis lewat insert→submit agar on_submit
 * jalan — sejalan dengan unifikasi sirkulasi PERP-ADR-0001 (lihat PERP-GAP-02).
 *
 * Tidak ada hardware integration nyata di UI ini — diasumsikan
 * keyboard-wedge scanner (input keydown event seperti keyboard biasa).
 *
 * Layer: route. Owns scan state + circulation mutations; the scan surface and
 * activity log are extracted into presentational components.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { listResource } from "@sekolahpro/api-client";
import { insertAndSubmit, determineScanAction } from "../components/perpustakaan/circulation";
import { PerpPageGuide } from "../components/perpustakaan/PerpPageGuide";
import {
  TerminalScanPanel,
  beepSuccess,
  beepError,
  type Anggota,
  type Mode,
  type FlashEvent,
} from "../components/perpustakaan/TerminalScanPanel";
import { TerminalActivityLog, type LogEntry } from "../components/perpustakaan/TerminalActivityLog";

const FEEDBACK_MS = 2500;
/** Individual terminal loan window in days (cf. kolektif's 14 — intentionally shorter). */
const LOAN_PERIOD_DAYS = 7;
/** Max recent scan-log entries retained in the on-screen history. */
const LOG_HISTORY_MAX = 30;

/** Frappe doctypes touched by the terminal. */
const DOCTYPE_KARTU = "Koperasi Kartu";
const DOCTYPE_ANGGOTA = "Anggota Perpustakaan";
const DOCTYPE_EKSEMPLAR = "Eksemplar Buku";
const DOCTYPE_PEMINJAMAN = "Peminjaman Buku";
const DOCTYPE_PENGEMBALIAN = "Pengembalian Buku";
/** terminal_id field value stamped on records created from this kiosk. */
const TERMINAL_ID = "RFID-TERM";
const STATUS_AKTIF = "Aktif";
const STATUS_TERSEDIA = "Tersedia";

function TerminalPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const [anggota, setAnggota] = useState<Anggota | null>(null);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastEvent, setLastEvent] = useState<FlashEvent | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEventTimer = useRef<number | null>(null);

  // Re-focus input setiap render untuk keep scanner ready.
  useEffect(() => {
    inputRef.current?.focus();
  });

  const pushLog = useCallback((kind: LogEntry["kind"], message: string) => {
    setLog((prev) => [{ ts: Date.now(), kind, message }, ...prev].slice(0, LOG_HISTORY_MAX));
  }, []);

  const flashEvent = (kind: "success" | "error", message: string) => {
    setLastEvent({ kind, message });
    if (lastEventTimer.current) window.clearTimeout(lastEventTimer.current);
    lastEventTimer.current = window.setTimeout(() => setLastEvent(null), FEEDBACK_MS);
    if (kind === "success") beepSuccess();
    else beepError();
  };

  const resolveAnggotaFromKartu = async (rfid: string): Promise<Anggota | null> => {
    // Cari kartu Koperasi → ambil anggota → cari Anggota Perpustakaan via siswa.
    const kartu = await listResource<{ name: string; siswa?: string; anggota?: string }>(DOCTYPE_KARTU, {
      fields: ["name", "siswa", "anggota"],
      or_filters: [["name", "=", rfid], ["nomor_kartu", "=", rfid]] as [string, string, unknown][],
      limit_page_length: 1,
    });
    const k = kartu[0];
    if (!k) return null;
    const linkField = k.siswa ?? k.anggota;
    if (!linkField) return null;
    const ap = await listResource<Anggota>(DOCTYPE_ANGGOTA, {
      fields: ["name", "nama_lengkap", "tipe_anggota", "status", "jumlah_pinjam_aktif"],
      filters: { siswa: linkField } as Record<string, unknown>,
      limit_page_length: 1,
    });
    return ap[0] ?? null;
  };

  const resolveAnggotaDirect = async (code: string): Promise<Anggota | null> => {
    const rows = await listResource<Anggota>(DOCTYPE_ANGGOTA, {
      fields: ["name", "nama_lengkap", "tipe_anggota", "status", "jumlah_pinjam_aktif"],
      or_filters: [["name", "=", code], ["nomor_anggota", "=", code]] as [string, string, unknown][],
      limit_page_length: 1,
    });
    return rows[0] ?? null;
  };

  const handleAnggotaScan = async (code: string) => {
    const start = performance.now();
    setMode("processing");
    try {
      let a = await resolveAnggotaDirect(code);
      if (!a) a = await resolveAnggotaFromKartu(code);
      if (!a) {
        flashEvent("error", `Anggota tidak ditemukan: ${code}`);
        pushLog("error", `Anggota tidak ditemukan: ${code}`);
        setMode("idle");
        return;
      }
      if (a.status && a.status !== "Aktif") {
        flashEvent("error", `${a.nama_lengkap ?? a.name} — status ${a.status}`);
        pushLog("error", `Anggota ${a.name} status ${a.status}`);
        setMode("idle");
        return;
      }
      setAnggota(a);
      setMode("anggota_resolved");
      flashEvent("success", `Halo, ${a.nama_lengkap ?? a.name}`);
      pushLog("info", `Anggota resolved: ${a.name}`);
    } catch (e) {
      flashEvent("error", e instanceof Error ? e.message : "Gagal resolve anggota.");
      setMode("idle");
    } finally {
      setLatencyMs(Math.round(performance.now() - start));
    }
  };

  const handleEksemplarScan = async (code: string) => {
    if (!anggota) return;
    const start = performance.now();
    setMode("processing");
    try {
      const rows = await listResource<{ name: string; status?: string; buku?: string; nomor_inventaris?: string }>(
        DOCTYPE_EKSEMPLAR,
        {
          fields: ["name", "status", "buku", "nomor_inventaris"],
          or_filters: [["name", "=", code], ["nomor_inventaris", "=", code]] as [string, string, unknown][],
          limit_page_length: 1,
        },
      );
      const ek = rows[0];
      if (!ek) {
        flashEvent("error", `Eksemplar tidak ditemukan: ${code}`);
        pushLog("error", `Eksemplar tidak ditemukan: ${code}`);
        return;
      }
      // Cek apakah eksemplar ini sedang dipinjam oleh anggota ini → return flow
      const aktif = await listResource<{ name: string; anggota: string }>(DOCTYPE_PEMINJAMAN, {
        fields: ["name", "anggota"],
        filters: { status: STATUS_AKTIF, anggota: anggota.name } as Record<string, unknown>,
        or_filters: [["items.eksemplar", "=", ek.name]] as [string, string, unknown][],
        limit_page_length: 1,
      });
      const action = determineScanAction(ek.status, aktif.length > 0, STATUS_TERSEDIA);
      if (action.kind === "return") {
        // insert→submit so on_submit runs (denda/eksemplar/reservasi). PERP-GAP-02
        await insertAndSubmit(DOCTYPE_PENGEMBALIAN, {
          peminjaman: aktif[0]!.name,
          tanggal_kembali_aktual: new Date().toISOString().slice(0, 10),
          terminal_id: TERMINAL_ID,
        });
        flashEvent("success", `Kembali: ${ek.nomor_inventaris ?? ek.name}`);
        pushLog("success", `Kembali ${ek.name} oleh ${anggota.name}`);
        return;
      }
      if (action.kind === "unavailable") {
        flashEvent("error", `${ek.nomor_inventaris ?? ek.name} status ${action.status}`);
        pushLog("error", `Eksemplar ${ek.name} status ${action.status}`);
        return;
      }
      // Pinjam baru
      const today = new Date();
      const due = new Date(today);
      due.setDate(due.getDate() + LOAN_PERIOD_DAYS);
      // insert→submit so the loan's on_submit checkout side-effects run. PERP-GAP-02
      await insertAndSubmit(DOCTYPE_PEMINJAMAN, {
        anggota: anggota.name,
        tanggal_pinjam: today.toISOString().slice(0, 10),
        tanggal_kembali_rencana: due.toISOString().slice(0, 10),
        status: STATUS_AKTIF,
        terminal_id: TERMINAL_ID,
        items: [{ eksemplar: ek.name, nomor_inventaris: ek.nomor_inventaris ?? "", judul_buku: ek.buku ?? "" }],
      });
      flashEvent("success", `Pinjam: ${ek.nomor_inventaris ?? ek.name}`);
      pushLog("success", `Pinjam ${ek.name} oleh ${anggota.name}`);
    } catch (e) {
      flashEvent("error", e instanceof Error ? e.message : "Gagal proses scan.");
    } finally {
      setLatencyMs(Math.round(performance.now() - start));
      setMode("anggota_resolved");
    }
  };

  const handleSubmit = async () => {
    const code = input.trim();
    if (!code) return;
    setInput("");
    if (mode === "idle") await handleAnggotaScan(code);
    else if (mode === "anggota_resolved") await handleEksemplarScan(code);
  };

  const reset = () => {
    setAnggota(null);
    setMode("idle");
    setLastEvent(null);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <PerpPageGuide id="terminal" />
      <TerminalScanPanel
        mode={mode}
        anggota={anggota}
        input={input}
        last_event={lastEvent}
        latency_ms={latencyMs}
        input_ref={inputRef}
        on_input_change={setInput}
        on_submit={() => void handleSubmit()}
        on_reset={reset}
      />
      <TerminalActivityLog log={log} />
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/terminal")({ component: TerminalPage });
