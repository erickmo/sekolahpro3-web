/**
 * Operasional › Struktur Biaya.
 *
 * Define fee components priced per tingkat (SPP, Uang Pangkal, …) and launch the
 * generator that fans them out into School Fee Invoice rows. The parent
 * `keuangan.tsx` layout supplies the ModuleShell + hub nav, so this child only
 * renders its own content. `StrukturBiayaView` is a pure, test-friendly
 * presentation component (named export so vitest can mount it without the
 * TanStack Route shell + session provider).
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, PageHeader, SectionCard, Badge } from "@sekolahpro/ui";
import { GenerateTagihanModal } from "../components/keuangan/GenerateTagihanModal";
import { useFeeComponentsLive, generateForComponent } from "../data/fee-structure-live";
import { mergeSummaries, type FeeComponent, type GenerateSummary } from "../data/fee-structure";
import { useKeuanganRole } from "../lib/keuanganRole";

const RUPIAH = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function StrukturBiayaView(props: {
  components: FeeComponent[];
  canManage: boolean;
  onGenerate: () => void;
}) {
  const { components, canManage, onGenerate } = props;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Struktur Biaya"
        description="Komponen biaya & harga per tingkat. Dipakai untuk generate tagihan."
        actions={canManage ? <Button onClick={onGenerate}>Generate Tagihan</Button> : undefined}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {components.map((c) => (
          <SectionCard key={c.name} title={c.nama_komponen}>
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="brand">{c.ritme}</Badge>
              {c.auto_generate && <Badge tone="success">Terjadwal</Badge>}
              {!c.is_active && <Badge tone="neutral">Nonaktif</Badge>}
            </div>
            <ul className="text-sm text-muted-foreground">
              {c.rates.map((r) => (
                <li key={r.tingkat}>
                  Tingkat {r.tingkat}: {RUPIAH.format(r.nominal)}
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}

function StrukturBiayaRoute() {
  const { components } = useFeeComponentsLive();
  const role = useKeuanganRole();
  const [modalOpen, setModalOpen] = useState(false);
  const periode = new Date().toISOString().slice(0, 7); // current YYYY-MM

  // Bendahara/Akuntan/Kepala manage the structure; Kasir is read-only.
  const canManage = role.isBendahara || role.isAkuntan || role.isKepala;

  function onConfirmed(_s: GenerateSummary) {
    setModalOpen(false);
  }

  // Generate each active component via its doc method, then fold the results.
  // TA/sekolah are derived server-side from each component doc — no client-side
  // company/TA threading needed.
  async function runGenerate({ periode: p, dry_run }: { periode: string; dry_run: 0 | 1 }) {
    const active = components.filter((c) => c.is_active);
    const parts = await Promise.all(
      active.map((c) => generateForComponent(c.name, p, dry_run === 1)),
    );
    return mergeSummaries(parts);
  }

  return (
    <>
      <StrukturBiayaView
        components={components}
        canManage={canManage}
        onGenerate={() => setModalOpen(true)}
      />
      <GenerateTagihanModal
        open={modalOpen}
        periode={periode}
        onClose={() => setModalOpen(false)}
        onGenerate={runGenerate}
        onConfirmed={onConfirmed}
      />
    </>
  );
}

export const Route = createFileRoute("/sch/$sekolah/keuangan/biaya")({
  component: StrukturBiayaRoute,
});
