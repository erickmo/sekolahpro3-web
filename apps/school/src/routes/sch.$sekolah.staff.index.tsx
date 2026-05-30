import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PageHeader,
  StatCard,
  SectionCard,
  IconUsers,
  IconCheck,
  IconAlert,
  IconPlus,
} from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { scopedTo, scopedParams } from "../lib/scoped";
import { apiIsGuru, apiIsStaff, apiIsDualRole, type PegawaiApi } from "../features/pegawai/roles";

const PEGAWAI_LIST_LIMIT = 200;

export const Route = createFileRoute("/sch/$sekolah/staff/")({
  component: StaffIndex,
});

function StaffIndex() {
  const { sekolah } = Route.useParams();

  const q = useResourceList<PegawaiApi>("Pegawai", {
    fields: ["name", "nama_lengkap", "nip", "jabatan_fungsional", "status_kepegawaian", "sekolah", "is_aktif", "tmt_pertama_kerja", "roles.role"],
    filters: { sekolah },
    order_by: "modified desc",
    limit_page_length: PEGAWAI_LIST_LIMIT,
  });

  const list = q.data ?? [];
  const counts = useMemo(() => ({
    total: list.length,
    guru: list.filter(apiIsGuru).length,
    staff: list.filter(apiIsStaff).length,
    dual: list.filter(apiIsDualRole).length,
    aktif: list.filter((p) => p.is_aktif === 1).length,
  }), [list]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Guru & Staff"
        description="Ringkasan tenaga pendidik dan kependidikan."
        actions={
          <Link
            to={scopedTo(sekolah, "/staff/daftar")}
            params={scopedParams(sekolah)}
            className="inline-flex items-center h-9 px-3 rounded-md bg-brand text-white text-sm hover:opacity-90"
          >
            <IconPlus className="h-4 w-4 mr-1" />
            Lihat Daftar
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<IconUsers />} label="Total Pegawai" value={counts.total} />
        <StatCard icon={<IconCheck />} label="Guru" value={counts.guru} />
        <StatCard icon={<IconCheck />} label="Staff" value={counts.staff} />
        <StatCard icon={<IconAlert />} label="Dual-role" value={counts.dual} />
        <StatCard icon={<IconCheck />} label="Aktif" value={counts.aktif} />
      </div>

      {q.isLoading ? (
        <SectionCard title="Memuat data...">
          <div className="text-sm text-muted-fg">Memuat daftar pegawai dari server.</div>
        </SectionCard>
      ) : null}

      {q.error ? (
        <SectionCard title="Gagal memuat">
          <div className="text-sm text-danger">{String(q.error)}</div>
        </SectionCard>
      ) : null}
    </div>
  );
}
