import { Badge } from "@sekolahpro/ui";
import type { RolePegawai } from "../../data/pegawai";

export function RoleBadges({ roles }: { roles: RolePegawai[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {roles.includes("guru") ? <Badge tone="brand">Guru</Badge> : null}
      {roles.includes("staff") ? <Badge tone="success">Staff</Badge> : null}
    </div>
  );
}
