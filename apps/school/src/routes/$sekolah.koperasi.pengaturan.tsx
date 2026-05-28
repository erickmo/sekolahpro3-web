import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, Tabs, type TabItem } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { MASTER_CONFIGS } from "../lib/koperasi/masterConfigs";
import { MasterCRUD } from "../components/koperasi-master/MasterCRUD";

/**
 * Pengaturan koperasi — 6 tab master.
 *
 * Produk Simpanan/Pembiayaan tetap read-only (schema kompleks dengan
 * GL link + kategori syariah 20+ field). Edit penuh via Frappe desk.
 *
 * Fatwa, Denominasi, Sanctions, Merchant full CRUD via `MasterCRUD` +
 * `GenericFormModal`.
 */

function ProdukSimpananReadonly() {
  const q = useResourceList<{ name: string; akad: string; nisbah_nasabah?: string }>(
    "Produk Simpanan",
    { fields: ["name", "akad", "nisbah_nasabah"], limit_page_length: 0 },
  );
  return (
    <SectionCard
      title="Produk Simpanan"
      description="Edit lengkap via Frappe desk (field GL + kategori syariah)."
    >
      <ul className="space-y-2 text-sm">
        {(q.data ?? []).map((p) => (
          <li key={p.name} className="flex justify-between">
            <span>{p.name}</span>
            <span className="text-muted-fg">
              {p.akad}
              {p.nisbah_nasabah ? ` · nisbah ${p.nisbah_nasabah}` : ""}
            </span>
          </li>
        ))}
        {!q.data || q.data.length === 0 ? (
          <li className="text-muted-fg">Belum ada produk simpanan.</li>
        ) : null}
      </ul>
    </SectionCard>
  );
}

function ProdukPembiayaanReadonly() {
  const q = useResourceList<{ name: string; akad: string }>(
    "Produk Pembiayaan",
    { fields: ["name", "akad"], limit_page_length: 0 },
  );
  return (
    <SectionCard
      title="Produk Pembiayaan"
      description="Edit lengkap via Frappe desk (field GL + tenor)."
    >
      <ul className="space-y-2 text-sm">
        {(q.data ?? []).map((p) => (
          <li key={p.name} className="flex justify-between">
            <span>{p.name}</span>
            <span className="text-muted-fg">{p.akad}</span>
          </li>
        ))}
        {!q.data || q.data.length === 0 ? (
          <li className="text-muted-fg">Belum ada produk pembiayaan.</li>
        ) : null}
      </ul>
    </SectionCard>
  );
}

function PengaturanKoperasiPage() {
  const [active, setActive] = useState<string>("produk-simpanan");

  const makeTab = (key: string, label: string): TabItem => ({
    key,
    label,
    active: active === key,
    render: ({ className, children }: { className: string; children: ReactNode }) => (
      <button type="button" className={className} onClick={() => setActive(key)}>
        {children}
      </button>
    ),
  });

  const items: TabItem[] = [
    makeTab("produk-simpanan", "Produk Simpanan"),
    makeTab("produk-pembiayaan", "Produk Pembiayaan"),
    ...MASTER_CONFIGS.map((c) => makeTab(c.doctype, c.label)),
  ];

  const activeConfig = MASTER_CONFIGS.find((c) => c.doctype === active);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Koperasi"
        title="Pengaturan"
        description="Master produk, fatwa, denominasi, merchant, dan daftar sanksi."
      />
      <Tabs items={items} />
      {active === "produk-simpanan" ? <ProdukSimpananReadonly /> : null}
      {active === "produk-pembiayaan" ? <ProdukPembiayaanReadonly /> : null}
      {activeConfig ? <MasterCRUD config={activeConfig} /> : null}
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/koperasi/pengaturan")({ component: PengaturanKoperasiPage });
