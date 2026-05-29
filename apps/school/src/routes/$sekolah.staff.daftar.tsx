import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, Button, IconPlus } from "@sekolahpro/ui";
import { useResourceList } from "@sekolahpro/api-client";
import { scopedTo, scopedParams } from "../lib/scoped";
import { RoleBadges } from "../features/pegawai/RoleBadges";
import { PegawaiFormModal } from "../features/pegawai/PegawaiFormModal";
import { apiRoleBadges, apiIsGuru, apiIsStaff, apiIsDualRole, type PegawaiApi } from "../features/pegawai/roles";

type RoleFilter = "semua" | "guru" | "staff" | "dual";
type StatusFilter = "semua" | "aktif" | "nonaktif";

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "guru", label: "Guru" },
  { value: "staff", label: "Staff" },
  { value: "dual", label: "Dual-role" },
];

const PEGAWAI_LIMIT = 500;

export const Route = createFileRoute("/$sekolah/staff/daftar")({
  component: DaftarPegawai,
});

function DaftarPegawai() {
  const { sekolah } = Route.useParams();
  const [role, setRole] = useState<RoleFilter>("semua");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const q = useResourceList<PegawaiApi>("Pegawai", {
    fields: ["name", "nama_lengkap", "nip", "jabatan_fungsional", "status_kepegawaian", "is_aktif", "roles.role"],
    filters: { sekolah },
    order_by: "nama_lengkap asc",
    limit_page_length: PEGAWAI_LIMIT,
  });

  const list = q.data ?? [];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-fg">Daftar Pegawai</h1>
        <Button onClick={() => setShowCreate(true)}>
          <span className="h-4 w-4 mr-1.5"><IconPlus /></span>
          Tambah Pegawai
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {ROLE_OPTIONS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setRole(f.value)}
            className={`h-8 px-3 rounded-md text-sm border ${role === f.value ? "border-brand bg-brand/10 text-brand" : "border-border text-fg hover:bg-muted"}`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="h-8 px-2 rounded-md border border-border text-sm bg-bg"
        >
          <option value="semua">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Non-aktif</option>
        </select>
        <input
          type="search"
          placeholder="Cari nama atau NIP"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 px-2 rounded-md border border-border text-sm bg-bg flex-1 min-w-[180px]"
        />
        <span className="text-xs text-muted-fg ml-auto">
          {q.isLoading ? "Memuat..." : `${filtered.length} pegawai`}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-bg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-fg bg-muted/40">
            <tr>
              <th className="text-left px-3 py-2">NIP</th>
              <th className="text-left px-3 py-2">Nama</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Jabatan / Mapel</th>
              <th className="text-left px-3 py-2">Kepegawaian</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.name} className="border-t border-border hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{p.nip ?? "—"}</td>
                <td className="px-3 py-2">
                  <Link
                    to={scopedTo(sekolah, `/staff/${p.name}`)}
                    params={scopedParams(sekolah)}
                    className="text-brand hover:underline"
                  >
                    {p.nama_lengkap ?? p.name}
                  </Link>
                </td>
                <td className="px-3 py-2"><RoleBadges roles={apiRoleBadges(p)} /></td>
                <td className="px-3 py-2">
                  <Badge tone={p.is_aktif === 1 ? "success" : "neutral"}>
                    {p.is_aktif === 1 ? "Aktif" : "Non-aktif"}
                  </Badge>
                </td>
                <td className="px-3 py-2">{p.jabatan_fungsional ?? "—"}</td>
                <td className="px-3 py-2">{p.status_kepegawaian ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !q.isLoading ? (
          <div className="px-3 py-6 text-center text-sm text-muted-fg">
            {q.error ? `Gagal memuat: ${String(q.error)}` : "Tidak ada pegawai sesuai filter."}
          </div>
        ) : null}
      </div>

      <PegawaiFormModal open={showCreate} onClose={() => setShowCreate(false)} mode="create" />
    </div>
  );
}
