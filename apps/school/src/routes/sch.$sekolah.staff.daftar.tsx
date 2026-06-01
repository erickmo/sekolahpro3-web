import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  FilterBar,
  IconPlus,
  PageHeader,
  Pagination,
  SectionCard,
  type Column,
  type SortState,
} from "@sekolahpro/ui";
import { EmptyState } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { RoleBadges } from "../features/pegawai/RoleBadges";
import { PegawaiFormModal } from "../features/pegawai/PegawaiFormModal";
import { apiRoleBadges, apiIsGuru, apiIsStaff, apiIsDualRole, type PegawaiApi } from "../features/pegawai/roles";
import { SummaryStrip } from "../components/SummaryStrip";
import { daftarSummary } from "../lib/orang/staffListSummary";
import { isFirstRunEmpty } from "../lib/orang/listSummary";

// Sentinel value for the "no role/status filter" choice in this page's filters.
const FILTER_ALL = "semua";

type RoleFilter = "semua" | "guru" | "staff" | "dual";
type StatusFilter = "semua" | "aktif" | "nonaktif";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "guru", label: "Guru" },
  { value: "staff", label: "Staff" },
  { value: "dual", label: "Dual-role" },
];

const PEGAWAI_LIMIT = 500;
const PAGE_SIZE = 25;

const COLUMNS: Column<PegawaiApi>[] = [
  {
    key: "nama_lengkap",
    header: "Pegawai",
    sortable: true,
    cell: (p) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={p.nama_lengkap ?? p.name} size="sm" />
        <div className="min-w-0">
          <div className="font-medium text-fg truncate">{p.nama_lengkap ?? p.name}</div>
          <div className="text-xs text-muted-fg tabular-nums">NIP {p.nip ?? "—"}</div>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Role",
    cell: (p) => <RoleBadges roles={apiRoleBadges(p)} />,
  },
  {
    key: "is_aktif",
    header: "Status",
    sortable: true,
    cell: (p) => (
      <Badge tone={p.is_aktif === 1 ? "success" : "neutral"}>
        {p.is_aktif === 1 ? "Aktif" : "Non-aktif"}
      </Badge>
    ),
  },
  {
    key: "jabatan_fungsional",
    header: "Jabatan / Mapel",
    cell: (p) => <span className="text-sm">{p.jabatan_fungsional ?? "—"}</span>,
  },
  {
    key: "status_kepegawaian",
    header: "Kepegawaian",
    cell: (p) => <span className="text-sm">{p.status_kepegawaian ?? "—"}</span>,
  },
];

export const Route = createFileRoute("/sch/$sekolah/staff/daftar")({
  component: DaftarPegawai,
});

function sortVal(p: PegawaiApi, key: string): string | number {
  if (key === "is_aktif") return p.is_aktif === 1 ? 1 : 0;
  const v = (p as Record<string, unknown>)[key];
  return typeof v === "number" ? v : String(v ?? "").toLowerCase();
}

function DaftarPegawai() {
  const { sekolah } = Route.useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleFilter>("semua");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [sort, setSort] = useState<SortState>({ key: "nama_lengkap", dir: "asc" });
  const [page, setPage] = useState(1);

  const q = useResourceList<PegawaiApi>("Pegawai", {
    fields: ["name", "nama_lengkap", "nip", "jabatan_fungsional", "status_kepegawaian", "is_aktif", "roles.role"],
    filters: { sekolah },
    order_by: "nama_lengkap asc",
    limit_page_length: PEGAWAI_LIMIT,
  });

  // Memoised so the array reference is stable while q.data is unchanged; keeps
  // the dependent useMemo hooks below from recomputing on every render.
  const list = useMemo(() => q.data ?? [], [q.data]);

  // Summary strip reflects the WHOLE fetched directory, not the filtered page.
  const summaryItems = useMemo(() => daftarSummary(list), [list]);

  // Greet a first-time user (genuinely empty, no role/status filter or search)
  // with an onboarding empty-state instead of a bare table.
  const showGettingStarted = isFirstRunEmpty({
    isLoading: q.isLoading,
    isError: q.isError,
    rowCount: list.length,
    hasSearch: !!query.trim(),
    hasActiveFilter: role !== FILTER_ALL || status !== FILTER_ALL,
  });

  const filtered = useMemo(() => list.filter((p) => {
    if (role === "guru" && !(apiIsGuru(p) && !apiIsDualRole(p))) return false;
    if (role === "staff" && !(apiIsStaff(p) && !apiIsDualRole(p))) return false;
    if (role === "dual" && !apiIsDualRole(p)) return false;
    if (status === "aktif" && p.is_aktif !== 1) return false;
    if (status === "nonaktif" && p.is_aktif === 1) return false;
    if (query) {
      const t = query.toLowerCase();
      const hay = `${p.nama_lengkap ?? ""} ${p.nip ?? ""}`.toLowerCase();
      if (!hay.includes(t)) return false;
    }
    return true;
  }), [list, role, status, query]);

  const sorted = useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = sortVal(a, sort.key);
      const vb = sortVal(b, sort.key);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sort]);

  // Reset to first page whenever the result set or its ordering changes.
  useEffect(() => setPage(1), [role, status, query, sort]);

  const total = sorted.length;
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direktori"
        title="Pegawai"
        description="Kelola data guru dan staff, role, serta status kepegawaian."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
            Tambah Pegawai
          </Button>
        }
      />

      <SummaryStrip items={summaryItems} />

      {showGettingStarted ? (
        <EmptyState
          title="Belum ada pegawai"
          description="Daftarkan guru atau staff pertama untuk mulai mengelola role, jabatan, penugasan, dan SK. Data ini menjadi dasar seluruh modul kepegawaian."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Pegawai
            </Button>
          }
        />
      ) : (
      <>
      <FilterBar
        search={{
          value: query,
          onChange: setQuery,
          placeholder: "Cari nama atau NIP",
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            value: status,
            options: [
              { value: "semua", label: "Semua status" },
              { value: "aktif", label: "Aktif" },
              { value: "nonaktif", label: "Non-aktif" },
            ],
            onChange: (v) => setStatus(v as StatusFilter),
          },
        ]}
        trailing={
          <div className="flex flex-wrap items-center gap-1.5">
            {ROLE_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setRole(f.value)}
                className={`h-9 px-3 rounded-md text-sm border ${role === f.value ? "border-brand bg-brand/10 text-brand" : "border-border text-fg hover:bg-muted"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
      />

      <SectionCard
        title={q.isLoading ? "Memuat..." : `${total} pegawai`}
        action={
          q.isError ? (
            <div className="flex items-center gap-2">
              <Badge tone="danger">Gagal memuat</Badge>
              <Button variant="outline" onClick={() => q.refetch()}>Coba lagi</Button>
            </div>
          ) : null
        }
        padded={false}
      >
        <DataTable<PegawaiApi>
          data={paged}
          columns={COLUMNS}
          rowKey={(p) => p.name}
          sort={sort}
          onSortChange={setSort}
          onRowClick={(p) => navigate({ to: "/sch/$sekolah/staff/$nip", params: { sekolah, nip: p.name } })}
          empty={
            <div>
              <div className="font-medium text-fg">
                {q.isError ? "Gagal memuat data" : "Belum ada pegawai"}
              </div>
              <div className="text-xs mt-1">
                {q.isError ? String(q.error) : "Coba ubah filter atau tambah pegawai baru."}
              </div>
            </div>
          }
          footer={
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          }
        />
      </SectionCard>
      </>
      )}

      <PegawaiFormModal open={showCreate} onClose={() => setShowCreate(false)} mode="create" />
    </div>
  );
}
