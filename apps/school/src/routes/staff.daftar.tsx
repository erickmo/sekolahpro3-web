import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  Pagination,
  SectionCard,
  StatCard,
  IconCheck,
  IconUsers,
  IconAlert,
  IconDownload,
  IconPlus,
  IconFile,
  IconClock,
  type Column,
  type SelectFilter,
  type SortState,
} from "@sekolahpro/ui";
import { STAFF_LIST, FILTER_OPTIONS, type Staff, type StatusStaff } from "../data/staff";

const TONE_BY_STATUS: Record<StatusStaff, "success" | "warning" | "neutral" | "danger"> = {
  Aktif: "success",
  Cuti: "warning",
  "Non-aktif": "neutral",
  Pensiun: "neutral",
  "Kontrak Berakhir": "danger",
};

function buildOptions(arr: readonly string[]) {
  return arr.map((v) => ({ value: v, label: v }));
}

function daysUntil(iso: string | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date("2026-05-24");
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function StaffListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("Semua");
  const [departemen, setDepartemen] = useState<string>("Semua");
  const [statusKepegawaian, setStatusKep] = useState<string>("Semua");
  const [jenisKelamin, setJk] = useState<string>("Semua");
  const [jabatan, setJabatan] = useState<string>("Semua");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ key: "nama", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return STAFF_LIST.filter((s) => {
      if (q && !`${s.namaLengkap} ${s.nip} ${s.jabatan}`.toLowerCase().includes(q)) return false;
      if (status !== "Semua" && s.status !== status) return false;
      if (departemen !== "Semua" && s.departemen !== departemen) return false;
      if (statusKepegawaian !== "Semua" && s.statusKepegawaian !== statusKepegawaian) return false;
      if (jenisKelamin !== "Semua" && s.jenisKelamin !== jenisKelamin) return false;
      if (jabatan !== "Semua" && s.jabatan !== jabatan) return false;
      return true;
    });
  }, [search, status, departemen, statusKepegawaian, jenisKelamin, jabatan]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const getVal = (s: typeof arr[number]): string | number => {
      switch (sort.key) {
        case "nama": return s.namaLengkap;
        case "departemen": return s.departemen;
        case "jabatan": return s.jabatan;
        case "kehadiran": return s.persenKehadiran;
        case "tugas": return s.jumlahTugasAktif;
        case "status": return s.status;
        default: return s.nip;
      }
    };
    arr.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "id");
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sort]);

  useEffect(() => { setPage(1); }, [search, status, departemen, statusKepegawaian, jenisKelamin, jabatan, pageSize]);

  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const stats = useMemo(() => {
    const aktif = filtered.filter((s) => s.status === "Aktif").length;
    const kontrakSoon = filtered.filter((s) => {
      const d = daysUntil(s.masaKontrakBerakhir);
      return d !== null && d >= 0 && d <= 90;
    }).length;
    const tugasAktif = filtered.reduce((sum, s) => sum + s.jumlahTugasAktif, 0);
    return { aktif, kontrakSoon, tugasAktif };
  }, [filtered]);

  const filters: SelectFilter[] = [
    { key: "status", label: "Status", value: status, options: buildOptions(FILTER_OPTIONS.status), onChange: setStatus },
    { key: "departemen", label: "Departemen", value: departemen, options: buildOptions(FILTER_OPTIONS.departemen), onChange: setDepartemen },
    { key: "statusKep", label: "Status Kepegawaian", value: statusKepegawaian, options: buildOptions(FILTER_OPTIONS.statusKepegawaian), onChange: setStatusKep },
    { key: "jk", label: "JK", value: jenisKelamin, options: buildOptions(FILTER_OPTIONS.jenisKelamin), onChange: setJk },
    { key: "jabatan", label: "Jabatan", value: jabatan, options: buildOptions(FILTER_OPTIONS.jabatan), onChange: setJabatan },
  ];

  const toggleRow = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected((prev) => {
      if (filtered.every((r) => prev.has(r.nip))) {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.nip));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((r) => next.add(r.nip));
      return next;
    });
  };

  const columns: Column<Staff>[] = [
    {
      key: "nama",
      header: "Staff",
      sortable: true,
      cell: (s) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={s.namaLengkap} size="sm" />
          <div className="min-w-0">
            <div className="font-medium text-fg truncate">{s.namaLengkap}</div>
            <div className="text-xs text-muted-fg tabular-nums">
              NIP {s.nip}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "departemen",
      header: "Departemen",
      sortable: true,
      cell: (s) => <span className="text-sm">{s.departemen}</span>,
    },
    {
      key: "jabatan",
      header: "Jabatan",
      sortable: true,
      cell: (s) => <span className="text-sm text-fg">{s.jabatan}</span>,
    },
    { key: "jk", header: "JK", cell: (s) => <span className="text-xs">{s.jenisKelamin === "Laki-laki" ? "L" : "P"}</span>, width: "60px", align: "center" },
    {
      key: "statusKep",
      header: "Status Kepegawaian",
      cell: (s) => <Badge tone="neutral">{s.statusKepegawaian}</Badge>,
    },
    {
      key: "kehadiran",
      header: "Kehadiran",
      sortable: true,
      cell: (s) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${s.persenKehadiran}%` }} />
          </div>
          <span className="text-xs tabular-nums text-muted-fg">{s.persenKehadiran}%</span>
        </div>
      ),
    },
    {
      key: "tugas",
      header: "Tugas Aktif",
      align: "center",
      sortable: true,
      cell: (s) =>
        s.jumlahTugasAktif > 0 ? (
          <Badge tone={s.jumlahTugasAktif > 4 ? "warning" : "brand"}>{s.jumlahTugasAktif}</Badge>
        ) : (
          <span className="text-xs text-muted-fg">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (s) => (
        <Badge tone={TONE_BY_STATUS[s.status]} dot>
          {s.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direktori"
        title="Staff"
        description="Kelola data tenaga kependidikan dan staf sekolah."
        actions={
          <>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconDownload /></span>
              Ekspor
            </Button>
            <Button variant="outline">
              <span className="h-4 w-4 mr-1.5"><IconFile /></span>
              Impor
            </Button>
            <Button>
              <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
              Tambah Staff
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Staff" value={filtered.length.toLocaleString("id-ID")} hint={`dari ${STAFF_LIST.length} total`} icon={<IconUsers />} accent="brand" />
        <StatCard label="Staff Aktif" value={stats.aktif} delta={{ value: `${filtered.length - stats.aktif} non-aktif/cuti`, trend: "flat" }} icon={<IconCheck />} accent="emerald" />
        <StatCard label="Kontrak Berakhir Segera" value={stats.kontrakSoon} hint="dalam 90 hari ke depan" icon={<IconAlert />} accent="amber" />
        <StatCard label="Tugas Aktif" value={stats.tugasAktif} hint="total seluruh staf" icon={<IconClock />} accent="violet" />
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Cari nama, NIP, atau jabatan..." }}
        filters={filters}
      />

      <SectionCard
        title={`${filtered.length} staff`}
        description={selected.size > 0 ? `${selected.size} dipilih` : undefined}
        action={
          selected.size > 0 ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Kirim Pesan</Button>
              <Button variant="outline" size="sm">Tugaskan</Button>
              <Button variant="outline" size="sm">Cetak SK</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm">Atur Kolom</Button>
          )
        }
        padded={false}
      >
        <DataTable
          data={paged}
          columns={columns}
          rowKey={(s) => s.nip}
          selectable
          selected={selected}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          sort={sort}
          onSortChange={setSort}
          onRowClick={(s) => navigate({ to: "/staff/$nip", params: { nip: s.nip } })}
          empty={
            <div>
              <div className="font-medium text-fg">Tidak ada staff cocok</div>
              <div className="text-xs mt-1">Coba ubah filter atau kata kunci pencarian.</div>
            </div>
          }
          footer={
            <Pagination
              page={page}
              pageSize={pageSize}
              total={sorted.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          }
        />
      </SectionCard>

      <p className="text-xs text-muted-fg">
        Tip: klik baris untuk membuka detail staff, atau{" "}
        <Link to="/staff/$nip" params={{ nip: STAFF_LIST[0]!.nip }} className="text-brand hover:underline">
          buka contoh detail
        </Link>
        .
      </p>
    </div>
  );
}

export const Route = createFileRoute("/staff/daftar")({ component: StaffListPage });
