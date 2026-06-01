/**
 * calon-siswaPanel — kartu pendaftar untuk direktori Calon Siswa PPDB.
 *
 * Komponen presentational yang dipakai HANYA oleh halaman
 * routes/sch.$sekolah.ppdb.calon-siswa.tsx. Setiap kartu menampilkan avatar,
 * nama, badge jenjang/jalur, dan ProgressRing kelengkapan dokumen.
 *
 * Navigasi disuntik lewat `renderLink` agar komponen bebas-router (mengikuti
 * pola NextActionCard) sehingga mudah diuji tanpa <RouterProvider>.
 */

import type { ReactNode } from "react";
import { Avatar, Badge, SectionCard, cn } from "@sekolahpro/ui";
import { ProgressRing } from "../viz";
import { docCompleteness } from "../../lib/ppdbAnalytics";
import {
  TONE_BY_STATUS,
} from "../../lib/ppdbApi";
import type { Pendaftar } from "../../data/ppdb";

// Ambang persentase kelengkapan dokumen untuk pemilihan nada ProgressRing.
const DOC_PCT_GOOD = 80;
const DOC_PCT_WARN = 40;

// Label UI Bahasa Indonesia — tidak boleh tersebar (no magic strings).
const DOC_RING_LABEL = "Dokumen";
const VIEW_DETAIL_LABEL = "Lihat detail";

/**
 * Pilih nada ProgressRing dokumen dari persentase kelengkapan:
 * tinggi -> emerald, sedang -> amber, rendah -> rose. Mencegah magic warna.
 */
function docRingTone(pct: number): "emerald" | "amber" | "rose" {
  if (pct >= DOC_PCT_GOOD) return "emerald";
  if (pct >= DOC_PCT_WARN) return "amber";
  return "rose";
}

interface CalonSiswaCardProps {
  pendaftar: Pendaftar;
  /** Pemanggil menyuntik tautan detail (mis. TanStack <Link to=...>). */
  renderDetailLink: (noPendaftaran: string, children: ReactNode) => ReactNode;
}

/**
 * Satu kartu pendaftar: identitas + badge jenjang/jalur + cincin kelengkapan
 * dokumen. Dibungkus <article> agar mudah di-scope dalam test (getByText →
 * closest("article")).
 */
export function CalonSiswaCard({
  pendaftar,
  renderDetailLink,
}: CalonSiswaCardProps): ReactNode {
  const doc = docCompleteness(pendaftar);
  const statusTone = TONE_BY_STATUS[pendaftar.statusPendaftaran] ?? "neutral";

  return (
    <article>
      <SectionCard className="flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <Avatar name={pendaftar.namaLengkap} src={pendaftar.fotoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">
              {pendaftar.namaLengkap}
            </p>
            <p className="truncate font-mono text-xs text-muted-fg">
              {pendaftar.noPendaftaran}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="brand">{pendaftar.jenjangTujuan}</Badge>
              <Badge tone="neutral">{pendaftar.jalur}</Badge>
            </div>
          </div>
          {/* Cincin kecil kelengkapan dokumen di pojok kanan kartu. */}
          <ProgressRing
            value={doc.pct}
            size={56}
            thickness={6}
            tone={docRingTone(doc.pct)}
            label={DOC_RING_LABEL}
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <Badge tone={statusTone} dot>
            {pendaftar.statusPendaftaran}
          </Badge>
          {/* CTA detail disuntik via renderDetailLink agar bebas-router. */}
          {renderDetailLink(
            pendaftar.noPendaftaran,
            <span
              className={cn(
                "inline-flex h-8 items-center rounded-md border border-border px-3",
                "text-xs font-medium text-fg transition-colors hover:border-brand hover:text-brand",
              )}
            >
              {VIEW_DETAIL_LABEL}
            </span>,
          )}
        </div>
      </SectionCard>
    </article>
  );
}
