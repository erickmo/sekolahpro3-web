// ABS-002 — Layar tap stasiun (konfirmasi).
//
// Tampilan utama kios: setelah kartu/QR di-tap, layar mengonfirmasi siapa yang
// barusan absen (nama + foto) dan arahnya (MASUK / PULANG). `StationView` murni
// & prop-injected agar dapat diuji; `StationRoute` adalah shell minimal —
// wiring tap nyata (kamera/NFC via adapter) menyusul di A8.
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";

/** Arah absensi: masuk ke / keluar dari sekolah. */
export type TapDirection = "in" | "out";

/** Ringkasan tap terakhir yang ditampilkan ke pengguna. */
export interface LastTap {
  /** Nama orang yang barusan absen. */
  name: string;
  /** URL foto, bila tersedia di cache. */
  photo?: string;
  /** Arah absensi. */
  direction: TapDirection;
}

/** Label besar per arah absensi. */
const DIRECTION_LABEL: Record<TapDirection, string> = {
  in: "MASUK",
  out: "PULANG",
};

/** Pesan saat stasiun menunggu tap berikutnya. */
const IDLE_PROMPT = "Menunggu tap…";

export interface StationViewProps {
  /** Tap terakhir, atau `null` saat stasiun idle. */
  lastTap: LastTap | null;
}

/**
 * Layar konfirmasi tap. Saat `lastTap` ada, render nama, foto (bila ada), dan
 * label besar MASUK/PULANG. Saat `null`, render prompt idle.
 *
 * @param props.lastTap - ringkasan tap terakhir, atau `null`.
 */
export function StationView({ lastTap }: StationViewProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        eyebrow="Stasiun"
        title="Absensi"
        description="Tap kartu atau tunjukkan kode QR untuk mencatat kehadiran."
      />
      <SectionCard title="Tap Terakhir">
        {lastTap ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            {lastTap.photo ? (
              <img
                src={lastTap.photo}
                alt={lastTap.name}
                className="h-28 w-28 rounded-full border border-border object-cover"
              />
            ) : null}
            <div className="text-2xl font-semibold text-fg">{lastTap.name}</div>
            <div
              className={
                lastTap.direction === "in"
                  ? "text-5xl font-bold tracking-wide text-success"
                  : "text-5xl font-bold tracking-wide text-warning"
              }
            >
              {DIRECTION_LABEL[lastTap.direction]}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-xl text-muted-fg">{IDLE_PROMPT}</div>
        )}
      </SectionCard>
    </div>
  );
}

/** Wrapper rute: shell minimal — wiring tap nyata menyusul di A8. */
function StationRoute() {
  return <StationView lastTap={null} />;
}

export const Route = createFileRoute("/station")({ component: StationRoute });
