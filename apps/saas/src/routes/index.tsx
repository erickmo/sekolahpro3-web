import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@sekolahpro/ui";

function Home() {
  return (
    <>
      <PageHeader title="Tenants" description="Daftar sekolah aktif" />
      <EmptyState title="Belum ada tenant" description="Onboard sekolah pertama untuk mulai." />
    </>
  );
}

export const Route = createFileRoute("/")({ component: Home });
