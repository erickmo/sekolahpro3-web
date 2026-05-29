import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, SectionCard, Button } from "@sekolahpro/ui";
import { RequireAuth, useSession, logout } from "@sekolahpro/auth";
import { useActiveChild } from "../lib/activeChild";

function ProfilPage() {
  const session = useSession();
  const navigate = useNavigate();
  const { children } = useActiveChild();

  async function onLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profil" />
      <SectionCard title="Identitas">
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-fg">Username</dt>
            <dd className="mt-0.5 text-fg">{session.user ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-fg">Peran</dt>
            <dd className="mt-0.5 text-fg">
              {session.roles.length > 0 ? session.roles.join(", ") : "-"}
            </dd>
          </div>
        </dl>
      </SectionCard>
      <SectionCard title="Anak tertaut" padded={false}>
        {children.length === 0 ? (
          <div className="px-5 py-4 text-sm text-muted-fg">Tidak ada anak tertaut.</div>
        ) : (
          <ul className="divide-y divide-border">
            {children.map((c) => (
              <li key={c.nis} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-fg">{c.nama}</div>
                  <div className="text-xs text-muted-fg">
                    {c.kelas} · NIS {c.nis}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      <div>
        <Button variant="outline" onClick={onLogout}>
          Keluar
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/profil")({
  component: () => (
    <RequireAuth>
      <ProfilPage />
    </RequireAuth>
  ),
});
