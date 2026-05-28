import { createFileRoute } from "@tanstack/react-router";
import {
  Avatar,
  Badge,
  InfoField,
  PageHeader,
  SectionCard,
} from "@sekolahpro/ui";
import { useSession } from "@sekolahpro/auth";
import { useTenant } from "@sekolahpro/tenant";

function Profil() {
  const session = useSession();
  const tenant = useTenant();
  const name = session.user ?? "Siswa";
  const tenantName = tenant.data?.name ?? "SekolahPro";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Akun"
        title="Profil"
        description="Data akun dan sekolah."
      />

      <SectionCard>
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <div className="text-lg font-semibold text-fg truncate">{name}</div>
            <div className="text-xs text-muted-fg">Siswa · {tenantName}</div>
            <div className="mt-2 flex gap-2">
              <Badge tone="success" dot>Aktif</Badge>
              {session.roles.map((r) => (
                <Badge key={r} tone="neutral">{r}</Badge>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Identitas">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoField label="Username" value={name} />
          <InfoField label="Sekolah" value={tenantName} />
        </div>
      </SectionCard>
    </div>
  );
}

export const Route = createFileRoute("/profil")({ component: Profil });
