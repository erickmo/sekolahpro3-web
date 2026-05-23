import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState, Button } from "@sekolahpro/ui";

function Home() {
  return (
    <>
      <PageHeader title="Beranda" description="Ringkasan sekolah hari ini" />
      <EmptyState
        title="Belum ada data"
        description="Modul akan muncul setelah onboarding selesai."
        action={<Button>Mulai onboarding</Button>}
      />
    </>
  );
}

export const Route = createFileRoute("/")({ component: Home });
