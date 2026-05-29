import { Avatar, Badge } from "@sekolahpro/ui";
import { RoleBadges } from "./RoleBadges";
import { apiRoleBadges, type PegawaiApi } from "./roles";

export function ApiPegawaiHeader({ pegawai }: { pegawai: PegawaiApi }) {
  const isActive = pegawai.is_aktif === 1;
  const badges = apiRoleBadges(pegawai);
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-bg p-4">
      <Avatar name={pegawai.nama_lengkap ?? pegawai.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-fg truncate">
            {pegawai.nama_lengkap ?? pegawai.name}
          </h1>
          <Badge tone={isActive ? "success" : "neutral"}>
            {isActive ? "Aktif" : "Non-aktif"}
          </Badge>
        </div>
        <div className="text-sm text-muted-fg">
          NIP {pegawai.nip ?? "—"} · {pegawai.jabatan_fungsional ?? "—"} · {pegawai.status_kepegawaian ?? "—"}
        </div>
        <div className="mt-2">
          <RoleBadges roles={badges} />
        </div>
      </div>
    </div>
  );
}
