import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

function PengaturanKoperasiPage() {
  const produkSimpanan = useResourceList<{ name: string; akad: string; nisbah_nasabah?: string }>(
    "Produk Simpanan", { fields: ["name", "akad", "nisbah_nasabah"], limit_page_length: 0 },
  );
  const produkPembiayaan = useResourceList<{ name: string; akad: string }>(
    "Produk Pembiayaan", { fields: ["name", "akad"], limit_page_length: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Koperasi" title="Pengaturan" description="Master produk, akad, parameter operasional." />
      <SectionCard title="Produk Simpanan">
        <ul className="space-y-2 text-sm">
          {(produkSimpanan.data ?? []).map((p) => (
            <li key={p.name} className="flex justify-between">
              <span>{p.name}</span>
              <span className="text-muted-fg">{p.akad}{p.nisbah_nasabah ? ` · nisbah ${p.nisbah_nasabah}` : ""}</span>
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
              <span className="text-muted-fg">{p.akad}</span>
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
