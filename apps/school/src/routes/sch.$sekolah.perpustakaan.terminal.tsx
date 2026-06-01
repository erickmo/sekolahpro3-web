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
 * Tidak ada hardware integration nyata di UI ini — diasumsikan
 * keyboard-wedge scanner (input keydown event seperti keyboard biasa).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Button, IconBook, IconCheck, IconAlert } from "@sekolahpro/ui";
import { createResource, listResource } from "@sekolahpro/api-client";
import { PerpPageGuide } from "../components/perpustakaan/PerpPageGuide";

type Mode = "idle" | "anggota_resolved" | "processing";

type Anggota = {
  name: string;
  nama_lengkap?: string;
  tipe_anggota?: string;
  status?: string;
  jumlah_pinjam_aktif?: number;
};

type LogEntry = {
  ts: number;
  kind: "info" | "success" | "error";
  message: string;
};

const FEEDBACK_MS = 2500;

function beep(freq: number, ms: number) {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.value = 0.15;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close().catch(() => undefined);
    }, ms);
  } catch {
    // Audio not available; silent fail.
  }
}

function beepSuccess() { beep(880, 120); }
function beepError() { beep(220, 250); }

function TerminalPage() {
  const [mode, setMode] = useState<Mode>("idle");
  const [anggota, setAnggota] = useState<Anggota | null>(null);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastEvent, setLastEvent] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEventTimer = useRef<number | null>(null);

  // Re-focus input setiap render untuk keep scanner ready.
  useEffect(() => {
    inputRef.current?.focus();
  });

  const pushLog = useCallback((kind: LogEntry["kind"], message: string) => {
    setLog((prev) => [{ ts: Date.now(), kind, message }, ...prev].slice(0, 30));
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
    const kartu = await listResource<{ name: string; siswa?: string; anggota?: string }>("Koperasi Kartu", {
      fields: ["name", "siswa", "anggota"],
      or_filters: [["name", "=", rfid], ["nomor_kartu", "=", rfid]] as [string, string, unknown][],
      limit_page_length: 1,
    });
    const k = kartu[0];
    if (!k) return null;
    const linkField = k.siswa ?? k.anggota;
    if (!linkField) return null;
    const ap = await listResource<Anggota>("Anggota Perpustakaan", {
      fields: ["name", "nama_lengkap", "tipe_anggota", "status", "jumlah_pinjam_aktif"],
      filters: { siswa: linkField } as Record<string, unknown>,
      limit_page_length: 1,
    });
    return ap[0] ?? null;
  };

  const resolveAnggotaDirect = async (code: string): Promise<Anggota | null> => {
    const rows = await listResource<Anggota>("Anggota Perpustakaan", {
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
        "Eksemplar Buku",
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
      const aktif = await listResource<{ name: string; anggota: string }>("Peminjaman Buku", {
        fields: ["name", "anggota"],
        filters: { status: "Aktif", anggota: anggota.name } as Record<string, unknown>,
        or_filters: [["items.eksemplar", "=", ek.name]] as [string, string, unknown][],
        limit_page_length: 1,
      });
      if (aktif.length > 0) {
        await createResource("Pengembalian Buku", {
          peminjaman: aktif[0]!.name,
          tanggal_kembali_aktual: new Date().toISOString().slice(0, 10),
          terminal_id: "RFID-TERM",
          docstatus: 1,
        });
        flashEvent("success", `Kembali: ${ek.nomor_inventaris ?? ek.name}`);
        pushLog("success", `Kembali ${ek.name} oleh ${anggota.name}`);
        return;
      }
      if (ek.status && ek.status !== "Tersedia") {
        flashEvent("error", `${ek.nomor_inventaris ?? ek.name} status ${ek.status}`);
        pushLog("error", `Eksemplar ${ek.name} status ${ek.status}`);
        return;
      }
      // Pinjam baru
      const today = new Date();
      const due = new Date(today);
      due.setDate(due.getDate() + 7);
      await createResource("Peminjaman Buku", {
        anggota: anggota.name,
        tanggal_pinjam: today.toISOString().slice(0, 10),
        tanggal_kembali_rencana: due.toISOString().slice(0, 10),
        status: "Aktif",
        terminal_id: "RFID-TERM",
        items: [{ eksemplar: ek.name, nomor_inventaris: ek.nomor_inventaris ?? "", judul_buku: ek.buku ?? "" }],
        docstatus: 1,
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

  const latencyTone = useMemo<"success" | "warning" | "danger">(() => {
    if (latencyMs === null) return "success";
    if (latencyMs < 500) return "success";
    if (latencyMs < 1000) return "warning";
    return "danger";
  }, [latencyMs]);

  return (
    <div className="space-y-4">
      <PerpPageGuide id="terminal" />
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
              <IconBook />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-fg">Terminal Sirkulasi RFID</h1>
              <p className="text-xs text-muted-fg">Mode kios untuk scan kartu + eksemplar.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={latencyTone} dot>
              {latencyMs !== null ? `${latencyMs} ms` : "siap"}
            </Badge>
            <Button variant="outline" onClick={reset}>Reset Sesi</Button>
          </div>
        </div>
      </div>

      {lastEvent ? (
        <div
          className={
            "rounded-xl border p-6 text-center transition " +
            (lastEvent.kind === "success"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
              : "border-rose-500/50 bg-rose-500/10 text-rose-700")
          }
        >
          <div className="mx-auto inline-flex h-10 w-10 items-center justify-center">
            {lastEvent.kind === "success" ? <IconCheck /> : <IconAlert />}
          </div>
          <div className="mt-2 text-2xl font-semibold">{lastEvent.message}</div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-fg">
              {mode === "idle" ? "Langkah 1" : "Langkah 2"}
            </div>
            <div className="mt-1 text-xl font-semibold text-fg">
              {mode === "idle" ? "Scan kartu anggota" : "Scan eksemplar buku"}
            </div>
          </div>
          {anggota ? (
            <div className="text-right">
              <div className="text-xs text-muted-fg">Anggota Aktif</div>
              <div className="font-medium text-fg">{anggota.nama_lengkap ?? anggota.name}</div>
              <div className="text-xs text-muted-fg">
                {anggota.tipe_anggota ?? "—"} · {anggota.jumlah_pinjam_aktif ?? 0} aktif
              </div>
            </div>
          ) : null}
        </div>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder={mode === "idle" ? "Scan kartu RFID…" : "Scan eksemplar…"}
          disabled={mode === "processing"}
          className="w-full rounded-md border border-border bg-base px-4 py-4 text-center text-2xl tabular-nums tracking-wider text-fg shadow-inner focus:border-brand focus:outline-none"
        />
        <p className="mt-2 text-center text-xs text-muted-fg">
          Mode keyboard-wedge: scan otomatis menekan Enter setelah kode.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 text-sm font-medium text-fg">Log Aktivitas</div>
        {log.length === 0 ? (
          <div className="text-xs text-muted-fg">— belum ada aktivitas —</div>
        ) : (
          <ul className="space-y-1 text-xs">
            {log.map((l, i) => (
              <li key={i} className="flex items-center gap-2 font-mono">
                <span className="text-muted-fg">{new Date(l.ts).toLocaleTimeString("id-ID")}</span>
                <Badge tone={l.kind === "success" ? "success" : l.kind === "error" ? "danger" : "neutral"} dot>
                  {l.kind}
                </Badge>
                <span className="text-fg">{l.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/perpustakaan/terminal")({ component: TerminalPage });
