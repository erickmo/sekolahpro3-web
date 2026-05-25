import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

function PengaturanKoperasiPage() {
  const produkSimpanan = useResourceList<{ name: string; akad: string; nisbah?: string }>(
    "Produk Simpanan", { fields: ["name", "akad", "nisbah"], limit_page_length: 0 },
  );
  const produkPembiayaan = useResourceList<{ name: string; akad: string; plafon_max?: number }>(
    "Produk Pembiayaan", { fields: ["name", "akad", "plafon_max"], limit_page_length: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Koperasi" title="Pengaturan" description="Master produk, akad, parameter operasional." />
      <SectionCard title="Produk Simpanan">
        <ul className="space-y-2 text-sm">
          {(produkSimpanan.data ?? []).map((p) => (
            <li key={p.name} className="flex justify-between">
              <span>{p.name}</span>
              <span className="text-muted-fg">{p.akad}{p.nisbah ? ` · nisbah ${p.nisbah}` : ""}</span>
            </li>
          ))}
          {(!produkSimpanan.data || produkSimpanan.data.length === 0) ? (
            <li className="text-muted-fg">Belum ada produk simpanan.</li>
          ) : null}
        </ul>
      </SectionCard>
      <SectionCard title="Produk Pembiayaan">
        <ul className="space-y-2 text-sm">
          {(produkPembiayaan.data ?? []).map((p) => (
            <li key={p.name} className="flex justify-between">
              <span>{p.name}</span>
              <span className="text-muted-fg">{p.akad}{p.plafon_max ? ` · plafon Rp ${p.plafon_max.toLocaleString("id-ID")}` : ""}</span>
            </li>
          ))}
          {(!produkPembiayaan.data || produkPembiayaan.data.length === 0) ? (
            <li className="text-muted-fg">Belum ada produk pembiayaan.</li>
          ) : null}
        </ul>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/koperasi/pengaturan")({ component: PengaturanKoperasiPage });
