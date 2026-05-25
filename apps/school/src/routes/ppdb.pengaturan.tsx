import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";

function PengaturanPpdbPage() {
  const pengaturan = useResourceList<{ name: string; tahun_ajaran?: string; status?: string }>(
    "Pengaturan PPDB", { fields: ["name", "tahun_ajaran", "status"], limit_page_length: 0 },
  );
  const item = useResourceList<{ name: string; nama_item?: string; nominal?: number }>(
    "Item Pembayaran PPDB", { fields: ["name", "nama_item", "nominal"], limit_page_length: 0 },
  );
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="PPDB" title="Pengaturan PPDB" />
      <SectionCard title="Pengaturan Aktif">
        <ul className="space-y-2 text-sm">
          {(pengaturan.data ?? []).map((p) => (
            <li key={p.name} className="flex justify-between">
              <span>{p.name}</span>
              <span className="text-muted-fg">{p.tahun_ajaran ?? "—"} · {p.status ?? "—"}</span>
            </li>
          ))}
          {(!pengaturan.data || pengaturan.data.length === 0) ? <li className="text-muted-fg">Belum ada.</li> : null}
        </ul>
      </SectionCard>
      <SectionCard title="Item Pembayaran">
        <ul className="space-y-2 text-sm">
          {(item.data ?? []).map((i) => (
            <li key={i.name} className="flex justify-between">
              <span>{i.nama_item ?? i.name}</span>
              <span className="tabular-nums text-muted-fg">Rp {(i.nominal ?? 0).toLocaleString("id-ID")}</span>
            </li>
          ))}
          {(!item.data || item.data.length === 0) ? <li className="text-muted-fg">Belum ada.</li> : null}
        </ul>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/ppdb/pengaturan")({ component: PengaturanPpdbPage });
