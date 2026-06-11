/**
 * "Aksi Cepat" — proactive quick-action grid for the tu_operator persona.
 *
 * Grafted from the C3 design: covers proactive work (walk-in parent, ad-hoc
 * cash) that has no queue row to deep-link from. Pure presentational.
 */
import type { ReactNode } from "react";
import { SectionCard, IconPlus, IconWallet, IconUsers, IconCheck } from "@sekolahpro/ui";

type RenderLink = (href: string, children: ReactNode, className?: string) => ReactNode;

interface QuickAction {
  to: string;
  label: string;
  icon: ReactNode;
}

/** The four most-common proactive operator entry points. */
const QUICK_ACTIONS: QuickAction[] = [
  { to: "/sch/$sekolah/siswa/new", label: "Tambah Siswa", icon: <IconUsers /> },
  { to: "/sch/$sekolah/keuangan/tagihan", label: "Catat Pembayaran", icon: <IconWallet /> },
  { to: "/sch/$sekolah/akademik/ppdb/pembayaran", label: "Verifikasi PPDB", icon: <IconCheck /> },
  { to: "/sch/$sekolah/absensi/guru", label: "Input Absensi", icon: <IconPlus /> },
];

export interface AksiCepatProps {
  renderLink: RenderLink;
}

export function AksiCepat({ renderLink }: AksiCepatProps): ReactNode {
  return (
    <SectionCard title="Aksi Cepat" description="Pintasan untuk pekerjaan proaktif tanpa antrean.">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((a) =>
          renderLink(
            a.to,
            <span className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-bg p-3 text-center transition-colors hover:border-brand hover:bg-muted/30">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-fg group-hover:bg-brand/10 group-hover:text-brand">
                {a.icon}
              </span>
              <span className="text-xs font-medium text-fg group-hover:text-brand">{a.label}</span>
            </span>,
            undefined,
          ),
        )}
      </div>
    </SectionCard>
  );
}
