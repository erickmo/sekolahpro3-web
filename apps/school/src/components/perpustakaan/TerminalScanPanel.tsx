/**
 * TerminalScanPanel — presentational scan surface for the RFID self-service
 * terminal. Renders the kiosk header (title + latency badge + reset), the
 * transient success/error flash banner, and the big keyboard-wedge scan input.
 *
 * Layer: presentational. It owns NO circulation state or I/O — the route owns
 * scan state + Frappe mutations and passes everything down as props. The only
 * logic kept here is pure presentation (latency tone) plus the Web Audio beep
 * feedback, which is a UI concern tied to the scan surface.
 */
import { useMemo, type ChangeEvent, type KeyboardEvent, type RefObject } from "react";
import { Badge, Button, IconBook, IconCheck, IconAlert } from "@sekolahpro/ui";

/** Scan round-trip latency tone thresholds; <500ms is the spec NFR target. */
const LATENCY_OK_MS = 500;
const LATENCY_WARN_MS = 1000;
/** Web Audio beep parameters for scan feedback. */
const BEEP_GAIN = 0.15;
const SUCCESS_BEEP_HZ = 880;
const SUCCESS_BEEP_MS = 120;
const ERROR_BEEP_HZ = 220;
const ERROR_BEEP_MS = 250;

/** Anggota profile shape needed by the panel header. */
export type Anggota = {
  name: string;
  nama_lengkap?: string;
  tipe_anggota?: string;
  status?: string;
  jumlah_pinjam_aktif?: number;
};

/** Terminal interaction mode driving prompt copy + input disabled state. */
export type Mode = "idle" | "anggota_resolved" | "processing";

/** Transient banner payload shown after each scan resolves. */
export type FlashEvent = { kind: "success" | "error"; message: string };

/**
 * Play a short Web Audio tone for scan feedback. Silent no-op when the
 * AudioContext is unavailable (e.g. autoplay-restricted environments).
 */
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
    gain.gain.value = BEEP_GAIN;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close().catch(() => undefined);
    }, ms);
  } catch {
    // Audio not available; silent fail.
  }
}

/** Success tone for resolved/borrow/return scans. */
export function beepSuccess() { beep(SUCCESS_BEEP_HZ, SUCCESS_BEEP_MS); }
/** Error tone for not-found / blocked / failed scans. */
export function beepError() { beep(ERROR_BEEP_HZ, ERROR_BEEP_MS); }

interface Props {
  mode: Mode;
  anggota: Anggota | null;
  input: string;
  last_event: FlashEvent | null;
  latency_ms: number | null;
  input_ref: RefObject<HTMLInputElement>;
  on_input_change: (value: string) => void;
  on_submit: () => void;
  on_reset: () => void;
}

/** Header card: kiosk title, live latency badge, and reset-session button. */
function TerminalHeader({ latency_ms, on_reset }: { latency_ms: number | null; on_reset: () => void }) {
  // Tone is pure presentation derived from the measured scan latency.
  const latency_tone = useMemo<"success" | "warning" | "danger">(() => {
    if (latency_ms === null) return "success";
    if (latency_ms < LATENCY_OK_MS) return "success";
    if (latency_ms < LATENCY_WARN_MS) return "warning";
    return "danger";
  }, [latency_ms]);
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
            <IconBook className="h-5 w-5 shrink-0" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-fg">Terminal Sirkulasi RFID</h1>
            <p className="text-xs text-muted-fg">Mode kios untuk scan kartu + eksemplar.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={latency_tone} dot>
            {latency_ms !== null ? `${latency_ms} ms` : "siap"}
          </Badge>
          <Button variant="outline" onClick={on_reset}>Reset Sesi</Button>
        </div>
      </div>
    </div>
  );
}

/** Big centered banner that flashes the outcome of the most recent scan. */
function FlashBanner({ last_event }: { last_event: FlashEvent }) {
  return (
    <div
      className={
        "rounded-xl border p-6 text-center transition " +
        (last_event.kind === "success"
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700"
          : "border-rose-500/50 bg-rose-500/10 text-rose-700")
      }
    >
      <div className="mx-auto inline-flex h-10 w-10 items-center justify-center">
        {last_event.kind === "success" ? <IconCheck className="h-8 w-8 shrink-0" /> : <IconAlert className="h-8 w-8 shrink-0" />}
      </div>
      <div className="mt-2 text-2xl font-semibold">{last_event.message}</div>
    </div>
  );
}

/** Active-anggota summary shown in the scan card while a member is resolved. */
function ActiveAnggota({ anggota }: { anggota: Anggota }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-fg">Anggota Aktif</div>
      <div className="font-medium text-fg">{anggota.nama_lengkap ?? anggota.name}</div>
      <div className="text-xs text-muted-fg">
        {anggota.tipe_anggota ?? "—"} · {anggota.jumlah_pinjam_aktif ?? 0} aktif
      </div>
    </div>
  );
}

/** Step indicator + keyboard-wedge scan input card. */
function ScanInputCard({
  mode,
  anggota,
  input,
  input_ref,
  on_input_change,
  on_submit,
}: {
  mode: Mode;
  anggota: Anggota | null;
  input: string;
  input_ref: RefObject<HTMLInputElement>;
  on_input_change: (value: string) => void;
  on_submit: () => void;
}) {
  const handle_change = (e: ChangeEvent<HTMLInputElement>) => on_input_change(e.target.value);
  const handle_key_down = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      on_submit();
    }
  };
  return (
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
        {anggota ? <ActiveAnggota anggota={anggota} /> : null}
      </div>
      <input
        ref={input_ref}
        autoFocus
        value={input}
        onChange={handle_change}
        onKeyDown={handle_key_down}
        placeholder={mode === "idle" ? "Scan kartu RFID…" : "Scan eksemplar…"}
        disabled={mode === "processing"}
        className="w-full rounded-md border border-border bg-base px-4 py-4 text-center text-2xl tabular-nums tracking-wider text-fg shadow-inner focus:border-brand focus:outline-none"
      />
      <p className="mt-2 text-center text-xs text-muted-fg">
        Mode keyboard-wedge: scan otomatis menekan Enter setelah kode.
      </p>
    </div>
  );
}

/**
 * Compose the full scan surface (header + flash banner + input card). All
 * state and callbacks come from the route; this component is pure UI.
 */
export function TerminalScanPanel({
  mode,
  anggota,
  input,
  last_event,
  latency_ms,
  input_ref,
  on_input_change,
  on_submit,
  on_reset,
}: Props) {
  return (
    <>
      <TerminalHeader latency_ms={latency_ms} on_reset={on_reset} />
      {last_event ? <FlashBanner last_event={last_event} /> : null}
      <ScanInputCard
        mode={mode}
        anggota={anggota}
        input={input}
        input_ref={input_ref}
        on_input_change={on_input_change}
        on_submit={on_submit}
      />
    </>
  );
}
