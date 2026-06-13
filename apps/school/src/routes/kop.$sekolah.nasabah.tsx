import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Badge, type Column } from "@sekolahpro/ui";
import type { FilterTuple } from "@sekolahpro/api-client";
import { ResourceListPage } from "../components/ResourceListPage";
import { NasabahFormModal } from "../components/koperasi-nasabah/NasabahFormModal";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";
import { KYC_TIER_TONE } from "../components/koperasi-nasabah/KycPanel";
import type { NasabahDoc } from "../components/koperasi-nasabah/types";

type Row = NasabahDoc & Record<string, unknown>;

const STATUS_TONE: Record<string, "success" | "neutral"> = {
  Aktif: "success",
  "Tidak Aktif": "neutral",
};

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "No Nasabah", sortable: true,
    cell: (r) => <span className="font-mono text-xs">{r.nomor_nasabah ?? r.name}</span> },
  { key: "pihak", header: "Pihak", sortable: true,
    cell: (r) => (
      <span className="text-sm">
        {r.pihak ?? "—"}
        {r.pihak_tipe ? <span className="ml-1.5 text-xs text-muted-fg">({r.pihak_tipe})</span> : null}
      </span>
    ) },
  { key: "kyc_tier", header: "Tier KYC",
    cell: (r) => r.kyc_tier ? <Badge tone={KYC_TIER_TONE[r.kyc_tier] ?? "neutral"}>{r.kyc_tier}</Badge> : "—" },
  { key: "kyc_review_overdue", header: "Review",
    cell: (r) => r.kyc_review_overdue ? <Badge tone="danger" dot>Overdue</Badge> : <span className="text-xs text-muted-fg">OK</span> },
  { key: "is_anggota", header: "Anggota",
    cell: (r) => r.is_anggota ? <Badge tone="brand" dot>Anggota</Badge> : <span className="text-xs text-muted-fg">Non-anggota</span> },
  { key: "tanggal_registrasi", header: "Registrasi", sortable: true, cell: (r) => r.tanggal_registrasi ?? "—" },
  { key: "status", header: "Status",
    cell: (r) => r.status ? <Badge tone={STATUS_TONE[r.status] ?? "neutral"} dot>{r.status}</Badge> : "—" },
];

function NasabahListPage() {
  const { overdue } = Route.useSearch();
  return <NasabahListView {...(overdue !== undefined ? { overdue } : {})} />;
}

/** Inner view — search param diinject sebagai prop agar mudah diuji. */
export function NasabahListView({ overdue }: { overdue?: boolean }) {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Deep-link worklist: ?overdue=1 menampilkan hanya nasabah dengan flag
  // kyc_review_overdue (di-set scheduler backend 06:00). Pola PERP-ADR-0001.
  const baseFilters = useMemo<FilterTuple[] | undefined>(
    () => (overdue ? [["kyc_review_overdue", "=", 1]] : undefined),
    [overdue],
  );

  return (
    <>
      <KoperasiPageGuide id="nasabah" />
      <ResourceListPage<Row>
        eyebrow="Koperasi"
        title={overdue ? "Nasabah — Review KYC Overdue" : "Nasabah"}
        description="Identitas pelanggan koperasi + profil KYC (PPATK PMK 1/2023)."
        doctype="Nasabah"
        fields={[
          "name", "nomor_nasabah", "pihak_tipe", "pihak", "status",
          "is_anggota", "kyc_tier", "kyc_review_overdue", "tanggal_registrasi",
        ]}
        rowKey={(r) => r.name}
        columns={COLUMNS}
        defaultSort={{ key: "tanggal_registrasi", dir: "desc" }}
        searchFields={["name", "pihak"]}
        {...(baseFilters ? { baseFilters } : {})}
        selectFilters={[
          { key: "status", label: "Status", field: "status",
            options: ["Semua", "Aktif", "Tidak Aktif"].map((v) => ({ value: v, label: v })) },
          { key: "tier", label: "Tier KYC", field: "kyc_tier",
            options: ["Semua", "Low", "Medium", "High"].map((v) => ({ value: v, label: v })) },
        ]}
        addLabel="Daftarkan Nasabah"
        onAdd={() => setOpen(true)}
        onRowClick={(r) => navigate({ to: "/kop/$sekolah/nasabah/$name", params: { sekolah, name: r.name } })}
      />
      <NasabahFormModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(name) => navigate({ to: "/kop/$sekolah/nasabah/$name", params: { sekolah, name } })}
      />
    </>
  );
}

export interface NasabahSearch {
  overdue?: boolean;
}

export const Route = createFileRoute("/kop/$sekolah/nasabah")({
  component: NasabahListPage,
  validateSearch: (raw: Record<string, unknown>): NasabahSearch => ({
    ...(raw.overdue === true || raw.overdue === "1" || raw.overdue === 1 ? { overdue: true } : {}),
  }),
});
