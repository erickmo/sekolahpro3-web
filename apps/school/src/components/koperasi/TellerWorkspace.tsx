import { useEffect, useMemo, useRef, useState } from "react";
import { useResourceList } from "@sekolahpro/api-client";
import { Alert, Button, Input } from "@sekolahpro/ui";
import { useGlobalHotkeys } from "../../hooks/useGlobalHotkeys";
import { useRfidListener } from "../../hooks/useRfidListener";
import { AnggotaContextCard, type AnggotaContext } from "./AnggotaContextCard";
import {
  ACTION_SALDO,
  ACTION_SETOR,
  ACTION_TARIK,
  ACTION_BAGI_HASIL,
  QuickActionGrid,
  type QuickAction,
} from "./QuickActionGrid";
import { TransaksiModal, type TransaksiJenis } from "../koperasi-simpanan/transaksiForm";

/**
 * Teller Workspace — full-screen mode dengan hotkey + RFID auto-lookup.
 *
 * Flow:
 *   1. Idle → user scan kartu (RFID burst → Enter) atau ketik nomor_anggota
 *      di search.
 *   2. Lookup chain: Kartu (by uid_nfc) → Anggota (linked) → Rekening Simpanan
 *      (filter nasabah, status Aktif, limit 1).
 *   3. Context filled → user tekan F2..F5 untuk action. Modal Transaksi
 *      muncul dengan rekening pre-filled.
 *   4. Esc → clear context. F-key tanpa context → toast warning.
 *
 * Component bersifat self-contained; konsumen cukup render dengan gating
 * sesi-aktif (lihat route `koperasi.workspace.tsx`).
 */

type KartuRow = {
  name: string;
  uid_nfc: string;
  anggota?: string;
  rekening_simpanan?: string;
  status?: string;
  tipe_kartu?: string;
};

type AnggotaRow = {
  name: string;
  nomor_anggota?: string;
  nasabah?: string;
  status?: string;
};

type RekeningRow = {
  name: string;
  nomor_rekening?: string;
  nasabah?: string;
  saldo?: number;
  status?: string;
};

type ModalState =
  | { kind: "closed" }
  | { kind: "transaksi"; jenis: TransaksiJenis }
  | { kind: "saldo" };

