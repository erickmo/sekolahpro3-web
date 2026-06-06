// ABS-002 — Layar pairing stasiun absensi.
//
// Petugas memasukkan kode pairing 8-karakter yang ditampilkan backend untuk
// menautkan perangkat kios ini ke sebuah Sekolah. `PairView` murni &
// prop-injected agar dapat diuji tanpa jaringan/penyimpanan; `PairRoute`
// membungkusnya dengan `claimPairing` nyata (frappeFetch + localStorage).
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { frappeFetch } from "@sekolahpro/api-client";
import { Alert, Button, Input, PageHeader, SectionCard } from "@sekolahpro/ui";
import {
  claimPairing,
  type ClaimArgs,
  type ClaimResponse,
} from "../features/pairing/claim";

/** Method backend yang menukar kode pairing dengan kredensial stasiun. */
const CLAIM_METHOD = "sekolahpro.attendance.api.station.claim_pairing";

/** Kunci penyimpanan id perangkat stabil yang di-generate sekali. */
const DEVICE_ID_KEY = "attendance.deviceId";

// TODO ABS phase 5 — ganti placeholder ini dengan kunci publik hasil keygen
// nyata (mis. Ed25519 via @noble/curves) untuk binding verifikasi QR.
const PLACEHOLDER_PUBKEY = "placeholder-station-pubkey";

/** Pesan error generik saat klaim pairing gagal. */
const PAIR_ERROR_MESSAGE = "Gagal menyambungkan stasiun. Periksa kode lalu coba lagi.";

export interface PairViewProps {
  /** Menukar kode pairing; di-inject supaya dapat diuji. */
  onPair: (code: string) => Promise<void>;
}

/**
 * Form pairing: satu input kode + tombol submit. Saat submit, panggil
 * `onPair(code.trim())`. Tombol dinonaktifkan selama proses; penolakan
 * menampilkan `Alert tone="danger"` (role=alert).
 *
 * @param props.onPair - handler penukaran kode pairing (injected).
 */
export function PairView({ onPair }: PairViewProps) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await onPair(code.trim());
    } catch {
      setError(PAIR_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 p-6">
      <PageHeader
        eyebrow="Stasiun"
        title="Sambungkan Stasiun"
        description="Masukkan kode pairing yang ditampilkan di panel admin sekolah."
      />
      <SectionCard title="Kode Pairing" description="Kode berlaku singkat — pakai yang terbaru.">
        <form className="space-y-4" onSubmit={submit}>
          {error ? (
            <Alert tone="danger" title="Tidak dapat menyambungkan">
              {error}
            </Alert>
          ) : null}
          <div className="space-y-1.5">
            <label htmlFor="pairing-code" className="text-sm font-medium text-fg">
              Kode pairing
            </label>
            <Input
              id="pairing-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              placeholder="8 karakter"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Menyambungkan…" : "Sambungkan"}
          </Button>
        </form>
      </SectionCard>
    </div>
  );
}

/**
 * Mengambil (atau membuat) id perangkat stabil dari `localStorage`.
 *
 * @returns fingerprint perangkat yang persisten antar sesi.
 */
function getDeviceFingerprint(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

/** Wrapper rute: men-inject `onPair` nyata via `claimPairing`. */
function PairRoute() {
  const onPair = async (code: string) => {
    await claimPairing(code, getDeviceFingerprint(), PLACEHOLDER_PUBKEY, {
      claim: (args: ClaimArgs) => frappeFetch<ClaimResponse>(CLAIM_METHOD, { ...args }),
      store: localStorage,
    });
  };
  return <PairView onPair={onPair} />;
}

export const Route = createFileRoute("/pair")({ component: PairRoute });
