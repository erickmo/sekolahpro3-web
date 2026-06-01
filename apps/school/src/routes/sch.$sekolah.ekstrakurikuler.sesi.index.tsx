/**
 * sch.$sekolah.ekstrakurikuler.sesi.index.tsx — "Sesi hari ini".
 *
 * Layar utama mobile untuk PEMBINA (pelatih). Alur satu ketuk:
 *   pilih ekstrakurikuler → "Mulai Sesi Hari Ini" → tandai yang tidak hadir.
 *
 * Membuat dokumen "Sesi Ekstrakurikuler" untuk hari ini lalu langsung membuka
 * layar absensi (sesi.$id). Di bawah tombol, daftar sesi terakhir program yang
 * dipilih agar pembina bisa meneruskan/meninjau pertemuan sebelumnya.
 *
 * Role framing (label/penekanan saja, tidak menyembunyikan fungsi):
 *  - Pembina: pelaku utama — mulai sesi & catat kehadiran.
 *  - Koordinator: menyiapkan program agar pembina tinggal menjalankan.
 *  - Kepala: memantau keberjalanan pertemuan.
 */
import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Badge,
  Button,
  PageHeader,
  SearchableSelect,
  SectionCard,
  IconCalendar,
  IconPlus,
  type SearchableOption,
} from "@sekolahpro/ui";
import { createResource, listResource, useResourceList } from "@sekolahpro/api-client";
import { PageGuide, type PageGuideStep } from "../components/guide";
import { useEkskulContext } from "../lib/ekskulContext";
import { useEkskulRole, ROLE_LABEL } from "../lib/ekskulRole";

const SESI_DOCTYPE = "Sesi Ekstrakurikuler";
const PROGRAM_DOCTYPE = "Ekstrakurikuler";
const PROGRAM_FIELDS = ["name", "nama", "kategori", "status"];
const SESI_FIELDS = ["name", "tanggal", "pertemuan_ke", "topik"];
const PROGRAM_PAGE = 50;
const RECENT_LIMIT = 50;

/** Satu baris sesi terakhir pada daftar di bawah tombol mulai. */
interface SesiRow {
  name: string;
  tanggal?: string;
  pertemuan_ke?: number;
  topik?: string;
}

/** Baris program ekstrakurikuler untuk pencarian (loadOptions). */
interface ProgramRow {
  name: string;
  nama?: string;
  kategori?: string;
  status?: string;
}

/** Tanggal hari ini dalam format ISO "YYYY-MM-DD" untuk field Date Frappe. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const GUIDE_STEPS: PageGuideStep[] = [
  {
    title: "Pilih ekstrakurikuler",
    detail: "Cari program binaan Anda pada kotak pilihan di atas.",
    roles: ["pembina", "koordinator"],
  },
  {
    title: "Mulai sesi hari ini",
    detail: "Satu ketuk membuat pertemuan untuk tanggal hari ini dan membuka daftar hadir.",
    roles: ["pembina"],
  },
  {
    title: "Tandai yang tidak hadir saja",
    detail: "Semua peserta default Hadir — cukup ubah status siswa yang Izin/Sakit/Alpha.",
    roles: ["pembina"],
  },
];

/** Kartu kosong: belum ada program terpilih atau belum ada sesi. */
function EmptyState({ message }: { message: string }) {
  return <div className="px-4 py-10 text-center text-sm text-muted-fg">{message}</div>;
}

/** Satu baris sesi terakhir yang bisa diketuk untuk membuka absensi. */
function SesiListItem({ row, sekolah }: { row: SesiRow; sekolah: string }) {
  return (
    <Link
      to="/sch/$sekolah/ekstrakurikuler/sesi/$id"
      params={{ sekolah, id: row.name }}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Badge tone="brand">Pertemuan ke-{row.pertemuan_ke ?? "?"}</Badge>
          <span className="text-sm font-medium text-fg">{row.tanggal ?? "—"}</span>
        </div>
        {row.topik ? (
          <div className="mt-0.5 truncate text-xs text-muted-fg">{row.topik}</div>
        ) : null}
      </div>
      <span className="shrink-0 text-xs text-brand">Buka →</span>
    </Link>
  );
}

