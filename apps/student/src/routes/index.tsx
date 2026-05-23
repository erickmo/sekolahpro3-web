import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@sekolahpro/ui";

function Home() {
  return (
    <>
      <PageHeader title="Beranda Siswa" description="Aktivitas dan jadwal kamu" />
      <EmptyState title="Belum ada aktivitas" description="Cek lagi nanti." />
    </>
  );
}

export const Route = createFileRoute("/")({ component: Home });