export function TellerWorkspace() {
  const [lookupKey, setLookupKey] = useState<
    { kind: "uid"; value: string } | { kind: "anggota"; value: string } | null
  >(null);
  const [ctx, setCtx] = useState<AnggotaContext | null>(null);
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [warning, setWarning] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchText, setSearchText] = useState("");

  // ── RFID scanner ─────────────────────────────────────────────────────
  useRfidListener({
    onScan: (uid) => {
      setWarning(null);
      setLookupKey({ kind: "uid", value: uid });
    },
  });

  // ── Lookup: Kartu by uid_nfc ─────────────────────────────────────────
  const kartuQ = useResourceList<KartuRow>(
    "Kartu",
    {
      fields: ["name", "uid_nfc", "anggota", "rekening_simpanan", "status", "tipe_kartu"],
      filters: lookupKey?.kind === "uid" ? [["uid_nfc", "=", lookupKey.value]] : [],
      limit_page_length: 1,
    },
    { enabled: lookupKey?.kind === "uid" },
  );

  const kartu = kartuQ.data?.[0];
  const anggotaName =
    lookupKey?.kind === "anggota" ? lookupKey.value : kartu?.anggota ?? null;

  // ── Lookup: Anggota Koperasi ─────────────────────────────────────────
  const anggotaQ = useResourceList<AnggotaRow>(
    "Anggota Koperasi",
    {
      fields: ["name", "nomor_anggota", "nasabah", "status"],
      filters: anggotaName ? [["name", "=", anggotaName]] : [],
      limit_page_length: 1,
    },
    { enabled: !!anggotaName },
  );

  const anggota = anggotaQ.data?.[0];

  // ── Lookup: Rekening Simpanan (pertama, status Aktif) ────────────────
  const rekeningQ = useResourceList<RekeningRow>(
    "Rekening Simpanan",
    {
      fields: ["name", "nomor_rekening", "nasabah", "saldo", "status"],
      filters: anggota?.nasabah
        ? [
            ["nasabah", "=", anggota.nasabah],
            ["status", "=", "Aktif"],
          ]
        : [],
      limit_page_length: 1,
      order_by: "creation asc",
    },
    { enabled: !!anggota?.nasabah },
  );

  // ── Compose context once chain resolved ──────────────────────────────
  useEffect(() => {
    if (!anggota) return;
    const rek = rekeningQ.data?.[0];
    setCtx({
      anggotaName: anggota.name,
      nomorAnggota: anggota.nomor_anggota,
      nasabah: anggota.nasabah,
      status: anggota.status,
      // Link value MUST be the doc name; nomor_rekening is a display mirror.
      rekening: rek?.name,
      saldo: rek?.saldo,
      kartuUid: lookupKey?.kind === "uid" ? lookupKey.value : undefined,
    });
  }, [anggota, rekeningQ.data, lookupKey]);

  // ── Handle scan-not-found ────────────────────────────────────────────
  useEffect(() => {
    if (lookupKey?.kind !== "uid") return;
    if (kartuQ.isFetching) return;
    if (kartuQ.data && kartuQ.data.length === 0) {
      setWarning(`Kartu UID ${lookupKey.value} tidak terdaftar.`);
      setCtx(null);
    }
  }, [kartuQ.isFetching, kartuQ.data, lookupKey]);

  // ── Hotkeys ──────────────────────────────────────────────────────────
  const onQuickAction = (a: QuickAction) => {
    if (!ctx) {
      setWarning("Pilih anggota dulu (scan kartu atau cari).");
      return;
    }
    setWarning(null);
    if (a.kind === "cek-saldo") {
      setModal({ kind: "saldo" });
    } else {
      setModal({ kind: "transaksi", jenis: a.jenis });
    }
  };

  const hotkeyMap = useMemo(
    () => ({
      F2: (e: KeyboardEvent) => {
        e.preventDefault();
        onQuickAction(ACTION_SETOR);
      },
      F3: (e: KeyboardEvent) => {
        e.preventDefault();
        onQuickAction(ACTION_TARIK);
      },
      F4: (e: KeyboardEvent) => {
        e.preventDefault();
        onQuickAction(ACTION_BAGI_HASIL);
      },
      F5: (e: KeyboardEvent) => {
        e.preventDefault();
        onQuickAction(ACTION_SALDO);
      },
      Escape: () => {
        setCtx(null);
        setLookupKey(null);
        setWarning(null);
        setSearchText("");
        setModal({ kind: "closed" });
      },
      "/": (e: KeyboardEvent) => {
        e.preventDefault();
        searchRef.current?.focus();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx],
  );
  useGlobalHotkeys(hotkeyMap, modal.kind === "closed");

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = searchText.trim();
    if (!v) return;
    setWarning(null);
    setLookupKey({ kind: "anggota", value: v });
  };

  const isLoading =
    kartuQ.isFetching || anggotaQ.isFetching || rekeningQ.isFetching;

  return (
    <div className="space-y-4">
      <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
        <Input
          ref={searchRef}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Scan kartu RFID atau ketik No. Anggota (KOP-...)"
          className="font-mono"
        />
        <Button type="submit" variant="outline" disabled={!searchText.trim()}>
          Cari
        </Button>
      </form>

      {warning ? (
        <Alert tone="warning" title="Perhatian">
          {warning}
        </Alert>
      ) : null}

      <AnggotaContextCard ctx={isLoading && !ctx ? null : ctx} />

      <QuickActionGrid disabled={!ctx} onSelect={onQuickAction} />

      <nav
        aria-label="Daftar hotkey teller workspace"
        className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-2 text-xs text-muted-fg"
      >
        <span className="sr-only">Hotkey aktif:</span>
        Hotkey: <kbd className="font-mono" aria-label="F2">F2</kbd> Setor ·{" "}
        <kbd className="font-mono" aria-label="F3">F3</kbd> Tarik ·{" "}
        <kbd className="font-mono" aria-label="F4">F4</kbd> Top-up ·{" "}
        <kbd className="font-mono" aria-label="F5">F5</kbd> Cek Saldo ·{" "}
        <kbd className="font-mono" aria-label="garis miring">/</kbd> Cari ·{" "}
        <kbd className="font-mono" aria-label="Escape">Esc</kbd> Reset
      </nav>

      {modal.kind === "transaksi" && ctx ? (
        <TransaksiModal
          open
          defaultJenis={modal.jenis}
          {...(ctx.rekening ? { rekening: ctx.rekening } : {})}
          onClose={() => setModal({ kind: "closed" })}
          onSuccess={() => {
            setModal({ kind: "closed" });
            void rekeningQ.refetch();
          }}
        />
      ) : null}

      {modal.kind === "saldo" && ctx ? (
        <Alert tone="info" title={`Saldo ${ctx.rekening ?? "—"}`}>
          <div className="tabular-nums text-2xl font-semibold">
            Rp {(ctx.saldo ?? 0).toLocaleString("id-ID")}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => setModal({ kind: "closed" })}
          >
            Tutup
          </Button>
        </Alert>
      ) : null}
    </div>
  );
}
