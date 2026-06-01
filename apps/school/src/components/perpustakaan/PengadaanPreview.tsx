/**
 * Inventory-generation preview for the Pengadaan Buku detail page (god-file split).
 *
 * Layer: presentational. Renders the "Preview Generasi Eksemplar" card from the
 * pre-computed `previewInventaris` lines (built via buildPreviewInventaris in the
 * hook) plus an irreversibility warning. Markup moved verbatim from the route.
 */
import { IconAlert, SectionCard } from "@sekolahpro/ui";

interface Props {
  previewInventaris: string[];
  totalEksemplar: number;
}

/**
 * Renders a per-line preview of the inventory numbers each item will create on
 * Submit, plus a warning that generated eksemplar are permanent. Callers only
 * render this when there are preview lines and the doc is not yet read-only.
 */
export function PengadaanPreview({ previewInventaris, totalEksemplar }: Props) {
  return (
    <SectionCard
      title="Preview Generasi Eksemplar"
      description="Nomor inventaris yang akan dibuat saat Submit."
    >
      <div className="space-y-2">
        {previewInventaris.map((line, i) => (
          <div key={i} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-mono text-fg">
            {line}
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
          <IconAlert className="h-4 w-4 shrink-0" />
          <span>
            Submit akan generate <b>{totalEksemplar} eksemplar permanen</b> — cancel tidak akan menghapus eksemplar.
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