/** Daftar sesi terakhir untuk program terpilih (loading / kosong / list). */
function RecentSesiList({
  program,
  semester,
  sekolah,
}: {
  program: string;
  semester: string;
  sekolah: string;
}) {
  const sesiQ = useResourceList<SesiRow>(
    SESI_DOCTYPE,
    {
      fields: SESI_FIELDS,
      filters: [
        ["ekstrakurikuler", "=", program],
        ["semester", "=", semester],
      ] as [string, string, string][],
      order_by: "`tanggal` desc",
      limit_page_length: RECENT_LIMIT,
    },
    { enabled: !!program },
  );
  const rows = useMemo(() => sesiQ.data ?? [], [sesiQ.data]);

  if (sesiQ.isLoading) return <EmptyState message="Memuat sesi…" />;
  if (rows.length === 0) {
    return <EmptyState message="Belum ada sesi untuk program ini. Mulai sesi pertama di atas." />;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <SesiListItem key={row.name} row={row} sekolah={sekolah} />
      ))}
    </ul>
  );
}

function SesiHariIni() {
  const { sekolah } = useParams({ from: "/sch/$sekolah" });
  const ctx = useEkskulContext();
  const { primary } = useEkskulRole();
  const navigate = useNavigate();

  const [program, setProgram] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Async picker: program ekstrakurikuler pada tahun ajaran konteks.
  const loadProgram = useCallback(
    async (q: string): Promise<SearchableOption[]> => {
      const filters: [string, string, string][] = [
        ["tahun_ajaran", "=", ctx.tahunAjaran],
      ];
      if (q) filters.push(["nama", "like", `%${q}%`]);
      const rows = await listResource<ProgramRow>(PROGRAM_DOCTYPE, {
        fields: PROGRAM_FIELDS,
        filters,
        order_by: "`nama` asc",
        limit_page_length: PROGRAM_PAGE,
      });
      return rows.map((r): SearchableOption => {
        const opt: SearchableOption = { value: r.name, label: r.nama ?? r.name };
        const tags = [r.kategori, r.status === "Nonaktif" ? "Nonaktif" : null].filter(Boolean);
        if (tags.length > 0) opt.hint = tags.join(" · ");
        return opt;
      });
    },
    [ctx.tahunAjaran],
  );

  // Buat sesi hari ini lalu buka layar absensi (pertemuan_ke auto di server).
  const mulaiSesi = useCallback(async () => {
    if (!program || creating) return;
    setCreating(true);
    setError(null);
    try {
      const created = await createResource<{ name: string }>(SESI_DOCTYPE, {
        ekstrakurikuler: program,
        tanggal: todayISO(),
        semester: ctx.semester,
      });
      navigate({
        to: "/sch/$sekolah/ekstrakurikuler/sesi/$id",
        params: { sekolah, id: created.name },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai sesi.");
      setCreating(false);
    }
  }, [program, creating, ctx.semester, navigate, sekolah]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ekstrakurikuler · Sesi"
        title="Sesi hari ini"
        description="Pilih ekstrakurikuler, mulai sesi satu ketuk, lalu tandai peserta yang tidak hadir."
        actions={<Badge tone="brand">{ROLE_LABEL[primary]}</Badge>}
      />

      <PageGuide
        storageId="ekskul-sesi"
        title="Cara mencatat kehadiran"
        intro="Tiga langkah cepat untuk pembina: pilih ekskul → mulai sesi → tandai yang tidak hadir."
        steps={GUIDE_STEPS}
        roleLabels={ROLE_LABEL}
      />

      <SectionCard
        title="Mulai pertemuan"
        description="Sesi dibuat untuk tanggal hari ini pada periode konteks aktif."
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-fg">
            <IconCalendar className="h-4 w-4 shrink-0" />
            Tanggal: {todayISO()} · Semester {ctx.semester || "—"}
          </div>
          <SearchableSelect
            id="ekskul-sesi-program"
            value={program}
            onChange={setProgram}
            loadOptions={loadProgram}
            placeholder="Pilih ekstrakurikuler…"
            className="w-full"
          />
          <Button onClick={mulaiSesi} disabled={!program || creating} className="w-full">
            <IconPlus className="mr-1.5 h-4 w-4 shrink-0" />
            {creating ? "Memulai…" : "Mulai Sesi Hari Ini"}
          </Button>
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Sesi terakhir"
        description="Buka kembali pertemuan sebelumnya untuk meninjau atau melengkapi kehadiran."
        padded={false}
      >
        {program ? (
          <RecentSesiList program={program} semester={ctx.semester} sekolah={sekolah} />
        ) : (
          <EmptyState message="Pilih ekstrakurikuler dulu untuk melihat daftar sesi." />
        )}
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/sch/$sekolah/ekstrakurikuler/sesi/")({
  component: SesiHariIni,
});
