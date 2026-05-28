import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";
import { useResourceList } from "@sekolahpro/api-client";
import { Alert, PageHeader } from "@sekolahpro/ui";
import { TellerWorkspace } from "../components/koperasi/TellerWorkspace";

type SesiRow = { name: string; status: string };

function WorkspaceGate() {
  const { sekolah } = useParams({ from: "/$sekolah" });

  const session = useSession();
  const user = session.user;
  const q = useResourceList<SesiRow>(
    "Sesi Kas Teller",
    {
      fields: ["name", "status"],
      filters: [
        ["teller", "=", user ?? ""],
        ["status", "=", "Aktif"],
      ],
      limit_page_length: 1,
    },
    { enabled: !!user },
  );

  if (q.isLoading) {
    return <div className="py-16 text-center text-sm text-muted-fg">Memuat sesi…</div>;
  }

  const active = q.data?.[0];
  if (!active) {
    return (
      <Alert tone="warning" title="Sesi kas belum dibuka">
        <div className="space-y-2">
          <p className="text-sm">Buka sesi kas di halaman Kas Teller untuk mulai bekerja di Workspace.</p>
          <Link
            to="/$sekolah/koperasi/kas-teller" params={{ sekolah }}
            className="inline-flex items-center rounded-md border border-border bg-bg px-3 py-1.5 text-sm font-medium hover:bg-bg-subtle"
          >
            Buka di Kas Teller
          </Link>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Koperasi"
        title="Teller Workspace"
        description={`Sesi aktif ${active.name} — Scan RFID, hotkey F2-F5, Esc untuk reset.`}
      />
      <TellerWorkspace />
    </div>
  );
}

export const Route = createFileRoute("/$sekolah/koperasi/workspace")({ component: WorkspaceGate });
