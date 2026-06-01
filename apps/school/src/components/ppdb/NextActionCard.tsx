/**
 * NextActionCard — kartu menonjol "Langkah berikutnya" yang mengangkat satu
 * aksi prioritas dari antrian kerja PPDB ke depan mata pengguna.
 *
 * Komponen ini sengaja "bodoh" (presentational): keputusan aksi mana yang
 * paling penting dihitung di lapisan lib (mis. ppdbQueue), lalu diteruskan
 * sebagai prop. CTA dirender lewat callback `renderLink` agar komponen tidak
 * terikat ke router tertentu (TanStack Link disuntik oleh pemanggil).
 */

import type { ReactNode } from "react";
import { SectionCard, Badge, cn } from "@sekolahpro/ui";

/** Nada visual aksi — menentukan warna aksen kiri + badge. */
export type NextActionTone = "brand" | "warning" | "danger" | "success";

export interface NextAction {
  label: string;
  description: string;
  href: string;
  tone?: NextActionTone;
}

interface Props {
  action: NextAction | null;
  /** Pemanggil menyuntik komponen tautan (mis. TanStack <Link to=...>). */
  renderLink: (href: string, children: ReactNode) => ReactNode;
}

// Judul tetap kartu — string UI Bahasa Indonesia tidak boleh tersebar (no magic strings).
const CARD_TITLE = "Langkah berikutnya";
const CTA_LABEL = "Kerjakan sekarang";
const DEFAULT_TONE: NextActionTone = "brand";

// Aksen garis kiri per nada — token Tailwind tema, bukan warna mentah.
const ACCENT_BY_TONE: Record<NextActionTone, string> = {
  brand: "border-l-brand",
  warning: "border-l-amber-500",
  danger: "border-l-danger",
  success: "border-l-emerald-500",
};

// Varian Badge mengikuti Tone milik @sekolahpro/ui (success/brand/warning/danger).
const BADGE_TONE: Record<NextActionTone, "brand" | "warning" | "danger" | "success"> = {
  brand: "brand",
  warning: "warning",
  danger: "danger",
  success: "success",
};

/**
 * Render kartu aksi-berikutnya, atau `null` bila tidak ada aksi prioritas.
 * Mengembalikan null lebih awal agar pemanggil dapat menempatkan komponen
 * tanpa cabang kondisional di sisi mereka (early return over nesting).
 */
export function NextActionCard({ action, renderLink }: Props): ReactNode {
  if (!action) return null;

  const tone = action.tone ?? DEFAULT_TONE;

  return (
    <SectionCard padded={false} className={cn("border-l-4", ACCENT_BY_TONE[tone])}>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Badge tone={BADGE_TONE[tone]}>{CARD_TITLE}</Badge>
          <p className="mt-2 text-sm font-semibold text-fg">{action.label}</p>
          <p className="mt-0.5 text-xs text-muted-fg">{action.description}</p>
        </div>
        {/* CTA disuntik via renderLink agar bebas-router; styling tombol di sini. */}
        <div className="shrink-0">
          {renderLink(
            action.href,
            <span className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand/90">
              {CTA_LABEL}
            </span>,
          )}
        </div>
      </div>
    </SectionCard>
  );
}
