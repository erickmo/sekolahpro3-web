import { Avatar, Badge } from "@sekolahpro/ui";
import type { Pegawai } from "../../data/pegawai";
import { RoleBadges } from "./RoleBadges";

const STATUS_TONE: Record<Pegawai["status"], "success" | "warning" | "neutral" | "danger"> = {
  "Aktif": "success",
  "Cuti": "warning",
  "Non-aktif": "neutral",
  "Pensiun": "neutral",
  "Kontrak Berakhir": "danger",
};

export function PegawaiHeader({ pegawai }: { pegawai: Pegawai }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-bg p-4">
      <Avatar name={pegawai.namaLengkap} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-fg truncate">{pegawai.namaLengkap}</h1>
          <Badge tone={STATUS_TONE[pegawai.status]}>{pegawai.status}</Badge>
        </div>
        <div className="text-sm text-muted-fg">
          NIP {pegawai.nip} · {pegawai.jabatanUtama} · {pegawai.statusKepegawaian}
        </div>
        <div className="mt-2">
          <RoleBadges roles={pegawai.roles} />
        </div>
      </div>
    </div>
  );
}
