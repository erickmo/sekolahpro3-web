/**
 * "Ritme Operasional" — dashboard shortcuts grouped by working rhythm
 * (harian / berkala / tahunan & setup) so first-day staff know where to start;
 * the full menu stays in the sidebar. Replaces the old flat 13-item
 * "Aksi Cepat" grid (UI/UX + COO + teller consult, 2026-06-13).
 */
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  SectionCard,
  IconChart,
  IconCheck,
  IconClock,
  IconFile,
  IconId,
  IconSettings,
  IconUsers,
  IconWallet,
} from "@sekolahpro/ui";

interface RhythmItem {
  to: string;
  label: string;
  description: string;
  icon: ReactNode;
}

interface RhythmGroup {
  title: string;
  caption: string;
  items: RhythmItem[];
}

const RHYTHM_GROUPS: RhythmGroup[] = [
  {
    title: "Harian",
    caption: "Rutinitas dari buka kas pagi sampai tutup kas sore.",
    items: [
      { to: "/kop/$sekolah/workspace", label: "Layanan Cepat", description: "Scan kartu anggota, setor/tarik dengan tombol pintas.", icon: <IconId /> },
      { to: "/kop/$sekolah/transaksi", label: "Transaksi", description: "Setor, tarik, dan transfer simpanan.", icon: <IconWallet /> },
      { to: "/kop/$sekolah/kas-teller", label: "Kas Teller", description: "Buka kas pagi, ajukan tutup kas sore.", icon: <IconClock /> },
      { to: "/kop/$sekolah/onboarding", label: "Pendaftaran Anggota", description: "Onboarding terpandu anggota baru.", icon: <IconUsers /> },
    ],
  },
  {
    title: "Berkala",
    caption: "Dicek beberapa kali seminggu atau saat ada antrean.",
    items: [
      { to: "/kop/$sekolah/angsuran", label: "Angsuran", description: "Kejar jatuh tempo & tunggakan cicilan.", icon: <IconChart /> },
      { to: "/kop/$sekolah/persetujuan", label: "Persetujuan", description: "Putuskan permohonan rekening anggota.", icon: <IconCheck /> },
      { to: "/kop/$sekolah/period-close", label: "Tutup Periode", description: "Kunci pembukuan periode yang selesai.", icon: <IconClock /> },
      { to: "/kop/$sekolah/laporan", label: "Laporan", description: "Rekap simpanan, pembiayaan, operasional.", icon: <IconFile /> },
    ],
  },
  {
    title: "Tahunan & Setup",
    caption: "Sekali setahun atau saat konfigurasi koperasi.",
    items: [
      { to: "/kop/$sekolah/shu", label: "SHU", description: "Hitung & bagikan Sisa Hasil Usaha.", icon: <IconChart /> },
      { to: "/kop/$sekolah/pengaturan", label: "Pengaturan", description: "Mode koperasi, produk, dan master pendukung.", icon: <IconSettings /> },
    ],
  },
];

/** Grouped shortcut grid; `$sekolah` is inherited from the current route params. */
export function RhythmShortcuts() {
  return (
    <SectionCard
      title="Ritme Operasional"
      description="Pintasan dikelompokkan sesuai irama kerja — menu lengkap ada di sidebar."
    >
      <div className="space-y-5">
        {RHYTHM_GROUPS.map((group) => (
          <div key={group.title}>
            <div className="mb-2">
              <span className="text-sm font-semibold text-fg">{group.title}</span>
              <span className="ml-2 text-xs text-muted-fg">{group.caption}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-bg p-3 hover:border-brand hover:bg-muted/30 transition-colors"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-fg group-hover:bg-brand/10 group-hover:text-brand">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-fg group-hover:text-brand">{item.label}</div>
                    <div className="text-xs text-muted-fg">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
