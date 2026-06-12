import { createFileRoute, Link, useParams} from "@tanstack/react-router";
import { useSession } from "@sekolahpro/auth";
import { useResourceList } from "@sekolahpro/api-client";
import { Alert, PageHeader } from "@sekolahpro/ui";
import { TellerWorkspace } from "../components/koperasi/TellerWorkspace";
import { KoperasiPageGuide } from "../components/koperasi/KoperasiPageGuide";

type SesiRow = { name: string; status: string };

function WorkspaceGate() {
  const { sekolah } = useParams({ from: "/kop/$sekolah" });

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
      <div className="space-y-4">
        <KoperasiPageGuide id="workspace" />
        <Alert tone="warning" title="Sesi kas belum dibuka">
          <div className="space-y-2">
            <p className="text-sm">Buka sesi kas di halaman Kas Teller untuk mulai melayani lewat Layanan Cepat.</p>
            <Link
              to="/kop/$sekolah/kas-teller" params={{ sekolah }}
              className="inline-flex items-center rounded-md border border-border bg-bg px-3 py-1.5 text-sm font-medium hover:bg-bg-subtle"
            >
              Buka di Kas Teller
            </Link>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Koperasi"
        title="Layanan Cepat"
        description={`Sesi aktif ${active.name} — Scan RFID, hotkey F2-F5, Esc untuk reset.`}
      />
      <KoperasiPageGuide id="workspace" />
      <TellerWorkspace />
    </div>
  );
}

export const Route = createFileRoute("/kop/$sekolah/workspace")({ component: WorkspaceGate });
