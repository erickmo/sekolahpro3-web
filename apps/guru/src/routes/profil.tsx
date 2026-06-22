import { createFileRoute } from "@tanstack/react-router";
import { Badge, PageHeader, SectionCard } from "@sekolahpro/ui";
import { useSession } from "@sekolahpro/auth";

const PEGAWAI_ROLES = ["Pegawai Guru", "Pegawai Staff"];

function ProfilPage() {
  const session = useSession();
  const roles = session.roles ?? [];
  const pegawaiRoles = roles.filter((r) => PEGAWAI_ROLES.includes(r));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Akun" title="Profil" description="Informasi akun pegawai Anda." />

      <SectionCard title="Akun">
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-fg">Pengguna</dt>
            <dd className="font-medium text-fg">{session.user ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-muted-fg">Peran Pegawai</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {pegawaiRoles.length > 0 ? (
                pegawaiRoles.map((r) => (
                  <Badge key={r} tone="brand">
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-fg">—</span>
              )}
            </dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/profil")({ component: ProfilPage });
